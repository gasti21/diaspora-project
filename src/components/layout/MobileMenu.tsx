"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  CircleUserRound,
  ClipboardList,
  Heart,
  House,
  Info,
  LayoutDashboard,
  LogIn,
  LogOut,
  Mail,
  Menu,
  PackagePlus,
  Search,
  UserRound,
  X,
  type LucideIcon,
} from "lucide-react";
import { LogoMark } from "@/components/branding/Logo";
import { useToast } from "@/components/toast/ToastProvider";
import { cn } from "@/lib/utils";

export interface MobileMenuUser {
  name: string;
  email: string;
  avatarUrl?: string;
  isAdmin: boolean;
}

const PUBLIC_LINKS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/", label: "Home", icon: House },
  { href: "/explore", label: "Explore Produk", icon: Search },
  { href: "/tentang", label: "Tentang Kami", icon: Info },
  { href: "/kontak", label: "Kontak", icon: Mail },
];

const MEMBER_LINKS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/dashboard", label: "Dashboard Saya", icon: LayoutDashboard },
  { href: "/pengajuan", label: "Pengajuan Saya", icon: ClipboardList },
  { href: "/favorit", label: "Favorit", icon: Heart },
  { href: "/profil", label: "Profil Saya", icon: UserRound },
];

/**
 * Menu mobile navbar publik: tombol hamburger membuka drawer slide-in
 * dari kiri (pola sama dengan admin) lengkap dengan link member bila
 * sedang login. Menggantikan strip link scroll-horizontal yang lama.
 */
export function MobileMenu({ user }: { user: MobileMenuUser | null }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const toast = useToast();

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

  async function signOut() {
    await fetch("/auth/signout", { method: "POST" });
    setOpen(false);
    toast.info("Anda sudah keluar dari akun.");
    router.push("/");
    router.refresh();
  }

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const itemCls = (active: boolean) =>
    cn(
      "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition",
      active ? "bg-navy text-white" : "text-navy/80 hover:bg-surface hover:text-navy"
    );

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Buka menu"
        aria-expanded={open}
        className="flex h-10 w-10 items-center justify-center rounded-lg border border-line bg-white text-navy transition hover:bg-surface lg:hidden"
      >
        <Menu className="h-5 w-5" aria-hidden="true" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="animate-overlay-in absolute inset-0 bg-navy-deep/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />

          <aside className="animate-drawer-left-in absolute inset-y-0 left-0 flex w-80 max-w-[85vw] flex-col bg-white shadow-2xl">
            {/* Kepala drawer */}
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <div className="flex items-center gap-2.5">
                <LogoMark className="h-8 w-8" />
                <p className="text-base font-extrabold text-navy">
                  Karya<span className="text-brand">Diaspora</span>
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Tutup menu"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-surface text-navy transition hover:bg-line"
              >
                <X className="h-4.5 w-4.5" aria-hidden="true" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4">
              {/* Navigasi utama */}
              <p className="px-1 pb-2 text-[11px] font-semibold uppercase tracking-widest text-muted/70">
                Navigasi
              </p>
              <nav className="space-y-1">
                {PUBLIC_LINKS.map((l) => (
                  <Link key={l.href} href={l.href} className={cn(itemCls(isActive(l.href)), !user && l.href === "/" && "bg-navy text-white")}>
                    <l.icon className="h-4.5 w-4.5" aria-hidden="true" />
                    {l.label}
                  </Link>
                ))}
              </nav>

              {/* Menu member - hanya saat login; admin hanya melihat
                  Panel Admin (menu member & CTA submit bukan ranahnya) */}
              {user && (
                <>
                  <p className="px-1 pb-2 pt-5 text-[11px] font-semibold uppercase tracking-widest text-muted/70">
                    {user.isAdmin ? "Admin" : "Akun Saya"}
                  </p>
                  <nav className="space-y-1">
                    {user.isAdmin && (
                      <Link
                        href="/admin"
                        className={cn(itemCls(false), "font-semibold text-blue-700 hover:bg-blue-50")}
                      >
                        <LayoutDashboard className="h-4.5 w-4.5" aria-hidden="true" />
                        Panel Admin
                      </Link>
                    )}
                    {!user.isAdmin &&
                      MEMBER_LINKS.map((l) => (
                        <Link key={l.href} href={l.href} className={itemCls(isActive(l.href))}>
                          <l.icon className="h-4.5 w-4.5" aria-hidden="true" />
                          {l.label}
                        </Link>
                      ))}
                  </nav>
                </>
              )}

              {/* CTA Submit Produk - tamu diarahkan login dulu; admin tersembunyi */}
              {(!user || !user.isAdmin) && (
                <Link
                  href={user ? "/submit" : "/login?next=%2Fsubmit"}
                  className="mt-5 flex items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-brand-dark"
                >
                  <PackagePlus className="h-4.5 w-4.5" aria-hidden="true" />
                  Submit Produk
                </Link>
              )}

              {/* Ajakan masuk untuk tamu */}
              {!user && (
                <Link
                  href="/login"
                  className="mt-2.5 flex items-center justify-center gap-2 rounded-xl border border-line bg-white px-4 py-3 text-sm font-semibold text-navy transition hover:bg-surface"
                >
                  <LogIn className="h-4.5 w-4.5" aria-hidden="true" />
                  Masuk dengan Google
                </Link>
              )}
            </div>

            {/* Kaki drawer: profil + keluar */}
            {user && (
              <div className="space-y-3 border-t border-line p-4">
                <div className="flex items-center gap-3 px-1">
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
                <button
                  onClick={signOut}
                  className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-brand transition hover:bg-brand-soft"
                >
                  <LogOut className="h-4.5 w-4.5" aria-hidden="true" />
                  Keluar
                </button>
              </div>
            )}
          </aside>
        </div>
      )}
    </>
  );
}
