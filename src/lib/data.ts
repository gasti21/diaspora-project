import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { PROTECTED_ADMIN_EMAIL, type SessionUser } from "@/lib/auth";
import { SAMPLE_PRODUCTS } from "@/lib/sample-data";
import { CATEGORIES, COUNTRIES, PER_PAGE, slugify } from "@/lib/constants";
import { sendEmail, notifyAllAdmins } from "@/lib/email/send";
import { productApprovedEmail, supportReplyEmail, newSubmissionEmail } from "@/lib/email/templates";
import type {
  AdminOverview,
  AdminStats,
  AdminUser,
  Paginated,
  OwnerContact,
  Product,
  ProductFilters,
  ProductStatus,
  SubmissionPayload,
} from "@/lib/types";

const NOT_CONFIGURED =
  "Database belum terhubung. Isi kredensial Supabase di .env.local (lihat README.md).";

interface DbRow {
  id: string;
  slug: string;
  name: string;
  submitted_by: string | null;
  stage: string;
  country: string;
  city: string | null;
  short_description: string;
  long_description: string;
  background_types: string[] | null;
  additional_notes: string | null;
  images: string[] | null;
  video_url: string | null;
  website: string | null;
  year_founded: number | null;
  needs: string[] | null;
  needs_other: string | null;
  owner_name: string;
  /** Tidak di-grant ke anon/authenticated (migration 0005) - bisa absen pada select user client. */
  owner_email?: string;
  owner_whatsapp?: string;
  status: string;
  review_note: string | null;
  created_at: string;
  updated_at: string;
  category_id: string | null;
  categories?: { id: string; slug: string; name: string } | null;
}

function toProduct(row: DbRow): Product {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    submittedBy: row.submitted_by,
    categoryId: row.category_id ?? "",
    categorySlug: row.categories?.slug,
    categoryName: row.categories?.name,
    stage: row.stage as Product["stage"],
    country: row.country,
    city: row.city,
    shortDescription: row.short_description,
    longDescription: row.long_description,
    backgroundTypes: row.background_types ?? [],
    additionalNotes: row.additional_notes,
    images: row.images ?? [],
    videoUrl: row.video_url,
    website: row.website,
    yearFounded: row.year_founded,
    needs: row.needs ?? [],
    needsOther: row.needs_other,
    ownerName: row.owner_name,
    // Kolom kontak kini tidak di-grant ke anon/authenticated (migration 0005) -
    // nilainya diisi lewat endpoint kontak rate-limited, bukan listing publik.
    ownerEmail: row.owner_email ?? "",
    ownerWhatsapp: row.owner_whatsapp ?? "",
    status: row.status as ProductStatus,
    reviewNote: row.review_note,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Kolom produk yang di-grant SELECT ke anon/authenticated (migration 0005).
 * WAJIB dipakai pada semua query products via user client - PostgREST
 * meng-expand '*' ke SEMUA kolom sehingga query ditolak permission denied.
 * Query via service-role (admin client) bebas memakai "*".
 */
const SAFE_PRODUCT_COLUMNS =
  "id, slug, name, category_id, stage, country, city, short_description, long_description, background_types, additional_notes, images, video_url, website, year_founded, needs, needs_other, owner_name, status, review_note, submitted_by, created_at, updated_at";

/* ============================ PUBLIK ============================ */

export async function listPublicProducts(
  filters: ProductFilters
): Promise<Paginated<Product>> {
  if (!isSupabaseConfigured) {
    return filterSample(filters, SAMPLE_PRODUCTS.filter((p) => p.status === "published"));
  }

  const page = filters.page ?? 1;
  const perPage = filters.perPage ?? PER_PAGE;

  const supabase = await createClient();
  let query = supabase
    .from("products")
    .select(`${SAFE_PRODUCT_COLUMNS}, categories!inner(id, slug, name)`, { count: "exact" })
    .eq("status", "published");

  if (filters.q) {
    const q = filters.q.replace(/[,()%]/g, "");
    query = query.or(
      `name.ilike.%${q}%,short_description.ilike.%${q}%,country.ilike.%${q}%,city.ilike.%${q}%,categories.name.ilike.%${q}%`
    );
  }
  if (filters.category) query = query.eq("categories.slug", filters.category);
  if (filters.country) query = query.eq("country", filters.country);
  if (filters.stage) query = query.eq("stage", filters.stage);
  if (filters.need) query = query.contains("needs", [filters.need]);

  // urutan hasil (default: terbaru dulu)
  if (filters.sort === "nama") query = query.order("name", { ascending: true });
  else if (filters.sort === "terlama") query = query.order("created_at", { ascending: true });
  else query = query.order("created_at", { ascending: false });

  query = query.range((page - 1) * perPage, page * perPage - 1);

  const { data, count, error } = await query;
  if (error) throw new Error(error.message);

  const total = count ?? 0;
  return {
    data: (data as unknown as DbRow[]).map(toProduct),
    total,
    page,
    perPage,
    totalPages: Math.max(1, Math.ceil(total / perPage)),
  };
}

export async function getLatestProducts(limit = 6): Promise<Product[]> {
  if (!isSupabaseConfigured) {
    return SAMPLE_PRODUCTS.filter((p) => p.status === "published").slice(0, limit);
  }
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(`${SAFE_PRODUCT_COLUMNS}, categories(id, slug, name)`)
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data as unknown as DbRow[]).map(toProduct);
}

// cache(): generateMetadata + page memanggil fungsi ini - tanpa cache,
// setiap kunjungan detail produk memicu 2 query identik.
export const getProductBySlug = cache(async (slug: string): Promise<Product | null> => {
  if (!isSupabaseConfigured) {
    return SAMPLE_PRODUCTS.find((p) => p.slug === slug) ?? null;
  }
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(`${SAFE_PRODUCT_COLUMNS}, categories(id, slug, name)`)
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? toProduct(data as unknown as DbRow) : null;
});

/**
 * Ambil kontak pemilik SATU produk published - dipakai endpoint
 * /api/products/[id]/contact yang rate-limited. Service-role diperlukan
 * karena kolom kontak tidak di-grant ke anon/authenticated (migration 0005)
 * - inilah yang mencegah scraping massal via REST Supabase langsung.
 */
export async function getPublishedProductContact(
  id: string
): Promise<OwnerContact | null> {
  if (!isSupabaseConfigured) return null;
  const client = createAdminClient();
  const { data } = await client
    .from("products")
    .select("name, owner_name, owner_email, owner_whatsapp, website, submitted_by")
    .eq("id", id)
    .eq("status", "published")
    .maybeSingle();
  if (!data) return null;

  // Sosmed pemilik dari profil publiknya (sudah dinormalisasi saat disimpan).
  let socials: OwnerContact["socials"] = null;
  if (data.submitted_by) {
    const { data: profile } = await client
      .from("profiles")
      .select(
        "instagram_url, whatsapp_url, linkedin_url, twitter_url, facebook_url"
      )
      .eq("id", data.submitted_by)
      .maybeSingle();
    if (profile) {
      socials = {
        instagram: profile.instagram_url,
        whatsapp: profile.whatsapp_url,
        linkedin: profile.linkedin_url,
        twitter: profile.twitter_url,
        facebook: profile.facebook_url,
      };
    }
  }

  return {
    productName: data.name,
    ownerName: data.owner_name,
    ownerEmail: data.owner_email,
    ownerWhatsapp: data.owner_whatsapp,
    website: data.website,
    socials,
  };
}

