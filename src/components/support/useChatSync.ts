"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { SupportMessage } from "@/lib/data";

/**
 * Sinkronisasi pesan chat secara hybrid:
 * 1. Supabase Realtime (postgres_changes di support_messages) - instan.
 * 2. Polling incremental (?after=) tiap 30 detik - jaring pengaman
 *    bila socket putus. Dedup antar keduanya by id di pemanggil.
 */
export function useChatSync(
  sessionId: string,
  messagesPath: string,
  onIncoming: (m: SupportMessage) => void
) {
  const callbackRef = useRef(onIncoming);
  callbackRef.current = onIncoming;
  const afterRef = useRef<string | null>(null);
  const [live, setLive] = useState(false);

  const fetchLatest = useCallback(async () => {
    try {
      const qs = afterRef.current ? `?after=${encodeURIComponent(afterRef.current)}` : "";
      const res = await fetch(`${messagesPath}${qs}`, { cache: "no-store" });
      if (!res.ok) return;
      const json = (await res.json()) as { messages?: SupportMessage[] };
      for (const m of json.messages ?? []) {
        afterRef.current = m.createdAt;
        callbackRef.current(m);
      }
    } catch {
      // diam saja - percobaan berikutnya dalam 30 detik
    }
  }, [messagesPath]);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const supabase = createClient();

    const channel = supabase
      .channel(`support:${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "support_messages",
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          const r = payload.new as {
            id: string;
            session_id: string;
            sender_id: string;
            body: string;
            created_at: string;
          };
          afterRef.current = r.created_at;
          callbackRef.current({
            id: r.id,
            sessionId: r.session_id,
            senderId: r.sender_id,
            body: r.body,
            createdAt: r.created_at,
          });
        }
      )
      .subscribe((status) => setLive(status === "SUBSCRIBED"));

    // Fallback poll 30 detik; lebih rapat (5 dtk) saat socket belum tersambung.
    const slow = setInterval(fetchLatest, 30_000);
    const fast = setInterval(() => {
      setLive((isLive) => {
        if (!isLive) void fetchLatest();
        return isLive;
      });
    }, 5_000);

    return () => {
      clearInterval(slow);
      clearInterval(fast);
      void supabase.removeChannel(channel);
    };
  }, [sessionId, fetchLatest]);

  return { live };
}
