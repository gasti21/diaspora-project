/** Konfigurasi menu & judul sidebar area member (dipakai MemberShell). */
import {
  ClipboardList,
  Heart,
  House,
  LayoutDashboard,
  UserRound,
  type LucideIcon,
} from "lucide-react";

export interface MemberNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** true = cocokkan pathname persis. */
  exact: boolean;
}

/** Menu member. "Submit Produk" sengaja bukan item menu - ia jadi CTA merah di sidebar. */
export const MEMBER_NAV: MemberNavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/pengajuan", label: "Pengajuan Saya", icon: ClipboardList, exact: true },
  { href: "/favorit", label: "Favorit", icon: Heart, exact: true },
  { href: "/profil", label: "Profil Saya", icon: UserRound, exact: true },
];

export const MEMBER_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard Saya",
  "/pengajuan": "Pengajuan Saya",
  "/favorit": "Favorit Saya",
  "/profil": "Profil Saya",
  "/submit": "Submit Produk",
};

/** Link kembali ke situs publik (dipakai kaki sidebar & topbar). */
export const BACK_HOME = { href: "/", label: "Jelajahi Katalog", icon: House };
