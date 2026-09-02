"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Lock, Send } from "lucide-react";
import { cn, timeAgo } from "@/lib/utils";
import { useToast } from "@/components/toast/ToastProvider";
import { useChatSync } from "./useChatSync";
import type { SupportMessage, SupportSession } from "@/lib/data";

interface Props {
  session: SupportSession;
  initialMessages: SupportMessage[];
  /** Id pengirim "pihak saya" - menentukan bubble kanan/kiri. */
  selfId: string;
  /** Base API: /api/support/sessions/[id] (user) atau /api/admin/support/[id]. */
  apiBase: string;
  /** Label pihak lawan di bubble kiri (mis. "Tim Support" / nama user). */
  peerLabel: string;
}

/**
 * Panel percakapan chat: bubble kiri/kanan, auto-scroll, kirim dengan
 * Enter (Shift+Enter = baris baru), indikator live, dan banner read-only
 * permanen saat sesi sudah ditutup.
 */
export function ChatPanel({ session, initialMessages, selfId, apiBase, peerLabel }: Props) {
  const toast = useToast();
  const [messages, setMessages] = useState<SupportMessage[]>(initialMessages);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [closed, setClosed] = useState(session.status === "closed");
  const bottomRef = useRef<HTMLDivElement>(null);
  const seenRef = useRef(new Set(initialMessages.map((m) => m.id)));

  // Terima pesan baru (realtime/poll) - dedup by id.
  const onIncoming = useCallback((m: SupportMessage) => {
    if (seenRef.current.has(m.id)) return;
    seenRef.current.add(m.id);
    setMessages((prev) => [...prev, m]);
  }, []);

  const { live } = useChatSync(session.id, `${apiBase}/messages`, onIncoming);

  // Auto-scroll ke pesan terbaru.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

  // Tandai dibaca saat panel dibuka / ada pesan baru dari lawan.
  useEffect(() => {
    void fetch(apiBase, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "read" }),
    }).catch(() => {});
  }, [apiBase, messages.length]);

  async function send() {
    const text = draft.trim();
    if (!text || sending || closed) return;
    setSending(true);
    try {
      const res = await fetch(`${apiBase}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: text }),
      });
      const json = (await res.json()) as { message?: SupportMessage; error?: string };
      if (!res.ok || !json.message) {
        toast.error(json.error ?? "Gagal mengirim pesan. Coba lagi.");
        if (json.error?.includes("ditutup")) setClosed(true);
        return;
      }
      onIncoming(json.message);
      setDraft("");
    } catch {
      toast.error("Koneksi bermasalah. Coba lagi.");
    } finally {
      setSending(false);
    }
  }

  const closedNote =
    session.closedBy === "auto"
      ? "Sesi ditutup otomatis karena tidak ada aktivitas selama 48 jam."
      : session.closedBy === "admin"
        ? "Sesi ini telah diselesaikan oleh tim kami."
        : "Sesi ini telah ditutup.";

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Indikator koneksi */}
      <div className="flex items-center justify-end gap-1.5 border-b border-line px-4 py-2">
        <span
          className={cn("h-1.5 w-1.5 rounded-full", live ? "bg-emerald-500" : "bg-amber-400")}
          aria-hidden="true"
        />
        <span className="text-[11px] font-medium text-muted">
          {live ? "Realtime aktif" : "Mode jeda (sinkron berkala)"}
        </span>
      </div>

      {/* Aliran pesan */}
      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.map((m) => {
          const mine = m.senderId === selfId;
          return (
            <div key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[78%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm",
                  mine
                    ? "rounded-br-md bg-navy text-white"
                    : "rounded-bl-md border border-line bg-white text-navy"
                )}
              >
                {!mine && (
                  <p className="mb-0.5 text-[11px] font-bold text-brand">{peerLabel}</p>
                )}
                <p className="whitespace-pre-wrap break-words">{m.body}</p>
                <p
                  className={cn(
                    "mt-1 text-right text-[10px]",
                    mine ? "text-white/60" : "text-muted/70"
                  )}
                >
                  {timeAgo(m.createdAt)}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input / banner closed */}
      {closed ? (
        <div className="border-t border-line bg-surface px-4 py-3">
          <p className="flex items-center gap-2 text-xs font-medium text-muted">
            <Lock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            {closedNote} Riwayat percakapan tetap bisa dibaca.
          </p>
        </div>
      ) : (
        <div className="border-t border-line bg-white px-3 py-3">
          <div className="flex items-end gap-2">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void send();
                }
              }}
              rows={1}
              maxLength={2000}
              placeholder="Tulis pesan… (Enter untuk kirim, Shift+Enter baris baru)"
              className="max-h-32 flex-1 resize-none rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm text-navy outline-none transition placeholder:text-muted/60 focus:border-brand/50 focus:bg-white"
            />
            <button
              onClick={() => void send()}
              disabled={sending || !draft.trim()}
              aria-label="Kirim pesan"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Send className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
