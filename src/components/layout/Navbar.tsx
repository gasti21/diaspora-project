import Link from "next/link";
import { CircleUserRound } from "lucide-react";
import { Logo } from "@/components/branding/Logo";
import { NavLinks } from "./NavLinks";
import { UserMenu } from "./UserMenu";
import { getSessionUser, getAdminUser } from "@/lib/auth";

// Desktop + mobile: link halaman yang sedang dibuka disembunyikan otomatis
// oleh <NavLinks> (lihat NavLinks.tsx).
const LINKS = [
  { href: "/", label: "Home" },
  { href: "/explore", label: "Explore Produk" },
  { href: "/tentang", label: "Tentang Kami" },
  { href: "/kontak", label: "Contact" },
];

// Mobile: tombol merah disembunyikan di layar kecil, jadi link Submit tetap ada.
const MOBILE_LINKS = [
  { href: "/", label: "Home" },
  { href: "/explore", label: "Explore Produk" },
  { href: "/submit", label: "Submit Produk" },
  { href: "/tentang", label: "Tentang Kami" },
  { href: "/kontak", label: "Contact" },
];

export async function Navbar() {
  const user = await getSessionUser();
  const admin = user ? await getAdminUser() : null;

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Logo />

        <NavLinks links={LINKS} className="hidden items-center gap-8 lg:flex" />

        <div className="flex items-center gap-3">
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
              className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-surface text-navy transition hover:border-navy/40"
            >
              <CircleUserRound className="h-5 w-5" />
            </Link>
          )}
        </div>
      </div>

      {/* navigasi mobile */}
      <NavLinks
        links={MOBILE_LINKS}
        className="flex items-center gap-5 overflow-x-auto border-t border-line px-4 py-2.5 lg:hidden"
      />
    </header>
  );
}