/**
 * Lengkapi kontak pemilik untuk pengajuan milik user sendiri (halaman edit).
 * Ownership sudah diverifikasi via query ber-RLS sebelum fungsi ini dipanggil,
 * sehingga pemakaian service-role di sini aman dan terbatas pada baris milik
 * user tersebut.
 */
export async function fillOwnedContact(
  userId: string,
  product: Product
): Promise<Product> {
  if (!isSupabaseConfigured || product.ownerEmail) return product;
  const client = createAdminClient();
  const { data } = await client
    .from("products")
    .select("owner_email, owner_whatsapp")
    .eq("id", product.id)
    .eq("submitted_by", userId)
    .maybeSingle();
  if (!data) return product;
  return {
    ...product,
    ownerEmail: data.owner_email ?? "",
    ownerWhatsapp: data.owner_whatsapp ?? "",
  };
}

export async function getRelatedProducts(
  product: Product,
  limit = 5
): Promise<Product[]> {
  if (!isSupabaseConfigured) {
    return SAMPLE_PRODUCTS.filter(
      (p) =>
        p.status === "published" &&
        p.id !== product.id &&
        p.categorySlug === product.categorySlug
    ).slice(0, limit);
  }
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(`${SAFE_PRODUCT_COLUMNS}, categories(id, slug, name)`)
    .eq("status", "published")
    .eq("category_id", product.categoryId)
    .neq("id", product.id)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data as unknown as DbRow[]).map(toProduct);
}

/**
 * Daftar produk yang diajukan user tertentu (semua status) - untuk
 * halaman "Pengajuan Saya". Keamanan via RLS products_owner_read_own:
 * user hanya bisa membaca baris miliknya sendiri.
 */
export async function listMySubmissions(userId: string): Promise<Product[]> {
  if (!isSupabaseConfigured) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(`${SAFE_PRODUCT_COLUMNS}, categories(id, slug, name)`)
    .eq("submitted_by", userId)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw new Error(error.message);
  return (data as unknown as DbRow[]).map(toProduct);
}

/** Ambil satu pengajuan milik user (untuk halaman edit revisi). */
export async function getMySubmission(
  userId: string,
  id: string
): Promise<Product | null> {
  if (!isSupabaseConfigured) return null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(`${SAFE_PRODUCT_COLUMNS}, categories(id, slug, name)`)
    .eq("submitted_by", userId)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? fillOwnedContact(userId, toProduct(data as unknown as DbRow)) : null;
}

/**
 * Perbaiki pengajuan milik user (alur "Need Revision").
 * Guard kepemilikan ada di WHERE clause - user lain tidak bisa menyentuh.
 * Status kembali ke pending untuk direview ulang.
 */
export async function updateMySubmission(
  userId: string,
  id: string,
  payload: SubmissionPayload,
  ownerEmail: string
): Promise<{ error?: string }> {
  if (!isSupabaseConfigured) return { error: NOT_CONFIGURED };
  const supabase = await createClient();

  const { error } = await supabase
    .from("products")
    .update({
      name: payload.name.trim(),
      category_id: payload.categoryId,
      stage: payload.stage,
      country: payload.country,
      city: payload.city || null,
      year_founded: payload.yearFounded || null,
      background_types: payload.backgroundTypes,
      additional_notes: payload.additionalNotes || null,
      short_description: payload.shortDescription,
      long_description: payload.longDescription,
      images: payload.images,
      video_url: payload.videoUrl || null,
      website: payload.website || null,
      owner_name: payload.ownerName,
      // Anti-spoofing: email pemilik SELALU dari sesi login, bukan payload.
      owner_email: ownerEmail,
      owner_whatsapp: payload.ownerWhatsapp,
      needs: payload.needs,
      needs_other: payload.needsOther || null,
      status: "pending",
      review_note: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("submitted_by", userId)
    .select("id")
    .single();

  if (error) return { error: error.message };
  return {};
}

/** Daftar negara unik dari produk published - untuk filter Lokasi. */
export async function listCountries(): Promise<string[]> {
  if (!isSupabaseConfigured) {
    return [...new Set(SAMPLE_PRODUCTS.map((p) => p.country))].sort();
  }
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("country")
    .eq("status", "published");
  const countries = [...new Set((data ?? []).map((r) => r.country))].sort();
  return countries.length > 0 ? countries : COUNTRIES;
}

export async function createSubmission(
  payload: SubmissionPayload,
  user: SessionUser
): Promise<{ id?: string; slug?: string; error?: string }> {
  if (!isSupabaseConfigured) return { error: NOT_CONFIGURED };

  const supabase = await createClient();

  const { data: category } = await supabase
    .from("categories")
    .select("id")
    .eq("id", payload.categoryId)
    .maybeSingle();
  if (!category) return { error: "Kategori tidak ditemukan." };

  const base = slugify(payload.name) || "produk";
  const slug = `${base}-${Date.now().toString(36)}`;

  const { data, error } = await supabase
    .from("products")
    .insert({
      slug,
      name: payload.name,
      category_id: payload.categoryId,
      stage: payload.stage,
      country: payload.country,
      city: payload.city || null,
      year_founded: payload.yearFounded || null,
      background_types: payload.backgroundTypes,
      additional_notes: payload.additionalNotes || null,
      short_description: payload.shortDescription,
      long_description: payload.longDescription,
      images: payload.images,
      video_url: payload.videoUrl || null,
      website: payload.website || null,
      owner_name: payload.ownerName,
      // Anti-spoofing: email pemilik SELALU dari sesi login, bukan payload.
      owner_email: user.email,
      owner_whatsapp: payload.ownerWhatsapp,
      needs: payload.needs,
      needs_other: payload.needsOther || null,
      status: "pending",
      submitted_by: user.id,
    })
    .select("id, slug")
    .single();

  if (error) return { error: error.message };

  // Fire-and-forget: email ke semua admin (kegagalan tak menggagalkan submit).
  void notifyAllAdmins(
    newSubmissionEmail({ ownerName: user.name, productName: payload.name, productId: data.id }).subject,
    newSubmissionEmail({ ownerName: user.name, productName: payload.name, productId: data.id }).html
  );

  return { id: data.id, slug: data.slug };
}

/** Daftar kategori untuk form submit & filter. */
export async function listCategories(): Promise<{ id: string; slug: string; name: string }[]> {
  if (!isSupabaseConfigured) {
    return CATEGORIES.map((c) => ({ id: c.slug, slug: c.slug, name: c.name }));
  }
  const supabase = await createClient();
  const { data } = await supabase
    .from("categories")
    .select("id, slug, name")
    .order("id");
  return data ?? [];
}

/** Profil publik member (untuk halaman portofolio). */
export interface PublicMember {
  id: string;
  name: string;
  avatarUrl: string | null;
  bio: string | null;
  socials: ProfileSocials;
  joinedAt: string;
  productCount: number;
}

/** Data profil publik member + jumlah produk tayangnya. */
export async function getPublicMember(id: string): Promise<PublicMember | null> {
  if (!isSupabaseConfigured) return null;
  const client = createAdminClient();

  const { data: profile, error } = await client
    .from("profiles")
    .select(
      "id, full_name, avatar_url, bio, created_at, instagram_url, whatsapp_url, linkedin_url, twitter_url, facebook_url"
    )
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!profile) return null;

  const { count, error: countError } = await client
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("submitted_by", id)
    .eq("status", "published");
  if (countError) throw new Error(countError.message);

  return {
    id: profile.id,
    name: profile.full_name ?? "Member KaryaDiaspora",
    avatarUrl: profile.avatar_url,
    bio: profile.bio,
    socials: {
      instagram: profile.instagram_url,
      whatsapp: profile.whatsapp_url,
      linkedin: profile.linkedin_url,
      twitter: profile.twitter_url,
      facebook: profile.facebook_url,
    },
    joinedAt: profile.created_at,
    productCount: count ?? 0,
  };
}

/** Produk yang di-favoritkan user (untuk halaman Favorit, login-only). */
export async function listMyFavoriteProducts(userId: string): Promise<Product[]> {
  if (!isSupabaseConfigured) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("favorites")
    .select("product_id, products(*, categories(id, slug, name))")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? [])
    .map((row) => {
      const p = row.products as unknown as DbRow | null;
      return p ? toProduct(p) : null;
    })
    .filter((p): p is Product => p !== null);
}

