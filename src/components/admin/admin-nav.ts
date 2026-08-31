/** Konfigurasi menu & judul sidebar admin (dipakai AdminShell & SidebarNav). */
import {
  Activity,
  LayoutDashboard,
  Package,
  Tags,
  Users,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** true = cocokkan pathname persis (untuk /admin). */
  exact: boolean;
  /** kunci statistik untuk badge di sisi item (opsional). */
  stat?: "pending" | "users";
}

/** Menu admin dikelompokkan per bagian supaya mudah dipindai. */
export const NAV_GROUPS: { title: string; items: NavItem[] }[] = [
  {
    title: "Menu Utama",
    items: [{ href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true }],
  },
  {
    title: "Kurasi",
    items: [
      { href: "/admin/produk", label: "Manajemen Produk", icon: Package, exact: false, stat: "pending" },
      { href: "/admin/kategori", label: "Kategori", icon: Tags, exact: false },
      { href: "/admin/aktivitas", label: "Aktivitas", icon: Activity, exact: false },
    ],
  },
  {
    title: "Pengguna",
    items: [
      { href: "/admin/pengguna", label: "Pengguna & Admin", icon: Users, exact: false, stat: "users" },
    ],
  },
];

/** Versi datar (dipakai untuk pencocokan judul halaman). */
export const NAV: NavItem[] = NAV_GROUPS.flatMap((g) => g.items);

export const TITLES: Record<string, string> = {
  "/admin": "Overview",
  "/admin/produk": "Manajemen Produk",
  "/admin/kategori": "Kategori Produk",
  "/admin/aktivitas": "Aktivitas Kurasi",
  "/admin/pengguna": "Pengguna & Admin",
};

/** Event custom: halaman admin meminta sidebar menyegarkan badge statistik. */
export const STATS_EVENT = "kd:admin-stats";
