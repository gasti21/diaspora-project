"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoMark } from "@/components/branding/Logo";
import { TITLES } from "./admin-nav";
import { NotificationBell } from "./NotificationBell";
import { ProfileMenu } from "@/components/auth/ProfileMenu";

interface ShellProps {
  admin: { name: string; email: string; avatarUrl?: string };
  children: ReactNode;
}

/**
 * Kerangka aplikasi admin v2 - konsisten dengan situs publik:
 * TANPA sidebar. Navigasi panel admin hidup di dalam dropdown profil
 * (klik avatar di kanan atas). Topbar: logo + judul halaman + notifikasi
 * + avatar admin. Konten lebar penuh, max-w-7xl di tengah.
 */
export function AdminShell({ admin, children }: ShellProps) {
  const pathname = usePathname();
  const title = TITLES[pathname] ?? "Admin";

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      {/* Topbar tunggal ala situs publik */}
      <header className="sticky top-0 z-40 border-b border-line bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
          <Link href="/admin" className="flex items-center gap-2.5 transition hover:opacity-80">
            <LogoMark className="h-8 w-8" />
            <span className="text-lg font-extrabold tracking-tight text-navy">
              Karya<span className="text-brand">Diaspora</span>
            </span>
          </Link>

          <span className="hidden h-5 w-px bg-line sm:block" aria-hidden="true" />
          <p className="hidden truncate text-sm font-semibold text-muted sm:block">{title}</p>

          <div className="ml-auto flex items-center gap-3">
            {/* Notifikasi real-time: badge merah = ada pengajuan pending */}
            <NotificationBell />
            <ProfileMenu
              mode="admin"
              fallback={{ name: admin.name, email: admin.email, avatarUrl: admin.avatarUrl }}
            />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 p-4 sm:p-6 lg:px-8 lg:py-8">{children}</main>

      <footer className="border-t border-line bg-white py-4">
        <p className="text-center text-xs text-muted">
          Panel Admin KaryaDiaspora - navigasi tersedia lewat menu profil
        </p>
      </footer>
    </div>
  );
}