/**
 * Himpunan id produk yang difavoritkan user (satu query - dipakai halaman
 * katalog agar ProductCard tidak N+1 request per kartu).
 */
export async function listMyFavoriteProductIds(userId: string): Promise<Set<string>> {
  if (!isSupabaseConfigured) return new Set();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("favorites")
    .select("product_id")
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
  return new Set((data ?? []).map((r) => r.product_id as string));
}

/** Status favorit untuk batch id (dipakai endpoint /api/favorites?ids=...). */
export async function getFavoriteMap(
  userId: string,
  productIds: string[]
): Promise<Record<string, boolean>> {
  const map: Record<string, boolean> = {};
  if (productIds.length === 0) return map;
  if (!isSupabaseConfigured) {
    for (const id of productIds) map[id] = false;
    return map;
  }
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("favorites")
    .select("product_id")
    .eq("user_id", userId)
    .in("product_id", productIds);
  if (error) throw new Error(error.message);
  for (const id of productIds) map[id] = false;
  for (const row of data ?? []) map[row.product_id as string] = true;
  return map;
}

/** Toggle favorit: tambah bila belum ada, hapus bila sudah. */
export async function toggleFavoriteProduct(
  userId: string,
  productId: string
): Promise<{ favorited?: boolean; error?: string }> {
  if (!isSupabaseConfigured) return { error: NOT_CONFIGURED };
  const supabase = await createClient();

  const { data: existing, error: findError } = await supabase
    .from("favorites")
    .select("product_id")
    .eq("user_id", userId)
    .eq("product_id", productId)
    .maybeSingle();
  if (findError) return { error: findError.message };

  if (existing) {
    const { error } = await supabase
      .from("favorites")
      .delete()
      .eq("user_id", userId)
      .eq("product_id", productId);
    return error ? { error: error.message } : { favorited: false };
  }

  const { error } = await supabase
    .from("favorites")
    .insert({ user_id: userId, product_id: productId });
  return error ? { error: error.message } : { favorited: true };
}

/** Status favorit satu produk (untuk tombol hati). */
export async function isProductFavorited(
  userId: string,
  productId: string
): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  const supabase = await createClient();
  const { data } = await supabase
    .from("favorites")
    .select("product_id")
    .eq("user_id", userId)
    .eq("product_id", productId)
    .maybeSingle();
  return Boolean(data);
}

/**
 * Rekam satu view produk via service-role (RLS product_views menutup akses
 * langsung). Dipanggil API route /api/products/[id]/view yang rate-limited -
 * PENTING: RPC publik record_product_view sudah dihapus (migration 0009)
 * agar bot tidak bisa menggembungkan jumlah view langsung via REST.
 */
export async function recordProductView(productId: string): Promise<void> {
  if (!isSupabaseConfigured) return;
  const client = createAdminClient();
  const { error } = await client
    .from("product_views")
    .insert({ product_id: productId });
  if (error) throw new Error(error.message);
}

/**
 * Jumlah view per produk - satu panggilan RPC GROUP BY di Postgres
 * (jangan fetch semua rows ke aplikasi).
 */
export async function getProductViewCounts(
  productIds: string[]
): Promise<Record<string, number>> {
  if (!isSupabaseConfigured || productIds.length === 0) return {};
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_view_counts", {
    p_ids: productIds,
  });
  if (error) throw new Error(error.message);
  const counts: Record<string, number> = {};
  for (const row of (data as { product_id: string; view_count: number }[]) ?? []) {
    counts[row.product_id] = Number(row.view_count);
  }
  return counts;
}

/** Profil user yang sedang login (untuk menu & edit profil). */
export interface ProfileSocials {
  instagram: string | null;
  whatsapp: string | null;
  linkedin: string | null;
  twitter: string | null;
  facebook: string | null;
}

export interface MyProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  bio: string | null;
  socials: ProfileSocials;
  /** true = terima email transaksional (default). false = opt-out. */
  notifyEmail: boolean;
  role: "admin" | "user";
  createdAt: string;
}

/** Ambil profil user yang sedang login. */
export async function getMyProfile(userId: string): Promise<MyProfile | null> {
  if (!isSupabaseConfigured) return null;
  const client = createAdminClient();
  const { data, error } = await client
    .from("profiles")
    .select(
      "id, email, full_name, avatar_url, bio, role, created_at, notify_email, instagram_url, whatsapp_url, linkedin_url, twitter_url, facebook_url"
    )
    .eq("id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  return {
    id: data.id,
    name: data.full_name ?? data.email.split("@")[0],
    email: data.email,
    avatarUrl: data.avatar_url,
    bio: data.bio,
    notifyEmail: data.notify_email !== false,
    socials: {
      instagram: data.instagram_url,
      whatsapp: data.whatsapp_url,
      linkedin: data.linkedin_url,
      twitter: data.twitter_url,
      facebook: data.facebook_url,
    },
    role: data.role === "admin" ? "admin" : "user",
    createdAt: data.created_at,
  };
}

/**
 * Perbarui profil sendiri. Email TIDAK bisa diubah di sini (identitas
 * terikat sesi Google auth) - hanya nama, bio, avatar, dan link sosmed.
 * Link sosmed disimpan sebagai URL utuh yang sudah dinormalisasi.
 */
export async function updateMyProfile(
  userId: string,
  update: {
    name?: string;
    bio?: string | null;
    avatarUrl?: string | null;
    socials?: Partial<ProfileSocials>;
    notifyEmail?: boolean;
  }
): Promise<{ error?: string }> {
  if (!isSupabaseConfigured) return { error: NOT_CONFIGURED };
  const client = createAdminClient();

  const patch: Record<string, unknown> = {};
  if (update.notifyEmail !== undefined) {
    patch.notify_email = update.notifyEmail;
  }
  if (update.name !== undefined) {
    const name = update.name.trim();
    if (!name) return { error: "Nama tidak boleh kosong." };
    if (name.length > 80) return { error: "Nama maksimal 80 karakter." };
    patch.full_name = name;
  }
  if (update.bio !== undefined) {
    const bio = update.bio?.trim() ?? null;
    if (bio && bio.length > 280) return { error: "Bio maksimal 280 karakter." };
    patch.bio = bio || null;
  }
  if (update.avatarUrl !== undefined) patch.avatar_url = update.avatarUrl;

  if (update.socials) {
    const columnMap = {
      instagram: "instagram_url",
      whatsapp: "whatsapp_url",
      linkedin: "linkedin_url",
      twitter: "twitter_url",
      facebook: "facebook_url",
    } as const;
    for (const [key, column] of Object.entries(columnMap)) {
      const raw = update.socials[key as keyof ProfileSocials];
      if (raw === undefined) continue;
      if (raw === null || raw.trim() === "") {
        patch[column] = null;
        continue;
      }
      const normalized = normalizeSocialUrl(key as keyof ProfileSocials, raw.trim());
      if (!normalized) {
        return { error: `Link ${key} tidak valid. Contoh: instagram.com/namakamu` };
      }
      patch[column] = normalized;
    }
  }

  if (Object.keys(patch).length === 0) return {};

  const { error } = await client
    .from("profiles")
    .update(patch)
    .eq("id", userId)
    .select("id")
    .single();
  return error ? { error: error.message } : {};
}

