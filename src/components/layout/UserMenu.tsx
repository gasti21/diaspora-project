"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CircleUserRound,
  ClipboardList,
  Heart,
  LayoutDashboard,
  LogOut,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import type { SessionUser } from "@/lib/auth";

/** Item menu dropdown akun. */
function MenuItem({
  href,
  icon: Icon,
  label,
  onClick,
  accent,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
  onClick?: () => void;
  accent?: "blue" | "brand";
}) {
  const cls =
    accent === "blue"
      ? "font-semibold text-blue-700 hover:bg-blue-50"
      : accent === "brand"
        ? "font-medium text-brand hover:bg-brand-soft"
        : "font-medium text-navy hover:bg-surface";
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition ${cls}`}
    >
      <Icon className="h-4 w-4 text-muted" aria-hidden="true" />
      {label}
    </Link>
  );
}

export function UserMenu({ user, isAdmin }: { user: SessionUser; isAdmin: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  async function signOut() {
    await fetch("/auth/signout", { method: "POST" });
    setOpen(false);
    router.push("/");
    router.refresh();
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Menu akun"
        aria-expanded={open}
        className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-line bg-white text-navy transition hover:border-navy/40"
      >
        {user.avatarUrl ? (
          <img src={user.avatarUrl} alt={user.name} className="h-full w-full object-cover" />
        ) : (
          <CircleUserRound className="h-5 w-5" />
        )}
      </button>

      {open && (
        <div className="animate-fade-in absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-2xl border border-line bg-white shadow-xl">
          <div className="flex items-center gap-3 border-b border-line px-4 py-3.5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name} className="h-full w-full object-cover" />
              ) : (
                <CircleUserRound className="h-5 w-5 text-muted" />
              )}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-navy">{user.name}</p>
              <p className="truncate text-xs text-muted">{user.email}</p>
            </div>
          </div>

          {/* Admin: menu admin diprioritaskan paling atas */}
          {isAdmin && (
            <div className="p-2">
              <p className="px-3 pb-1 pt-1.5 text-[11px] font-semibold uppercase tracking-widest text-muted/70">
                Admin
              </p>
              <MenuItem href="/admin" icon={LayoutDashboard} label="Panel Admin" onClick={() => setOpen(false)} accent="blue" />
            </div>
          )}

          {/* Menu member: tampil untuk semua user (admin pun butuh akses
              cepat ke dashboard/profil); admin dapat kedua seksi. */}
          <div className="border-t border-line p-2">
            <p className="px-3 pb-1 pt-1.5 text-[11px] font-semibold uppercase tracking-widest text-muted/70">
              Akun Saya
            </p>
            <MenuItem href="/dashboard" icon={LayoutDashboard} label="Dashboard Saya" onClick={() => setOpen(false)} />
            <MenuItem href="/pengajuan" icon={ClipboardList} label="Pengajuan Saya" onClick={() => setOpen(false)} />
            <MenuItem href="/favorit" icon={Heart} label="Favorit Saya" onClick={() => setOpen(false)} />
            <MenuItem href="/profil" icon={UserRound} label="Profil Saya" onClick={() => setOpen(false)} />
          </div>

          <div className="border-t border-line p-2">
            <button
              onClick={signOut}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium text-brand transition hover:bg-brand-soft"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Keluar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
