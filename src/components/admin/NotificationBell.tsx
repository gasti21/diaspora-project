"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell, BellOff, MessagesSquare, Package } from "lucide-react";
import { STATS_EVENT } from "./admin-nav";
import { cn, timeAgo } from "@/lib/utils";
import type { Product } from "@/lib/types";
import type { SupportSession } from "@/lib/data";

interface NotificationItem {
  key: string;
  kind: "pending" | "support";
  title: string;
  subtitle: string;
  time: string;
  href: string;
}

/**
 * Lonceng notifikasi admin: daftar HAL yang butuh tindakan (bukan statistik).
 * Isi: pengajuan pending terbaru + pesan support belum dibaca. Badge merah =
 * jumlah total notifikasi; daftar menyegarkan saat aksi admin terjadi
 * (event STATS_EVENT) dan tiap kali panel dibuka.
 */
export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[] | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const [pendingRes, supportRes] = await Promise.all([
        fetch("/api/admin/products?status=pending&halaman=1"),
        fetch("/api/admin/support?tab=active"),
      ]);
      const next: NotificationItem[] = [];

      if (pendingRes.ok) {
        const json = (await pendingRes.json()) as { data?: Product[] };
        for (const p of (json.data ?? []).slice(0, 5)) {
          next.push({
            key: `p-${p.id}`,
            kind: "pending",
            title: `"${p.name}" menunggu review`,
            subtitle: `${p.ownerName} - ${p.country}`,
            time: timeAgo(p.createdAt),
            href: "/admin/produk?status=pending",
          });
        }
      }

      if (supportRes.ok) {
        const json = (await supportRes.json()) as { sessions?: SupportSession[] };
        for (const s of (json.sessions ?? []).filter((x) => x.unread).slice(0, 3)) {
          next.push({
            key: `s-${s.id}`,
            kind: "support",
            title: `Pesan baru dari ${s.userName}`,
            subtitle: s.subject || "Chat support",
            time: timeAgo(s.lastMessageAt),
            href: "/admin/support",
          });
        }
      }

      setItems(next);
    } catch {
      // biarkan state lama; badge cukup kosong
    }
  }, []);

  useEffect(() => {
    load();
    window.addEventListener(STATS_EVENT, load);
    return () => window.removeEventListener(STATS_EVENT, load);
  }, [load]);

  // muat ulang tiap kali panel dibuka supaya isinya selalu fresh
  useEffect(() => {
    if (open) load();
  }, [open, load]);

  // tutup dropdown saat klik di luar
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const count = items?.length ?? 0;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifikasi admin"
        aria-expanded={open}
        className={cn(
          "relative flex h-10 w-10 items-center justify-center rounded-lg border bg-white transition",
          count > 0
            ? "border-brand/30 text-brand"
            : "border-line text-navy hover:bg-surface"
        )}
      >
        <Bell className="h-4.5 w-4.5" aria-hidden="true" />
        {count > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-bold text-white shadow-sm">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>

      {open && (
        <div className="animate-fade-in absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-line bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <p className="text-sm font-bold text-navy">Notifikasi</p>
            {count > 0 && (
              <span className="rounded-full bg-brand-soft px-2 py-0.5 text-[10px] font-bold text-brand">
                {count} perlu tindakan
              </span>
            )}
          </div>

          {items === null ? (
            <div className="px-4 py-10 text-center text-xs text-muted">Memuat notifikasi…</div>
          ) : count === 0 ? (
            <div className="px-4 py-10 text-center">
              <BellOff className="mx-auto h-7 w-7 text-muted/40" aria-hidden="true" />
              <p className="mt-2.5 text-sm font-semibold text-navy">Tidak ada notifikasi baru</p>
              <p className="mt-1 text-xs text-muted">
                Pengajuan pending dan pesan support akan muncul di sini.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-line/70">
              {items.map((item) => (
                <li key={item.key}>
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="flex items-start gap-3 px-4 py-3 transition hover:bg-surface"
                  >
                    <span
                      className={cn(
                        "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                        item.kind === "pending"
                          ? "bg-amber-50 text-amber-600"
                          : "bg-brand-soft text-brand"
                      )}
                    >
                      {item.kind === "pending" ? (
                        <Package className="h-4 w-4" aria-hidden="true" />
                      ) : (
                        <MessagesSquare className="h-4 w-4" aria-hidden="true" />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-navy">
                        {item.title}
                      </span>
                      <span className="block truncate text-xs text-muted">{item.subtitle}</span>
                    </span>
                    <span className="shrink-0 text-[10px] text-muted/70">{item.time}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
