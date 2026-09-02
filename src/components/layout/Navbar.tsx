import Link from "next/link";
import { CircleUserRound } from "lucide-react";
import { Logo } from "@/components/branding/Logo";
import { NavLinks } from "./NavLinks";
import { UserMenu } from "./UserMenu";
import { MobileMenu } from "./MobileMenu";
import { getSessionUser, getAdminUser } from "@/lib/auth";
import { getMyProfile, countUnreadSupportForUser } from "@/lib/data";
import type { NotifItem } from "@/components/member/NotificationBell";

const PUBLIC_LINKS = [
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
export async function Navbar({ notifications }: { notifications?: NotifItem[] }) {
  const user = await getSessionUser();
  const admin = user ? await getAdminUser() : null;
  const profile = user ? await getMyProfile(user.id) : null;
  const supportUnread = user ? await countUnreadSupportForUser(user.id) : 0;

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Logo />

        {/* Member login: tanpa link nav - alur member linier (explore via
            logo/home), semua akses akun lewat dropdown avatar. */}
        {!user && (
          <NavLinks links={PUBLIC_LINKS} className="hidden items-center gap-7 lg:flex" />
        )}

        <div className="flex items-center gap-2.5">
          {/* CTA submit hanya untuk member & tamu (tamu → login dulu);
              admin adalah kurator jadi tidak perlu mengajukan produk */}
          {!admin && (
            <Link
              href={user ? "/submit" : "/login?next=%2Fsubmit"}
              className="hidden rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark sm:inline-block"
            >
              Submit Produk
            </Link>
          )}

          {user ? (
            <UserMenu
              user={user}
              isAdmin={Boolean(admin)}
              notifications={notifications}
              socials={profile?.socials}
              supportUnread={supportUnread}
            />
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
