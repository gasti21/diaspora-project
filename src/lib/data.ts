import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { SessionUser } from "@/lib/auth";
import { SAMPLE_PRODUCTS } from "@/lib/sample-data";
import { CATEGORIES, COUNTRIES, PER_PAGE, slugify } from "@/lib/constants";
import type {
  AdminStats,
  Paginated,
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
  owner_email: string;
  owner_whatsapp: string;
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
    ownerEmail: row.owner_email,
    ownerWhatsapp: row.owner_whatsapp,
    status: row.status as ProductStatus,
    reviewNote: row.review_note,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

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
    .select("*, categories!inner(id, slug, name)", { count: "exact" })
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

  query = query
    .order("created_at", { ascending: false })
    .range((page - 1) * perPage, page * perPage - 1);

  const { data, count, error } = await query;
  if (error) throw new Error(error.message);

  const total = count ?? 0;
  return {
    data: (data as DbRow[]).map(toProduct),
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
    .select("*, categories(id, slug, name)")
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data as DbRow[]).map(toProduct);
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  if (!isSupabaseConfigured) {
    return SAMPLE_PRODUCTS.find((p) => p.slug === slug) ?? null;
  }
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("*, categories(id, slug, name)")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? toProduct(data as DbRow) : null;
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
    .select("*, categories(id, slug, name)")
    .eq("status", "published")
    .eq("category_id", product.categoryId)
    .neq("id", product.id)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data as DbRow[]).map(toProduct);
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
      owner_email: payload.ownerEmail,
      owner_whatsapp: payload.ownerWhatsapp,
      needs: payload.needs,
      needs_other: payload.needsOther || null,
      status: "pending",
      submitted_by: user.id,
    })
    .select("id, slug")
    .single();

  if (error) return { error: error.message };
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
    .select("*, categories(id, slug, name)", { count: "exact" });

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
    data: (data as DbRow[]).map(toProduct),
    total,
    page,
    perPage,
    totalPages: Math.max(1, Math.ceil(total / perPage)),
  };
}

export async function adminGetStats(): Promise<AdminStats> {
  if (!isSupabaseConfigured) {
    const stats: AdminStats = { pending: 0, published: 0, revision: 0, rejected: 0 };
    for (const p of SAMPLE_PRODUCTS) stats[p.status]++;
    return stats;
  }

  const supabase = await createClient();
  const stats: AdminStats = { pending: 0, published: 0, revision: 0, rejected: 0 };
  await Promise.all(
    (["pending", "published", "revision", "rejected"] as const).map(async (s) => {
      const { count } = await supabase
        .from("products")
        .select("id", { count: "exact", head: true })
        .eq("status", s);
      stats[s] = count ?? 0;
    })
  );
  return stats;
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

  return error ? { error: error.message } : {};
}

/** Upload foto ke Storage bucket `product-images` (butuh service role key). */
export async function uploadProductImage(
  file: File,
  userId: string
): Promise<{ url?: string; error?: string }> {
  if (!isSupabaseConfigured) return { error: NOT_CONFIGURED };
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY)
    return { error: "SUPABASE_SERVICE_ROLE_KEY belum diisi di .env.local." };

  const admin = createAdminClient();
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
  filters: { q?: string; category?: string; country?: string; stage?: string; need?: string; page?: number; perPage?: number },
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
