"use client";

import type { ReactNode } from "react";

interface ShellProps {
  children: ReactNode;
}

/**
 * Kerangka area member: tidak ada sidebar maupun topbar terpisah -
 * navigasi & notifikasi sepenuhnya lewat navbar atas (dropdown avatar
 * + ikon lonceng). Konten dipusatkan dengan lebar terbatas.
 */
export function MemberShell({ children }: ShellProps) {
  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <main className="mx-auto w-full max-w-7xl flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
    </div>
  );
}
