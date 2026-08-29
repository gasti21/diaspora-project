"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CircleUserRound, ExternalLink, Menu, PackagePlus, X } from "lucide-react";
import { MEMBER_NAV, MEMBER_TITLES } from "./member-nav";
import { LogoMark } from "@/components/branding/Logo";
import { cn } from "@/lib/utils";

interface ShellProps {
  user: { name: string; email: string; avatarUrl?: string; isAdmin: boolean };
  children: ReactNode;
}

/**
 * Kerangka area member (user yang sudah login): sidebar navigasi versi
 * terang dengan aksen navy - pola sama dengan Panel Admin supaya UX
 * konsisten. Sidebar jadi drawer di layar kecil.
 */
export function MemberShell({ user, children }: ShellProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const title = MEMBER_TITLES[pathname] ?? "Area Member";

  // tutup drawer setiap pindah halaman
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // kunci scroll body saat drawer terbuka
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const sidebar = (
    <>
      <div className="flex items-center gap-2.5 px-5 pb-6 pt-6">
        <LogoMark className="h-8 w-8 shrink-0" />
        <div className="min-w-0">
          <p className="truncate text-base font-extrabold text-navy">
            Karya<span className="text-brand">Diaspora</span>
          </p>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted/60">
            Area Member
          </p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-2 text-sm">
        {MEMBER_NAV.map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3.5 py-2.5 font-medium transition",
                active
                  ? "bg-navy text-white shadow-sm"
                  : "text-navy/75 hover:bg-surface hover:text-navy"
              )}
            >
              <item.icon className="h-4.5 w-4.5" aria-hidden="true" />
              {item.label}
            </Link>
          );
        })}

        {user.isAdmin && (
          <Link
            href="/admin"
            className="flex items-center gap-3 rounded-lg px-3.5 py-2.5 font-semibold text-blue-700 transition hover:bg-blue-50"
          >
            <ExternalLink className="h-4.5 w-4.5" aria-hidden="true" />
            Panel Admin
          </Link>
        )}
      </nav>

      {/* CTA utama area member - satu-satunya pintu Submit Produk;
          disembunyikan untuk admin (kurator tidak mengajukan produk) */}
      {!user.isAdmin && (
        <div className="px-4 pb-3">
          <Link
            href="/submit"
            className="flex items-center justify-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-brand-dark"
          >
            <PackagePlus className="h-4.5 w-4.5" aria-hidden="true" />
            Submit Produk
          </Link>
        </div>
      )}

      <div className="space-y-2 border-t border-line p-4">
        <div className="flex items-center gap-3 rounded-xl bg-surface px-3.5 py-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white text-navy">
            {user.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.avatarUrl} alt={user.name} className="h-full w-full object-cover" />
            ) : (
              <CircleUserRound className="h-5 w-5" aria-hidden="true" />
            )}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-navy">{user.name}</p>
            <p className="truncate text-[11px] text-muted">{user.email}</p>
          </div>
        </div>
        <Link
          href="/"
          className="flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-medium text-navy/70 transition hover:bg-surface hover:text-navy"
        >
          <ExternalLink className="h-4.5 w-4.5" aria-hidden="true" />
          Jelajahi Katalog
        </Link>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-surface">
      {/* Sidebar desktop */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-line bg-white lg:flex">
        {sidebar}
      </aside>

      {/* Drawer mobile */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="animate-overlay-in absolute inset-0 bg-navy-deep/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <aside className="animate-drawer-left-in absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-white shadow-2xl">
            {sidebar}
          </aside>
          <button
            onClick={() => setOpen(false)}
            aria-label="Tutup menu"
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-surface text-navy"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar */}
        <header className="sticky top-0 z-40 border-b border-line bg-white/90 backdrop-blur">
          <div className="flex h-14 items-center gap-3 px-4 sm:px-6 lg:px-8">
            <button
              onClick={() => setOpen(true)}
              aria-label="Buka menu"
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-line bg-white text-navy transition hover:bg-surface lg:hidden"
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
            </button>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-navy">{title}</p>
              <p className="hidden text-xs text-muted sm:block">Area Member KaryaDiaspora</p>
            </div>
            <div className="ml-auto flex items-center gap-2.5">
              <Link
                href="/"
                className="hidden items-center gap-1.5 rounded-lg border border-line px-3 py-2 text-xs font-semibold text-navy transition hover:bg-surface sm:inline-flex"
              >
                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                Jelajahi Katalog
              </Link>
              <span className="inline-flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-line bg-surface text-navy">
                {user.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={user.avatarUrl} alt={user.name} className="h-full w-full object-cover" />
                ) : (
                  <CircleUserRound className="h-5 w-5" aria-hidden="true" />
                )}
              </span>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