/**
 * Ubah input fleksibel (@handle, handle, nomor WA, atau URL penuh) menjadi
 * URL kanonik per platform. Return null bila tidak bisa dinormalisasi.
 */
export function normalizeSocialUrl(
  platform: keyof ProfileSocials,
  raw: string
): string | null {
  const value = raw.trim().replace(/^@/, "");
  if (!value) return null;

  // Kalau user tempel URL penuh, pastikan hostnya platform yang benar.
  if (/^https?:\/\//i.test(value) || /\.(com|me|net|org)/i.test(value)) {
    try {
      const url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
      const host = url.hostname.replace(/^www\./, "").toLowerCase();
      const path = url.pathname.replace(/\/+$/, "").replace(/^\/+/, "");
      const valid: Record<string, string[]> = {
        instagram: ["instagram.com", "instagr.am"],
        whatsapp: ["wa.me", "api.whatsapp.com", "chat.whatsapp.com"],
        linkedin: ["linkedin.com", "lnkd.in"],
        twitter: ["twitter.com", "x.com"],
        facebook: ["facebook.com", "fb.com", "fb.me"],
      };
      if (!valid[platform]?.includes(host)) return null;
      if (!path) return null;
      // api.whatsapp.com/send?phone=... -> wa.me/<nomor>
      if (platform === "whatsapp" && host === "api.whatsapp.com" && url.searchParams.get("phone")) {
        const phone = url.searchParams.get("phone")!.replace(/\D/g, "");
        return phone ? `https://wa.me/${phone}` : null;
      }
      return `https://${host}/${path}`;
    } catch {
      return null;
    }
  }

  // Input handle / nomor mentah.
  if (platform === "whatsapp") {
    let digits = value.replace(/\D/g, "");
    if (!digits) return null;
    if (digits.startsWith("0")) digits = `62${digits.slice(1)}`; // 08xx -> 628xx
    if (digits.length < 8 || digits.length > 16) return null;
    return `https://wa.me/${digits}`;
  }
  // Handle: huruf, angka, titik, underscore, strip saja.
  if (!/^[A-Za-z0-9._-]{1,60}$/.test(value)) return null;
  if (platform === "linkedin" && !/^(in|company|pub)\//i.test(value)) {
    return `https://www.linkedin.com/in/${value}`;
  }
  const hosts: Record<string, string> = {
    instagram: "https://www.instagram.com/",
    twitter: "https://x.com/",
    facebook: "https://www.facebook.com/",
  };
  return `${hosts[platform]}${value}`;
}

/** Upload foto avatar ke bucket `avatars` (1 file terakhir per user). */
export async function uploadAvatar(
  file: File,
  userId: string
): Promise<{ url?: string; error?: string }> {
  if (!isSupabaseConfigured) return { error: NOT_CONFIGURED };
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY)
    return { error: "SUPABASE_SERVICE_ROLE_KEY belum diisi di .env.local." };

  // Validasi magic bytes: hanya JPG/PNG.
  const head = new Uint8Array(await file.slice(0, 8).arrayBuffer());
  const isJpeg = head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff;
  const isPng =
    head[0] === 0x89 && head[1] === 0x50 && head[2] === 0x4e && head[3] === 0x47;
  if (!isJpeg && !isPng) return { error: "Isi file bukan gambar JPG/PNG yang valid." };
  if (file.size > 2 * 1024 * 1024) return { error: "Ukuran avatar maksimal 2MB." };

  const admin = createAdminClient();
  const ext = file.type === "image/png" ? "png" : "jpg";
  const path = `${userId}/avatar.${ext}`;

  // Upsert: satu avatar terakhir per user (nama file tetap).
  const { error: uploadError } = await admin.storage
    .from("avatars")
    .upload(path, await file.arrayBuffer(), {
      contentType: file.type,
      upsert: true,
    });
  if (uploadError) return { error: uploadError.message };

  // Cache-buster: timestamp agar avatar baru langsung tampil.
  const { data } = admin.storage.from("avatars").getPublicUrl(path);
  return { url: `${data.publicUrl}?v=${Date.now()}` };
}

/** Slug + tanggal update semua produk published (untuk sitemap). */
export async function listPublishedForSitemap(): Promise<
  { slug: string; updatedAt: string; submittedBy: string | null }[]
> {
  if (!isSupabaseConfigured) {
    return SAMPLE_PRODUCTS.filter((p) => p.status === "published").map((p) => ({
      slug: p.slug,
      updatedAt: p.updatedAt,
      submittedBy: p.submittedBy ?? null,
    }));
  }
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("slug, updated_at, submitted_by")
    .eq("status", "published");
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => ({
    slug: r.slug,
    updatedAt: r.updated_at,
    submittedBy: r.submitted_by,
  }));
}

/** Semua produk published milik satu member (untuk portofolio). */
export async function listMemberPublishedProducts(userId: string): Promise<Product[]> {
  if (!isSupabaseConfigured) {
    return SAMPLE_PRODUCTS.filter((p) => p.status === "published");
  }
  const client = createAdminClient();
  // Pakai SAFE_PRODUCT_COLUMNS meski service-role: halaman /u/[id] publik,
  // kolom kontak pemilik (email/WA) tidak boleh ikut ke flight data RSC.
  const { data, error } = await client
    .from("products")
    .select(`${SAFE_PRODUCT_COLUMNS}, categories(id, slug, name)`)
    .eq("submitted_by", userId)
    .eq("status", "published")
    .order("updated_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data as unknown as DbRow[]).map(toProduct);
}

/* ======================= ADMIN: KATEGORI ======================= */

/** Daftar kategori + jumlah produk terkait (untuk halaman admin kategori). */
export async function adminListCategories(): Promise<
  { id: string; slug: string; name: string; productCount: number }[]
> {
  if (!isSupabaseConfigured) {
    return CATEGORIES.map((c) => ({
      id: c.slug,
      slug: c.slug,
      name: c.name,
      productCount: SAMPLE_PRODUCTS.filter((p) => p.categorySlug === c.slug).length,
    }));
  }
  const client = createAdminClient();
  const { data, error } = await client
    .from("categories")
    .select("id, slug, name, products(count)");
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => ({
    id: row.id,
    slug: row.slug,
    name: row.name,
    productCount: row.products?.[0]?.count ?? 0,
  }));
}

/** Tambah kategori baru (slug otomatis dari nama). */
export async function adminCreateCategory(name: string): Promise<{ error?: string }> {
  if (!isSupabaseConfigured) return { error: NOT_CONFIGURED };
  const client = createAdminClient();

  const slug = slugify(name);
  if (!slug) return { error: "Nama kategori tidak valid." };

  // Cegah duplikat slug.
  const { data: existing } = await client
    .from("categories")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  if (existing) return { error: `Kategori dengan slug "${slug}" sudah ada.` };

  const { error } = await client.from("categories").insert({ name: name.trim(), slug });
  return error ? { error: error.message } : {};
}

