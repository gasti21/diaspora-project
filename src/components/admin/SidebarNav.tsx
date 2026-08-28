"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ExternalLink, LogOut } from "lucide-react";
import { NAV, STATS_EVENT } from "./admin-nav";
import { LogoMark } from "@/components/branding/Logo";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/toast/ToastProvider";
import type { AdminStats } from "@/lib/types";

/**
 * Isi sidebar admin: dipakai di mode desktop dan drawer mobile.
 * Badge jumlah pending & pengguna menyegarkan otomatis lewat event
 * STATS_EVENT setiap kali halaman admin melakukan aksi.
 */
export function SidebarNav() {
  const router = useRouter();
  const pathname = usePathname();
  const toast = useToast();
  const [stats, setStats] = useState<AdminStats | null>(null);

  const loadStats = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/stats");
      if (res.ok) setStats(await res.json());
    } catch {
      // statistik sidebar pelengkap - gagal fetch tidak fatal
    }
  }, []);

  useEffect(() => {
    loadStats();
    window.addEventListener(STATS_EVENT, loadStats);
    return () => window.removeEventListener(STATS_EVENT, loadStats);
  }, [loadStats]);

  async function signOut() {
    await fetch("/auth/signout", { method: "POST" });
    toast.info("Anda sudah keluar dari panel admin.");
    router.push("/");
    router.refresh();
  }

  return (
    <>
      <div className="flex items-center gap-2.5 px-5 pb-6 pt-6">
        <LogoMark className="h-8 w-8 shrink-0" />
        <div className="min-w-0">
          <p className="truncate text-base font-extrabold text-white">
            Karya<span className="text-red-400">Diaspora</span>
          </p>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-white/40">
            Panel Admin
          </p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 text-sm">
        {NAV.map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center justify-between gap-3 rounded-lg px-3.5 py-2.5 font-medium transition",
                active
                  ? "bg-white/10 text-white"
                  : "text-white/70 hover:bg-white/5 hover:text-white"
              )}
            >
              <span className="flex items-center gap-3">
                <item.icon className="h-4.5 w-4.5" aria-hidden="true" />
                {item.label}
              </span>
              <SidebarBadge href={item.href} stats={stats} />
            </Link>
          );
        })}
      </nav>

      <div className="space-y-2 border-t border-white/10 p-4">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-medium text-white/70 transition hover:bg-white/5 hover:text-white"
        >
          <ExternalLink className="h-4.5 w-4.5" aria-hidden="true" />
          Lihat Situs Publik
        </Link>
        <button
          onClick={signOut}
          className="flex w-full items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-medium text-red-300 transition hover:bg-red-500/10"
        >
          <LogOut className="h-4.5 w-4.5" aria-hidden="true" />
          Keluar
        </button>
      </div>
    </>
  );
}

/** Badge angka di item sidebar (aktif-state styling ditangani AdminShell). */
function SidebarBadge({ href, stats }: { href: string; stats: AdminStats | null }) {
  if (!stats) return null;
  if (href === "/admin/produk")
    return (
      <span
        className={cn(
          "rounded-full px-2 py-0.5 text-xs font-bold",
          stats.pending > 0 ? "bg-brand text-white" : "bg-white/15 text-white/80"
        )}
      >
        {stats.pending}
      </span>
    );
  if (href === "/admin/pengguna")
    return (
      <span className="rounded-full bg-white/15 px-2 py-0.5 text-xs font-bold text-white/80">
        {stats.users}
      </span>
    );
  return null;
}