"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell, CheckCircle2, CircleX, FileText, PenLine, Users } from "lucide-react";
import { STATS_EVENT } from "./admin-nav";
import { cn } from "@/lib/utils";
import type { AdminStats } from "@/lib/types";

/**
 * Lonceng notifikasi admin di topbar: menampilkan badge merah berisi jumlah
 * pengajuan yang menunggu review, plus ringkasan semua status saat dibuka.
 * Menyegarkan otomatis setiap ada aksi admin (event STATS_EVENT).
 */
export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/stats");
      if (res.ok) setStats(await res.json());
    } catch {
      // tidak fatal: badge cukup kosong
    }
  }, []);

  useEffect(() => {
    load();
    window.addEventListener(STATS_EVENT, load);
    return () => window.removeEventListener(STATS_EVENT, load);
  }, [load]);

  // tutup dropdown saat klik di luar
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const pending = stats?.pending ?? 0;

  const items = [
    {
      label: "Menunggu review",
      value: stats?.pending,
      href: "/admin/produk?status=pending",
      icon: FileText,
      chip: pending > 0 ? "bg-amber-50 text-amber-700" : "bg-surface text-muted",
    },
    {
      label: "Sudah tayang",
      value: stats?.published,
      href: "/admin/produk?status=published",
      icon: CheckCircle2,
      chip: "bg-green-50 text-green-700",
    },
    {
      label: "Perlu revisi",
      value: stats?.revision,
      href: "/admin/produk?status=revision",
      icon: PenLine,
      chip: "bg-orange-50 text-orange-700",
    },
    {
      label: "Ditolak",
      value: stats?.rejected,
      href: "/admin/produk?status=rejected",
      icon: CircleX,
      chip: "bg-red-50 text-red-700",
    },
    {
      label: "Pengguna terdaftar",
      value: stats?.users,
      href: "/admin/pengguna",
      icon: Users,
      chip: "bg-navy/10 text-navy",
    },
  ];

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifikasi admin"
        aria-expanded={open}
        className="relative flex h-10 w-10 items-center justify-center rounded-lg border border-line bg-white text-navy transition hover:bg-surface"
      >
        <Bell className="h-4.5 w-4.5" aria-hidden="true" />
        {pending > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-bold text-white shadow-sm">
            {pending > 9 ? "9+" : pending}
          </span>
        )}
      </button>

      {open && (
        <div className="animate-fade-in absolute right-0 z-50 mt-2 w-72 overflow-hidden rounded-2xl border border-line bg-white shadow-xl">
          <div className="border-b border-line px-4 py-3">
            <p className="text-sm font-bold text-navy">Notifikasi Admin</p>
            <p className="mt-0.5 text-xs text-muted">Ringkasan status platform real-time.</p>
          </div>

          <ul className="divide-y divide-line/70">
            {items.map((item) => (
              <li key={item.label}>
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 transition hover:bg-surface"
                >
                  <span className={cn("flex h-8 w-8 items-center justify-center rounded-lg", item.chip)}>
                    <item.icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <span className="flex-1 text-sm font-medium text-navy">{item.label}</span>
                  <span className="text-sm font-bold text-navy">{item.value ?? "–"}</span>
                </Link>
              </li>
            ))}
          </ul>

          <Link
            href="/admin/aktivitas"
            onClick={() => setOpen(false)}
            className="block border-t border-line bg-surface/60 px-4 py-3 text-center text-xs font-semibold text-navy transition hover:bg-surface"
          >
            Lihat semua aktivitas kurasi →
          </Link>
        </div>
      )}
    </div>
  );
}