/** Ubah seluruh data produk oleh admin (tanpa guard kepemilikan). */
export async function adminUpdateProductFields(
  id: string,
  payload: SubmissionPayload
): Promise<{ error?: string }> {
  if (!isSupabaseConfigured) return { error: NOT_CONFIGURED };
  const client = createAdminClient();

  const { error } = await client
    .from("products")
    .update({
      name: payload.name.trim(),
      category_id: payload.categoryId,
      stage: payload.stage,
      country: payload.country,
      city: payload.city || null,
      year_founded: payload.yearFounded || null,
      background_types: payload.backgroundTypes,
      additional_notes: payload.additionalNotes || null,
      short_description: payload.shortDescription,
      long_description: payload.longDescription,
      images: payload.images,
      video_url: payload.videoUrl || null,
      website: payload.website || null,
      owner_name: payload.ownerName,
      owner_email: payload.ownerEmail,
      owner_whatsapp: payload.ownerWhatsapp,
      needs: payload.needs,
      needs_other: payload.needsOther || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("id")
    .single();

  if (error) return { error: error.message };
  return {};
}

/** Hapus produk permanen (khusus admin). */
export async function adminDeleteProduct(id: string): Promise<{ error?: string }> {
  if (!isSupabaseConfigured) return { error: NOT_CONFIGURED };
  const client = createAdminClient();
  const { error } = await client.from("products").delete().eq("id", id).select("id").single();
  if (error) return { error: error.message };
  return {};
}

/** Ambil satu produk apa pun statusnya (untuk halaman edit admin). */
export async function adminGetProduct(id: string): Promise<Product | null> {
  if (!isSupabaseConfigured) {
    return SAMPLE_PRODUCTS.find((p) => p.id === id) ?? null;
  }
  const client = createAdminClient();
  const { data, error } = await client
    .from("products")
    .select("*, categories(id, slug, name)")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? toProduct(data as unknown as DbRow) : null;
}

/** Ubah nama kategori (slug diikutkan agar tetap konsisten). */
export async function adminUpdateCategory(
  id: string,
  name: string
): Promise<{ error?: string }> {
  if (!isSupabaseConfigured) return { error: NOT_CONFIGURED };
  const client = createAdminClient();

  const slug = slugify(name);
  if (!slug) return { error: "Nama kategori tidak valid." };

  const { data: existing } = await client
    .from("categories")
    .select("id")
    .eq("slug", slug)
    .neq("id", id)
    .maybeSingle();
  if (existing) return { error: `Kategori dengan slug "${slug}" sudah ada.` };

  const { error } = await client
    .from("categories")
    .update({ name: name.trim(), slug })
    .eq("id", id);
  return error ? { error: error.message } : {};
}

/** Hapus kategori. Ditolak bila masih ada produk yang memakainya. */
export async function adminDeleteCategory(id: string): Promise<{ error?: string }> {
  if (!isSupabaseConfigured) return { error: NOT_CONFIGURED };
  const client = createAdminClient();

  const { count, error: countError } = await client
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("category_id", id);
  if (countError) return { error: countError.message };
  if ((count ?? 0) > 0)
    return {
      error: `Masih ada ${count} produk memakai kategori ini. Pindahkan dulu produknya sebelum menghapus.`,
    };

  const { error } = await client.from("categories").delete().eq("id", id);
  return error ? { error: error.message } : {};
}

/* ============================ ADMIN ============================ */

/* ============================ ADMIN ============================ */

export async function adminListProducts(filters: {
  status?: ProductStatus;
  q?: string;
  page?: number;
  perPage?: number;
}): Promise<Paginated<Product>> {
  if (!isSupabaseConfigured) {
    let rows = SAMPLE_PRODUCTS;
    if (filters.status) rows = rows.filter((p) => p.status === filters.status);
    return filterSample(filters, rows);
  }

  const page = filters.page ?? 1;
  const perPage = filters.perPage ?? PER_PAGE;

  const supabase = await createClient();
  let query = supabase
    .from("products")
    .select(`${SAFE_PRODUCT_COLUMNS}, categories(id, slug, name)`, { count: "exact" });

  if (filters.status) query = query.eq("status", filters.status);
  if (filters.q) {
    const q = filters.q.replace(/[,()%]/g, "");
    query = query.or(`name.ilike.%${q}%,owner_name.ilike.%${q}%`);
  }

  query = query
    .order("created_at", { ascending: false })
    .range((page - 1) * perPage, page * perPage - 1);

  const { data, count, error } = await query;
  if (error) throw new Error(error.message);

  const total = count ?? 0;
  return {
    data: (data as unknown as DbRow[]).map(toProduct),
    total,
    page,
    perPage,
    totalPages: Math.max(1, Math.ceil(total / perPage)),
  };
}

export async function adminGetStats(): Promise<AdminStats> {
  if (!isSupabaseConfigured) {
    const stats: AdminStats = { pending: 0, published: 0, revision: 0, rejected: 0, users: 1, support: 0 };
    for (const p of SAMPLE_PRODUCTS) stats[p.status]++;
    return stats;
  }

  const supabase = await createClient();
  const stats: AdminStats = { pending: 0, published: 0, revision: 0, rejected: 0, users: 0, support: 0 };
  await Promise.all(
    (["pending", "published", "revision", "rejected"] as const).map(async (s) => {
      const { count } = await supabase
        .from("products")
        .select("id", { count: "exact", head: true })
        .eq("status", s);
      stats[s] = count ?? 0;
    })
  );
  [stats.users, stats.support] = await Promise.all([countProfiles(), adminCountUnreadSupport()]);
  return stats;
}

/** Jumlah total profile terdaftar (butuh service role - RLS profiles). */
async function countProfiles(): Promise<number> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return 0;
  try {
    const { count } = await createAdminClient()
      .from("profiles")
      .select("id", { count: "exact", head: true });
    return count ?? 0;
  } catch {
    return 0;
  }
}

/**
 * Ringkasan halaman Overview admin: statistik, pengajuan terbaru lintas
 * status, dan produk pending yang paling lama menunggu (aging).
 */
export async function adminGetOverview(): Promise<AdminOverview> {
  const stats = await adminGetStats();

  if (!isSupabaseConfigured) {
    return {
      stats,
      recent: SAMPLE_PRODUCTS.slice(0, 6),
      oldestPending: SAMPLE_PRODUCTS.find((p) => p.status === "pending") ?? null,
    };
  }

  const supabase = createAdminClient();
  const [recentRes, oldestRes] = await Promise.all([
    supabase
      .from("products")
      .select("*, categories(id, slug, name)")
      .order("created_at", { ascending: false })
      .limit(6),
    supabase
      .from("products")
      .select("*, categories(id, slug, name)")
      .eq("status", "pending")
      .order("created_at", { ascending: true })
      .limit(1),
  ]);

  if (recentRes.error) throw new Error(recentRes.error.message);
  if (oldestRes.error) throw new Error(oldestRes.error.message);

  return {
    stats,
    recent: (recentRes.data as unknown as DbRow[]).map(toProduct),
    oldestPending: oldestRes.data?.length
      ? toProduct(oldestRes.data[0] as unknown as DbRow)
      : null,
  };
}

/**
 * Aktivitas kurasi terbaru: seluruh produk diurutkan berdasarkan waktu
 * terakhir diubah (updated_at) - dipakai halaman Aktivitas admin.
 * Catatan: MVP tidak menyimpan log terpisah; updated_at + review_note
 * menjadi sumber ringkasan aktivitas yang tersedia.
 */
export async function adminListActivity(limit = 20): Promise<Product[]> {
  if (!isSupabaseConfigured) {
    return SAMPLE_PRODUCTS.slice(0, limit);
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("products")
    .select("*, categories(id, slug, name)")
    .order("updated_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data as unknown as DbRow[]).map(toProduct);
}

/**
 * Semua profile (user + admin) beserta jumlah pengajuannya -
 * untuk halaman admin "Pengguna & Admin". Service role client karena
 * RLS profiles tidak mengizinkan admin membaca baris user lain.
 */
export async function adminListUsers(): Promise<AdminUser[]> {
  if (!isSupabaseConfigured || !process.env.SUPABASE_SERVICE_ROLE_KEY) return [];

  const client = createAdminClient();
  const { data, error } = await client
    .from("profiles")
    .select("id, email, full_name, avatar_url, role, created_at")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);

  // Hitung pengajuan per user sekali jalan (agregasi sisi aplikasi, skala MVP).
  const { data: subs, error: subsError } = await client
    .from("products")
    .select("submitted_by");
  if (subsError) throw new Error(subsError.message);
  const counts = new Map<string, number>();
  for (const row of subs ?? []) {
    const key = row.submitted_by as string;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    email: row.email,
    name: row.full_name ?? row.email.split("@")[0],
    avatarUrl: row.avatar_url,
    role: row.role === "admin" ? "admin" : "user",
    createdAt: row.created_at,
    isOwner: row.email?.toLowerCase() === PROTECTED_ADMIN_EMAIL.toLowerCase(),
    submissions: counts.get(row.id) ?? 0,
  }));
}

