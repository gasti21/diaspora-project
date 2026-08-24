import {
  AppWindow,
  FlaskConical,
  GraduationCap,
  Shirt,
  ShoppingBasket,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";
import type { Stage, Need, BackgroundType, ProductStatus } from "./types";

export const CATEGORIES = [
  { slug: "makanan-minuman", name: "Makanan & Minuman", icon: UtensilsCrossed, color: "text-amber-500" },
  { slug: "aplikasi-software", name: "Aplikasi & Software", icon: AppWindow, color: "text-blue-500" },
  { slug: "umkm-kerajinan", name: "UMKM & Kerajinan", icon: ShoppingBasket, color: "text-orange-500" },
  { slug: "fashion-accessories", name: "Fashion & Accessories", icon: Shirt, color: "text-pink-500" },
  { slug: "riset-inovasi", name: "Riset & Inovasi", icon: FlaskConical, color: "text-green-500" },
  { slug: "pendidikan-edukasi", name: "Pendidikan & Edukasi", icon: GraduationCap, color: "text-indigo-500" },
] as const satisfies readonly { slug: string; name: string; icon: LucideIcon; color: string }[];

export const STAGES: Stage[] = ["Sudah Dijual", "Prototype", "Riset"];

export const NEEDS: Need[] = [
  "Investor",
  "Partner",
  "Pembeli",
  "Distribusi",
  "Mentor",
  "Lainnya",
];

export const BACKGROUND_TYPES: BackgroundType[] = [
  "Produsen",
  "UMKM",
  "Startup",
  "Komunitas",
];

export const COUNTRIES = [
  "Malaysia",
  "Singapura",
  "Australia",
  "Belanda",
  "Jerman",
  "Amerika Serikat",
  "Qatar",
  "Arab Saudi",
  "Jepang",
  "Inggris",
  "Korea Selatan",
  "Kanada",
  "Uni Emirat Arab",
  "Hong Kong",
  "Brunei Darussalam",
];

export const PRODUCT_STATUSES: { value: ProductStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "published", label: "Published" },
  { value: "revision", label: "Need Revision" },
  { value: "rejected", label: "Rejected" },
];

/** Jumlah produk per halaman di Explore dan dashboard admin. */
export const PER_PAGE = 8;

/** Batas ukuran & tipe foto produk (sesuai PRD/form). */
export const IMAGE_MAX_MB = 5;
export const IMAGE_TYPES = ["image/jpeg", "image/png"];
export const MAX_IMAGES = 5;

export function categoryBySlug(slug?: string | null) {
  return CATEGORIES.find((c) => c.slug === slug);
}

export function categoryNameBySlug(slug?: string | null) {
  return categoryBySlug(slug)?.name ?? slug ?? "";
}

export function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 80);
}
