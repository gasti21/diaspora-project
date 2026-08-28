"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CircleUserRound, ClipboardList, LayoutDashboard, LogOut, PackagePlus } from "lucide-react";
import type { SessionUser } from "@/lib/auth";

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
        className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-line bg-surface text-navy transition hover:border-navy/40"
      >
        {user.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
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
                // eslint-disable-next-line @next/next/no-img-element
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

          <div className="p-2">
            <p className="px-3 pb-1 pt-1.5 text-[11px] font-semibold uppercase tracking-widest text-muted/70">
              Akun Saya
            </p>
            <Link
              href="/pengajuan"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-navy transition hover:bg-surface"
            >
              <ClipboardList className="h-4 w-4 text-muted" />
              Pengajuan Saya
            </Link>
            <Link
              href="/submit"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-navy transition hover:bg-surface"
            >
              <PackagePlus className="h-4 w-4 text-muted" />
              Submit Produk
            </Link>
          </div>

          {isAdmin && (
            <div className="border-t border-line p-2">
              <p className="px-3 pb-1 pt-1.5 text-[11px] font-semibold uppercase tracking-widest text-muted/70">
                Admin
              </p>
              <Link
                href="/admin"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
              >
                <LayoutDashboard className="h-4 w-4" />
                Dashboard Admin
              </Link>
            </div>
          )}

          <div className="border-t border-line p-2">
            <button
              onClick={signOut}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium text-brand transition hover:bg-brand-soft"
            >
              <LogOut className="h-4 w-4" />
              Keluar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
