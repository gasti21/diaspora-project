"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ExternalLink, LogOut } from "lucide-react";
import { NAV_GROUPS, STATS_EVENT } from "./admin-nav";
import { LogoMark } from "@/components/branding/Logo";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/toast/ToastProvider";
import type { AdminStats } from "@/lib/types";

interface SidebarNavProps {
  /** Info admin untuk kartu profil di kaki sidebar. */
  admin: { name: string; email: string; avatarUrl?: string };
}

/**
 * Isi sidebar admin (desktop & drawer mobile): menu dikelompokkan per
 * bagian, badge pending & pengguna menyegarkan otomatis lewat event
 * STATS_EVENT setiap kali halaman admin melakukan aksi.
 */
export function SidebarNav({ admin }: SidebarNavProps) {
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

      <nav className="flex-1 overflow-y-auto px-3 pb-4 text-sm">
        {NAV_GROUPS.map((group) => (
          <div key={group.title} className="mb-5">
            <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-widest text-white/35">
              {group.title}
            </p>
            <ul className="space-y-1">
              {group.items.map((item) => {
                const active = item.exact
                  ? pathname === item.href
                  : pathname.startsWith(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "group flex items-center justify-between gap-3 rounded-lg px-3.5 py-2.5 font-medium transition",
                        active
                          ? "bg-brand text-white shadow-sm shadow-brand/30"
                          : "text-white/70 hover:bg-white/5 hover:text-white"
                      )}
                    >
                      <span className="flex items-center gap-3">
                        <item.icon className="h-4.5 w-4.5" aria-hidden="true" />
                        {item.label}
                      </span>
                      <SidebarBadge stat={item.stat} stats={stats} />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Kaki sidebar: profil admin + tautan keluar */}
      <div className="space-y-2 border-t border-white/10 p-4">
        <div className="flex items-center gap-3 rounded-xl bg-white/5 px-3.5 py-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/10 text-white">
            {admin.avatarUrl ? (
              <img src={admin.avatarUrl} alt={admin.name} className="h-full w-full object-cover" />
            ) : (
              <span className="text-xs font-bold uppercase">{admin.name.slice(0, 1)}</span>
            )}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-white">{admin.name}</p>
            <p className="truncate text-[11px] text-white/45">{admin.email}</p>
          </div>
        </div>

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

/** Badge angka di item sidebar (merah bila ada pending yang menunggu). */
function SidebarBadge({
  stat,
  stats,
}: {
  stat?: "pending" | "users";
  stats: AdminStats | null;
}) {
  if (!stats || !stat) return null;
  const value = stats[stat];
  if (stat === "pending") {
    return (
      <span
        className={cn(
          "rounded-full px-2 py-0.5 text-xs font-bold",
          value > 0 ? "bg-white text-brand" : "bg-white/15 text-white/70"
        )}
      >
        {value}
      </span>
    );
  }
  return (
    <span className="rounded-full bg-white/15 px-2 py-0.5 text-xs font-bold text-white/80">
      {value}
    </span>
  );
}
