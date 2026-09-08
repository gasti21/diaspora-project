"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { STATS_EVENT } from "@/components/admin/admin-nav";

/**
 * Auto-update tanpa reload: mendengarkan perubahan database via
 * Supabase Realtime (postgres_changes). Saat ada data baru/berubah,
 * server components di-refresh secara halus (router.refresh) -
 * tanpa reload halaman, tanpa kedip.
 *
 * Dipasang di layout admin dan member. Keamanan tetap dipegang RLS:
 * client hanya menerima event untuk baris yang boleh dibacanya.
 */
export default function RealtimeRefresher({
  scope,
}: {
  scope: "admin" | "member" | "public";
}) {
  const router = useRouter();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const supabase = createClient();

    const scheduleRefresh = () => {
      if (typeof document !== "undefined" && document.hidden) return;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        router.refresh();
        if (scope === "admin") window.dispatchEvent(new Event(STATS_EVENT));
      }, 600);
    };

    const channel = supabase
      .channel(`realtime-refresher-${scope}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "products" },
        scheduleRefresh
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "product_reviews" },
        scheduleRefresh
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "support_messages" },
        scheduleRefresh
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [router, scope]);

  return null;
}
