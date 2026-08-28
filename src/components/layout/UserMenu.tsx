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
        <div className="absolute right-0 z-50 mt-2 w-60 rounded-xl border border-line bg-white p-2 shadow-lg">
          <div className="border-b border-line px-3 py-2">
            <p className="truncate text-sm font-semibold">{user.name}</p>
            <p className="truncate text-xs text-muted">{user.email}</p>
          </div>
          <Link
            href="/pengajuan"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm hover:bg-surface"
          >
            <ClipboardList className="h-4 w-4 text-muted" />
            Pengajuan Saya
          </Link>
          <Link
            href="/submit"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm hover:bg-surface"
          >
            <PackagePlus className="h-4 w-4 text-muted" />
            Submit Produk
          </Link>
          {isAdmin && (
            <Link
              href="/admin"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium hover:bg-surface"
            >
              <LayoutDashboard className="h-4 w-4 text-muted" />
              Dashboard Admin
            </Link>
          )}
          <button
            onClick={signOut}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-brand hover:bg-brand-soft"
          >
            <LogOut className="h-4 w-4" />
            Keluar
          </button>
        </div>
      )}
    </div>
  );
}
