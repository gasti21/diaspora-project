import Link from "next/link";
import { CircleUserRound } from "lucide-react";
import { Logo } from "@/components/branding/Logo";
import { NavLinks } from "./NavLinks";
import { UserMenu } from "./UserMenu";
import { MobileMenu } from "./MobileMenu";
import { getSessionUser, getAdminUser } from "@/lib/auth";

// Link menu utama (desktop & drawer mobile) - link aktif di-highlight
// oleh <NavLinks>, bukan disembunyikan, supaya posisi menu stabil.
const LINKS = [
  { href: "/", label: "Home" },
  { href: "/explore", label: "Explore Produk" },
  { href: "/tentang", label: "Tentang Kami" },
  { href: "/kontak", label: "Kontak" },
];

/**
 * Navbar satu baris (desktop + mobile).
 * Mobile memakai tombol hamburger yang membuka drawer slide-in
 * (komponen MobileMenu) - tidak lagi ada baris link scroll-horizontal
 * di bawah header yang bikin navbar tampak "dobel".
 */
export async function Navbar() {
  const user = await getSessionUser();
  const admin = user ? await getAdminUser() : null;

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Logo />

        <NavLinks links={LINKS} className="hidden items-center gap-7 lg:flex" />

        <div className="flex items-center gap-2.5">
          <Link
            href="/submit"
            className="hidden rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark sm:inline-block"
          >
            Submit Produk
          </Link>

          {user ? (
            <UserMenu user={user} isAdmin={Boolean(admin)} />
          ) : (
            <Link
              href="/login"
              aria-label="Masuk"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-white text-navy transition hover:border-navy/40"
            >
              <CircleUserRound className="h-5 w-5" />
            </Link>
          )}

          {/* Menu mobile: hamburger -> drawer (link member ikut bila login) */}
          <MobileMenu
            user={
              user
                ? {
                    name: user.name,
                    email: user.email,
                    avatarUrl: user.avatarUrl,
                    isAdmin: Boolean(admin),
                  }
                : null
            }
          />
        </div>
      </div>
    </header>
  );
}