export async function adminUpdateProduct(
  id: string,
  update: { status: ProductStatus; reviewNote?: string | null }
): Promise<{ error?: string }> {
  if (!isSupabaseConfigured) return { error: NOT_CONFIGURED };

  const supabase = await createClient();
  const { error } = await supabase
    .from("products")
    .update({
      status: update.status,
      review_note: update.reviewNote ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) return { error: error.message };

  // Email "produk tayang" ke pemilik (fire-and-forget).
  if (update.status === "published") {
    void (async () => {
      try {
        const client = createAdminClient();
        const { data: product } = await client
          .from("products")
          .select("name, slug, submitted_by")
          .eq("id", id)
          .maybeSingle();
        if (!product) return;
        const { data: member } = await client
          .from("profiles")
          .select("email, full_name, notify_email")
          .eq("id", product.submitted_by)
          .maybeSingle();
        if (!member?.email || member.notify_email === false) return;
        const content = productApprovedEmail({
          memberName: member.full_name ?? member.email.split("@")[0],
          productName: product.name,
          slug: product.slug,
        });
        const result = await sendEmail({ to: member.email, ...content });
        if (result.error) console.error("[email] productApproved:", result.error);
      } catch (e) {
        console.error("[email] productApproved:", e);
      }
    })();
  }

  return {};
}

export interface AdminTrends {
  /** Jumlah pengajuan per minggu (6 minggu terakhir, terlama -> terbaru). */
  weekly: { label: string; count: number }[];
  topCountries: { country: string; count: number }[];
  topCategories: { name: string; count: number }[];
}

/**
 * Tren pengajuan untuk overview admin: 6 minggu terakhir, negara &
 * kategori teratas. Query ringan (hanya kolom ringkas, satu tabel).
 */
export async function adminGetTrends(): Promise<AdminTrends> {
  if (!isSupabaseConfigured) {
    return {
      weekly: Array.from({ length: 6 }, (_, i) => ({ label: `M-${5 - i}`, count: 0 })),
      topCountries: [],
      topCategories: [],
    };
  }
  const client = createAdminClient();
  const since = new Date(Date.now() - 6 * 7 * 86_400_000).toISOString();
  const { data, error } = await client
    .from("products")
    .select("created_at, country, categories(name)")
    .gte("created_at", since);
  if (error) throw new Error(error.message);

  // Kelompokkan per minggu (minggu berjalan = yang terakhir).
  const weekly = Array.from({ length: 6 }, (_, i) => {
    const start = new Date(Date.now() - (5 - i) * 7 * 86_400_000);
    const label = `${start.getDate()}/${start.getMonth() + 1}`;
    return { label, count: 0, start: start.getTime() };
  });
  const countryCount = new Map<string, number>();
  const categoryCount = new Map<string, number>();

  for (const row of (data ?? []) as {
    created_at: string;
    country: string;
    categories: { name: string } | { name: string }[] | null;
  }[]) {
    const t = new Date(row.created_at).getTime();
    for (let i = weekly.length - 1; i >= 0; i--) {
      if (t >= weekly[i].start) {
        weekly[i].count += 1;
        break;
      }
    }
    if (row.country) {
      countryCount.set(row.country, (countryCount.get(row.country) ?? 0) + 1);
    }
    const cat = Array.isArray(row.categories) ? row.categories[0] : row.categories;
    if (cat?.name) {
      categoryCount.set(cat.name, (categoryCount.get(cat.name) ?? 0) + 1);
    }
  }

  const sortDesc = (m: Map<string, number>) =>
    [...m.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([k, v]) => ({ country: k, name: k, count: v }));

  return {
    weekly: weekly.map(({ label, count }) => ({ label, count })),
    topCountries: sortDesc(countryCount).map((x) => ({ country: x.country, count: x.count })),
    topCategories: sortDesc(categoryCount).map((x) => ({ name: x.name, count: x.count })),
  };
}

/**
 * Ubah status banyak produk sekaligus (bulk action kurasi). Per produk
 * memakai jalur adminUpdateProduct agar email "produk tayang" tetap terkirim.
 * Kegagalan satu produk tidak menghentikan yang lain - dikembalikan hitungan
 * sukses + daftar id yang gagal.
 */
export async function adminBulkUpdateStatus(
  ids: string[],
  status: ProductStatus,
  opts: { reviewNote?: string | null }
): Promise<{ updated?: number; failed?: string[]; error?: string }> {
  let updated = 0;
  const failed: string[] = [];
  for (const id of ids) {
    const result = await adminUpdateProduct(id, { status, reviewNote: opts.reviewNote });
    if (result.error) failed.push(id);
    else updated += 1;
  }
  return { updated, failed };
}

/** Upload foto ke Storage bucket `product-images` (butuh service role key). */
export async function uploadProductImage(
  file: File,
  userId: string,
  maxFilesPerUser?: number
): Promise<{ url?: string; error?: string }> {
  if (!isSupabaseConfigured) return { error: NOT_CONFIGURED };
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY)
    return { error: "SUPABASE_SERVICE_ROLE_KEY belum diisi di .env.local." };

  const admin = createAdminClient();

  // Kuota: hitung file yang sudah ada di prefix user sebelum upload.
  if (maxFilesPerUser !== undefined) {
    const { data: existing, error: listError } = await admin.storage
      .from("product-images")
      .list(userId, { limit: 1000 });
    if (listError) return { error: listError.message };
    if ((existing?.length ?? 0) >= maxFilesPerUser) {
      return {
        error: `Kuota foto penuh (maks ${maxFilesPerUser} foto). Hapus foto yang tidak terpakai di pengajuan Anda terlebih dahulu.`,
      };
    }
  }

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { error: uploadError } = await admin.storage
    .from("product-images")
    .upload(path, await file.arrayBuffer(), {
      contentType: file.type,
      upsert: false,
    });
  if (uploadError) return { error: uploadError.message };

  const { data } = admin.storage.from("product-images").getPublicUrl(path);
  return { url: data.publicUrl };
}

