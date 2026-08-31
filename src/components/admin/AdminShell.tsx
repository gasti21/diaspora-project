"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { TITLES } from "./admin-nav";
import { NotificationBell } from "./NotificationBell";
import { SidebarNav } from "./SidebarNav";
import { ProfileMenu } from "@/components/auth/ProfileMenu";

interface ShellProps {
  admin: { name: string; email: string; avatarUrl?: string };
  children: ReactNode;
}

/**
 * Kerangka aplikasi admin: sidebar navigasi (navy) + topbar profesional.
 * Topbar memuat hamburger (mobile), judul halaman, lonceng notifikasi
 * real-time, dan avatar admin. Sidebar jadi drawer di layar kecil.
 */
export function AdminShell({ admin, children }: ShellProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const title = TITLES[pathname] ?? "Admin";

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

  const nav = <SidebarNav admin={admin} />;

  return (
    <div className="flex min-h-screen bg-surface">
      {/* Sidebar desktop */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col bg-navy-deep lg:flex">
        {nav}
      </aside>

      {/* Drawer mobile */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="animate-overlay-in absolute inset-0 bg-navy-deep/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <aside className="animate-drawer-left-in absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-navy-deep">
            {nav}
          </aside>
          <button
            onClick={() => setOpen(false)}
            aria-label="Tutup menu"
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white"
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
              <p className="hidden text-xs text-muted sm:block">Panel Admin KaryaDiaspora</p>
            </div>
            <div className="ml-auto flex items-center gap-2.5">
              {/* Notifikasi real-time: badge merah = ada pending */}
              <NotificationBell />
              <span className="hidden h-6 w-px bg-line sm:block" aria-hidden="true" />
              <ProfileMenu
                mode="admin"
                fallback={{ name: admin.name, email: admin.email, avatarUrl: admin.avatarUrl }}
              />
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
