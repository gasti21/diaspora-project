export type ProductStatus = "pending" | "published" | "revision" | "rejected";

export type Stage = "Ide" | "Prototipe" | "Produksi" | "Sudah Dipasarkan";

export type Need =
  | "Investor"
  | "Partner"
  | "Pembeli"
  | "Distribusi"
  | "Mentor"
  | "Lainnya";

export type BackgroundType = "Produsen" | "UMKM" | "Startup" | "Komunitas";

export interface Category {
  id: string;
  slug: string;
  name: string;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  /** ID user pengaju (untuk tautan profil publik). */
  submittedBy?: string | null;
  categoryId: string;
  categorySlug?: string;
  categoryName?: string;
  stage: Stage;
  country: string;
  city?: string | null;
  /** Koordinat GPS lokasi saat pengajuan (null bila tanpa deteksi lokasi). */
  latitude?: number | null;
  longitude?: number | null;
  shortDescription: string;
  longDescription: string;
  backgroundTypes: string[];
  additionalNotes?: string | null;
  images: string[];
  videoUrl?: string | null;
  website?: string | null;
  yearFounded?: number | null;
  needs: string[];
  needsOther?: string | null;
  ownerName: string;
  ownerEmail: string;
  ownerWhatsapp: string;
  status: ProductStatus;
  reviewNote?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProductFilters {
  q?: string;
  category?: string;
  country?: string;
  stage?: string;
  need?: string;
  /** Urutan hasil: terbaru (default), terlama, atau nama (A-Z). */
  sort?: "terbaru" | "terlama" | "nama";
  page?: number;
  perPage?: number;
}

export interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

export interface AdminStats {
  pending: number;
  published: number;
  revision: number;
  rejected: number;
  users: number;
  /** Sesi chat support dengan pesan member yang belum dibaca admin. */
  support: number;
}

/** Baris profile untuk halaman admin "Pengguna & Admin". */
export interface AdminUser {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string | null;
  role: "admin" | "user";
  createdAt: string;
  /** Owner platform - tidak bisa diturunkan/dihapus. */
  isOwner: boolean;
  /** Jumlah produk yang pernah diajukan user ini. */
  submissions: number;
}

/** Data ringkasan untuk halaman Overview admin. */
export interface AdminOverview {
  stats: AdminStats;
  /** Pengajuan terbaru dari semua status (max 6). */
  recent: Product[];
  /** Produk pending yang paling lama menunggu review. */
  oldestPending: Product | null;
}

export interface SubmissionPayload {
  name: string;
  categoryId: string;
  stage: Stage;
  country: string;
  city?: string;
  /** Koordinat GPS dari deteksi lokasi saat pengajuan (opsional). */
  latitude?: number;
  longitude?: number;
  additionalNotes?: string;
  /** Diisi otomatis dari paragraf pertama longDescription (field form dihapus). */
  shortDescription?: string;
  longDescription: string;
  images: string[];
  videoUrl?: string;
  website?: string;
  ownerName: string;
  ownerEmail: string;
  ownerWhatsapp: string;
  needs: string[];
  needsOther?: string;
}

/** Item media pada ulasan: foto atau video (disimpan sebagai JSON di kolom media). */
export interface ReviewMediaItem {
  type: "image" | "video";
  url: string;
}

/** Ulasan produk - hanya user login bisa menulis, semua orang bisa membaca. */
export interface ProductReview {
  id: string;
  productId: string;
  userId: string;
  rating: number;
  content: string;
  media: ReviewMediaItem[];
  authorName: string;
  authorAvatar?: string | null;
  createdAt: string;
  /** Waktu edit terakhir (ala Google Maps: tanggal yang ditampilkan). */
  updatedAt: string;
}

/** Ringkasan ulasan sebuah produk (ala Tokopedia). */
export interface ReviewSummary {
  average: number;
  total: number;
  withMedia: number;
  distribution: [number, number, number, number, number];
}

/** Kontak pemilik produk - hanya dikirim via endpoint rate-limited. */
export interface OwnerContact {
  productName: string;
  ownerName: string;
  ownerEmail: string;
  ownerWhatsapp: string;
  website: string | null;
  /** Sosmed publik pemilik (dari profil) - null bila tidak tersedia. */
  socials: {
    instagram: string | null;
    whatsapp: string | null;
    linkedin: string | null;
    twitter: string | null;
    facebook: string | null;
  } | null;
  /** Detail profil publik pemilik (foto, nama, sejak kapan bergabung). */
  profile: {
    avatarUrl: string | null;
    fullName: string | null;
    memberSince: string | null;
    /** Bio pelaku: tahun usaha berdiri & jenis pelakunya (dari profil akun). */
    yearFounded: number | null;
    backgroundTypes: string[];
  } | null;
}