/* ======================= FALLBACK SAMPLE DATA ======================= */

function filterSample(
  filters: { q?: string; category?: string; country?: string; stage?: string; need?: string; sort?: "terbaru" | "terlama" | "nama"; page?: number; perPage?: number },
  rows: Product[]
): Paginated<Product> {
  let result = rows;
  if (filters.q) {
    const q = filters.q.toLowerCase();
    result = result.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.shortDescription.toLowerCase().includes(q) ||
        p.country.toLowerCase().includes(q) ||
        (p.categoryName ?? "").toLowerCase().includes(q)
    );
  }
  if (filters.category)
    result = result.filter((p) => p.categorySlug === filters.category);
  if (filters.country) result = result.filter((p) => p.country === filters.country);
  if (filters.stage) result = result.filter((p) => p.stage === filters.stage);
  if (filters.need) result = result.filter((p) => p.needs.includes(filters.need!));

  const page = filters.page ?? 1;
  const perPage = filters.perPage ?? PER_PAGE;
  const total = result.length;

  // urutan hasil (default: terbaru dulu) - konsisten dengan mode database
  if (filters.sort === "nama") {
    result = [...result].sort((a, b) => a.name.localeCompare(b.name));
  } else if (filters.sort === "terlama") {
    result = [...result].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  } else {
    result = [...result].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  return {
    data: result.slice((page - 1) * perPage, page * perPage),
    total,
    page,
    perPage,
    totalPages: Math.max(1, Math.ceil(total / perPage)),
  };
}

/** Seed kategori - dipanggil dari SQL seed, disertakan untuk referensi. */
export const CATEGORY_SEED = CATEGORIES;

/* ========================= CHAT SUPPORT ========================= */

/** Batas auto-close: sesi open tanpa aktivitas selama ini ditutup otomatis. */
export const SUPPORT_AUTO_CLOSE_MS = 48 * 60 * 60_000;

export interface SupportSession {
  id: string;
  userId: string;
  status: "open" | "closed";
  /** Judul sesi: potongan pesan pertama (bukan input pengguna). */
  subject: string;
  lastMessageAt: string;
  userLastReadAt: string;
  adminLastReadAt: string | null;
  closedBy: "user" | "admin" | "auto" | null;
  closedAt: string | null;
  createdAt: string;
  /** Terisi saat list admin: identitas pemilik sesi. */
  userName?: string;
  userEmail?: string;
  /** Ada pesan lawan yang belum dibaca pihak ini. */
  unread?: boolean;
}

export interface SupportMessage {
  id: string;
  sessionId: string;
  senderId: string;
  body: string;
  createdAt: string;
}

interface SessionRow {
  id: string;
  user_id: string;
  status: string;
  subject: string;
  last_message_at: string;
  user_last_read_at: string;
  admin_last_read_at: string | null;
  closed_by: string | null;
  closed_at: string | null;
  created_at: string;
}

function mapSession(r: SessionRow): SupportSession {
  return {
    id: r.id,
    userId: r.user_id,
    status: r.status === "closed" ? "closed" : "open",
    subject: r.subject,
    lastMessageAt: r.last_message_at,
    userLastReadAt: r.user_last_read_at,
    adminLastReadAt: r.admin_last_read_at,
    closedBy: (r.closed_by as SupportSession["closedBy"]) ?? null,
    closedAt: r.closed_at,
    createdAt: r.created_at,
  };
}

function mapMessage(r: {
  id: string;
  session_id: string;
  sender_id: string;
  body: string;
  created_at: string;
}): SupportMessage {
  return { id: r.id, sessionId: r.session_id, senderId: r.sender_id, body: r.body, createdAt: r.created_at };
}

/**
 * Lazy-eval auto-close: tandai sesi open yang sudah > 48 jam tanpa
 * aktivitas sebagai closed (closed_by='auto'). Dipanggil sebelum setiap
 * baca/tulis sesi sehingga status selalu jujur tanpa cron job.
 */
async function autoCloseStaleSessions(client: ReturnType<typeof createAdminClient>) {
  const cutoff = new Date(Date.now() - SUPPORT_AUTO_CLOSE_MS).toISOString();
  await client
    .from("support_sessions")
    .update({ status: "closed", closed_by: "auto", closed_at: new Date().toISOString() })
    .eq("status", "open")
    .lt("last_message_at", cutoff);
}

