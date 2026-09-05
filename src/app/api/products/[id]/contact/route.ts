import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getPublishedProductContact } from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { rateLimit, rateLimitKey } from "@/lib/rate-limit";

/**
 * GET /api/products/[id]/contact - kontak pemilik produk published.
 * Kolom kontak tidak di-grant ke anon/authenticated di database (migration
 * 0005) sehingga satu-satunya jalan mengambil kontak adalah endpoint ini -
 * yang rate-limited untuk mencegah scraping massal data PII pemilik.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Rate limit: maks 30 kali per 10 menit per IP.
  const rl = rateLimit(rateLimitKey(request, null, "contact"), 30, 10 * 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Terlalu sering meminta kontak. Coba lagi nanti." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } }
    );
  }

  if (!isSupabaseConfigured) {
    return NextResponse.json({ error: "Database belum terhubung." }, { status: 500 });
  }

  const { id } = await params;
  // Validasi format UUID untuk menghindari query sampah.
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json({ error: "Produk tidak ditemukan." }, { status: 404 });
  }

  try {
    const contact = await getPublishedProductContact(id);
    if (!contact) {
      return NextResponse.json({ error: "Produk tidak ditemukan." }, { status: 404 });
    }
    return NextResponse.json(contact);
  } catch {
    return NextResponse.json({ error: "Gagal memuat kontak." }, { status: 500 });
  }
}
