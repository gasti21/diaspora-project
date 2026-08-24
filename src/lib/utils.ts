import type { ProductStatus } from "./types";

/** Gabung className sederhana. */
export function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

const MONTHS_ID = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

export function formatDate(iso: string) {
  const d = new Date(iso);
  return `${d.getDate()} ${MONTHS_ID[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatLocation(product: { city?: string | null; country: string }) {
  return product.city ? `${product.city}, ${product.country}` : product.country;
}

/** Emoji bendera dari nama negara (fallback 🌍). */
const FLAG_MAP: Record<string, string> = {
  malaysia: "🇲🇾",
  singapura: "🇸🇬",
  australia: "🇦🇺",
  belanda: "🇳🇱",
  jerman: "🇩🇪",
  "amerika serikat": "🇺🇸",
  qatar: "🇶🇦",
  "arab saudi": "🇸🇦",
  jepang: "🇯🇵",
  inggris: "🇬🇧",
  "korea selatan": "🇰🇷",
  kanada: "🇨🇦",
  "uni emirat arab": "🇦🇪",
  "hong kong": "🇭🇰",
  "brunei darussalam": "🇧🇳",
};

export function countryFlag(country: string) {
  return FLAG_MAP[country.toLowerCase()] ?? "🌍";
}

export const STATUS_META: Record<
  ProductStatus,
  { label: string; badge: string; dot: string }
> = {
  pending: {
    label: "Pending",
    badge: "bg-amber-100 text-amber-700",
    dot: "bg-amber-500",
  },
  published: {
    label: "Published",
    badge: "bg-green-100 text-green-700",
    dot: "bg-green-500",
  },
  revision: {
    label: "Need Revision",
    badge: "bg-orange-100 text-orange-700",
    dot: "bg-orange-500",
  },
  rejected: {
    label: "Rejected",
    badge: "bg-red-100 text-red-700",
    dot: "bg-red-500",
  },
};

/** Warna badge kategori (soft background + teks berwarna). */
export const CATEGORY_STYLES: Record<string, string> = {
  "makanan-minuman": "bg-amber-50 text-amber-700",
  "aplikasi-software": "bg-blue-50 text-blue-700",
  "umkm-kerajinan": "bg-orange-50 text-orange-700",
  "fashion-accessories": "bg-pink-50 text-pink-700",
  "riset-inovasi": "bg-green-50 text-green-700",
  "pendidikan-edukasi": "bg-indigo-50 text-indigo-700",
};

export const STAGE_STYLES: Record<string, string> = {
  "Sudah Dijual": "bg-green-100 text-green-700",
  Prototype: "bg-blue-100 text-blue-700",
  Riset: "bg-teal-100 text-teal-700",
};

export const NEED_STYLES: Record<string, string> = {
  Investor: "bg-amber-100 text-amber-800",
  Partner: "bg-blue-100 text-blue-800",
  Pembeli: "bg-pink-100 text-pink-800",
  Distribusi: "bg-violet-100 text-violet-800",
  Mentor: "bg-teal-100 text-teal-800",
  Lainnya: "bg-gray-100 text-gray-700",
};

/** URL berbagi ke sosial media. */
export function shareUrls(url: string, title: string) {
  const u = encodeURIComponent(url);
  const t = encodeURIComponent(title);
  return {
    whatsapp: `https://wa.me/?text=${t}%20${u}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${u}`,
    x: `https://twitter.com/intent/tweet?text=${t}&url=${u}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${u}`,
  };
}

/** Link chat WhatsApp dari nomor bebas format. */
export function waLink(number: string) {
  return `https://wa.me/${number.replace(/[^0-9]/g, "")}`;
}