/** Daftar sesi milik user: aktif dulu, lalu riwayat (terbaru di atas). */
export async function listMySupportSessions(userId: string): Promise<SupportSession[]> {
  const client = createAdminClient();
  await autoCloseStaleSessions(client);
  const { data, error } = await client
    .from("support_sessions")
    .select("*")
    .eq("user_id", userId)
    .order("last_message_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? [])
    .map(mapSession)
    .sort((a, b) => (a.status === b.status ? 0 : a.status === "open" ? -1 : 1));
}

/** Satu sesi milik user (null bila bukan miliknya / tidak ada). */
export async function getMySupportSession(
  userId: string,
  sessionId: string
): Promise<SupportSession | null> {
  const client = createAdminClient();
  await autoCloseStaleSessions(client);
  const { data, error } = await client
    .from("support_sessions")
    .select("*")
    .eq("id", sessionId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapSession(data) : null;
}

/**
 * Buat sesi baru + pesan pertama sekaligus. Judul sesi diambil dari
 * potongan pesan pertama. Ditolak bila user masih punya sesi open
 * (dijaga juga oleh partial unique index di DB).
 */
export async function createSupportSession(
  userId: string,
  firstMessage: string
): Promise<{ session?: SupportSession; error?: string }> {
  const body = firstMessage.trim();
  if (!body) return { error: "Pesan tidak boleh kosong." };
  if (body.length > 2000) return { error: "Pesan maksimal 2000 karakter." };

  const client = createAdminClient();
  await autoCloseStaleSessions(client);

  const { data: existing } = await client
    .from("support_sessions")
    .select("id")
    .eq("user_id", userId)
    .eq("status", "open")
    .maybeSingle();
  if (existing) return { error: "Masih ada sesi aktif. Lanjutkan percakapan di sana dulu." };

  const subject = body.length > 60 ? body.slice(0, 60).trimEnd() + "…" : body;
  const { data: session, error: e1 } = await client
    .from("support_sessions")
    .insert({ user_id: userId, subject })
    .select("*")
    .single();
  if (e1 || !session) return { error: e1?.message ?? "Gagal membuat sesi." };

  const { error: e2 } = await client
    .from("support_messages")
    .insert({ session_id: session.id, sender_id: userId, body });
  if (e2) return { error: e2.message };

  return { session: mapSession(session) };
}

/** Daftar pesan satu sesi (kronologis). Akses divalidasi pemanggil. */
export async function listSupportMessages(sessionId: string): Promise<SupportMessage[]> {
  const client = createAdminClient();
  const { data, error } = await client
    .from("support_messages")
    .select("*")
    .eq("session_id", sessionId)
    .order("created_at");
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapMessage);
}

/**
 * Kirim pesan ke sesi (user maupun admin). Menolak sesi closed -
 * enforcement di server, bukan sekadar menyembunyikan input di UI.
 * Sekaligus memajukan last_message_at dan penanda baca pengirim.
 */
export async function sendSupportMessage(
  sessionId: string,
  senderId: string,
  body: string,
  senderRole: "user" | "admin"
): Promise<{ message?: SupportMessage; error?: string }> {
  const text = body.trim();
  if (!text) return { error: "Pesan tidak boleh kosong." };
  if (text.length > 2000) return { error: "Pesan maksimal 2000 karakter." };

  const client = createAdminClient();
  await autoCloseStaleSessions(client);

  const { data: session, error: e0 } = await client
    .from("support_sessions")
    .select("id, user_id, status, subject, last_message_at, user_last_read_at")
    .eq("id", sessionId)
    .maybeSingle();
  if (e0) throw new Error(e0.message);
  if (!session) return { error: "Sesi tidak ditemukan." };
  if (senderRole === "user" && session.user_id !== senderId) {
    return { error: "Akses ditolak." };
  }
  if (session.status !== "open") {
    return { error: "Sesi ini sudah ditutup. Mulai sesi baru untuk topik baru." };
  }
  // Throttle email balasan admin: kirim hanya bila user sudah membaca
  // pesan terakhir (1 email per "giliran" - bukan per pesan).
  const userAlreadyReadLatest =
    senderRole === "admin" &&
    (!session.user_last_read_at || session.user_last_read_at >= session.last_message_at);

  const { data: message, error: e1 } = await client
    .from("support_messages")
    .insert({ session_id: sessionId, sender_id: senderId, body: text })
    .select("*")
    .single();
  if (e1 || !message) return { error: e1?.message ?? "Gagal mengirim pesan." };

  const now = new Date().toISOString();
  await client
    .from("support_sessions")
    .update({
      last_message_at: now,
      ...(senderRole === "user" ? { user_last_read_at: now } : { admin_last_read_at: now }),
    })
    .eq("id", sessionId);

  if (senderRole === "admin" && userAlreadyReadLatest) {
    void (async () => {
      try {
        const { data: member } = await client
          .from("profiles")
          .select("email, full_name, notify_email")
          .eq("id", session.user_id)
          .maybeSingle();
        if (!member?.email || member.notify_email === false) return;
        const content = supportReplyEmail({
          memberName: member.full_name ?? member.email.split("@")[0],
          sessionSubject: session.subject || "Percakapan",
          sessionId,
          preview: text.slice(0, 140),
        });
        const result = await sendEmail({ to: member.email, ...content });
        if (result.error) console.error("[email] supportReply:", result.error);
      } catch (e) {
        console.error("[email] supportReply:", e);
      }
    })();
  }

  return { message: mapMessage(message) };
}

/** Tutup sesi. User hanya boleh menutup sesinya; admin bebas. */
export async function closeSupportSession(
  sessionId: string,
  actorId: string,
  actorRole: "user" | "admin"
): Promise<{ error?: string }> {
  const client = createAdminClient();
  await autoCloseStaleSessions(client);
  const { data: session } = await client
    .from("support_sessions")
    .select("user_id, status")
    .eq("id", sessionId)
    .maybeSingle();
  if (!session) return { error: "Sesi tidak ditemukan." };
  if (actorRole === "user" && session.user_id !== actorId) return { error: "Akses ditolak." };
  if (session.status !== "open") return { error: "Sesi sudah ditutup." };

  const { error } = await client
    .from("support_sessions")
    .update({ status: "closed", closed_by: actorRole, closed_at: new Date().toISOString() })
    .eq("id", sessionId);
  if (error) throw new Error(error.message);
  return {};
}

/** Tandai semua pesan sesi sudah dibaca oleh pihak tertentu. */
export async function markSupportSessionRead(
  sessionId: string,
  actorId: string,
  actorRole: "user" | "admin"
): Promise<{ error?: string }> {
  const client = createAdminClient();
  const { data: session } = await client
    .from("support_sessions")
    .select("user_id")
    .eq("id", sessionId)
    .maybeSingle();
  if (!session) return { error: "Sesi tidak ditemukan." };
  if (actorRole === "user" && session.user_id !== actorId) return { error: "Akses ditolak." };

  const col = actorRole === "user" ? "user_last_read_at" : "admin_last_read_at";
  const { error } = await client
    .from("support_sessions")
    .update({ [col]: new Date().toISOString() })
    .eq("id", sessionId);
  if (error) throw new Error(error.message);
  return {};
}

/** Jumlah sesi dengan pesan admin yang belum dibaca user (badge lonceng). */
export async function countUnreadSupportForUser(userId: string): Promise<number> {
  const client = createAdminClient();
  await autoCloseStaleSessions(client);
  const { data, error } = await client
    .from("support_sessions")
    .select("id, last_message_at, user_last_read_at")
    .eq("user_id", userId);
  if (error) return 0;
  return (data ?? []).filter((s) => s.last_message_at > s.user_last_read_at).length;
}

/* ------------------------ sisi ADMIN ------------------------ */

/** Inbox admin: semua sesi + identitas pemilik + flag unread untuk admin. */
export async function adminListSupportSessions(
  tab: "active" | "history" = "active"
): Promise<SupportSession[]> {
  const client = createAdminClient();
  await autoCloseStaleSessions(client);
  const { data, error } = await client
    .from("support_sessions")
    .select("*")
    .eq("status", tab === "active" ? "open" : "closed")
    .order("last_message_at", { ascending: false })
    .limit(100);
  if (error) throw new Error(error.message);

  const sessions = (data ?? []).map(mapSession);
  // Identitas pemilik sesi (nama/email) untuk kolom inbox.
  const ids = [...new Set(sessions.map((s) => s.userId))];
  const names = new Map<string, { name: string; email: string }>();
  if (ids.length > 0) {
    const { data: profiles } = await client
      .from("profiles")
      .select("id, full_name, email")
      .in("id", ids);
    for (const p of profiles ?? []) {
      names.set(p.id, { name: p.full_name ?? p.email.split("@")[0], email: p.email });
    }
  }
  return sessions.map((s) => ({
    ...s,
    userName: names.get(s.userId)?.name ?? "Pengguna",
    userEmail: names.get(s.userId)?.email ?? "",
    unread: s.adminLastReadAt === null || s.lastMessageAt > s.adminLastReadAt,
  }));
}

/** Satu sesi untuk admin (tanpa batas kepemilikan). */
export async function adminGetSupportSession(sessionId: string): Promise<SupportSession | null> {
  const client = createAdminClient();
  await autoCloseStaleSessions(client);
  const { data, error } = await client
    .from("support_sessions")
    .select("*")
    .eq("id", sessionId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapSession(data) : null;
}

/** Jumlah sesi dengan pesan user yang belum dibaca admin (badge sidebar). */
export async function adminCountUnreadSupport(): Promise<number> {
  const client = createAdminClient();
  await autoCloseStaleSessions(client);
  const { data, error } = await client
    .from("support_sessions")
    .select("id, last_message_at, admin_last_read_at")
    .eq("status", "open");
  if (error) return 0;
  return (data ?? []).filter(
    (s) => s.admin_last_read_at === null || s.last_message_at > s.admin_last_read_at
  ).length;
}
