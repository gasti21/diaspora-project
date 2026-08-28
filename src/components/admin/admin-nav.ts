/** Konfigurasi menu & judul sidebar admin (dipakai AdminShell). */
import { LayoutDashboard, Package, Users, type LucideIcon } from "lucide-react";

export const NAV: {
  href: string;
  label: string;
  icon: LucideIcon;
  /** true = cocokkan pathname persis (untuk /admin). */
  exact: boolean;
}[] = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/admin/produk", label: "Manajemen Produk", icon: Package, exact: false },
  { href: "/admin/pengguna", label: "Pengguna & Admin", icon: Users, exact: false },
];

export const TITLES: Record<string, string> = {
  "/admin": "Overview",
  "/admin/produk": "Manajemen Produk",
  "/admin/pengguna": "Pengguna & Admin",
};

/** Event custom: halaman admin meminta sidebar menyegarkan badge statistik. */
export const STATS_EVENT = "kd:admin-stats";