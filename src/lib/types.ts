export type ProductStatus = "pending" | "published" | "revision" | "rejected";

export type Stage = "Sudah Dijual" | "Prototype" | "Riset";

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
  categoryId: string;
  categorySlug?: string;
  categoryName?: string;
  stage: Stage;
  country: string;
  city?: string | null;
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
  yearFounded?: number | null;
  backgroundTypes: string[];
  additionalNotes?: string;
  shortDescription: string;
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
