import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { recordProductView } from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { rateLimit, rateLimitKey } from "@/lib/rate-limit";

/**
 * POST /api/products/[id]/view - rekam satu view produk.
 * Rate-limited untuk mencegah bot menggelembungkan statistik view
 * (RPC publik record_product_view sudah dihapus di migration 0009).
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Maks 5 view per menit per IP.
  const rl = rateLimit(rateLimitKey(request, null, "view"), 5, 60_000);
  if (!rl.allowed) {
    // View yang di-drop tetap dibalas 200 agar UI tidak menampilkan error.
    return new NextResponse(null, { status: 200 });
  }

  if (!isSupabaseConfigured) return new NextResponse(null, { status: 200 });

  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return new NextResponse(null, { status: 200 });
  }

  try {
    await recordProductView(id);
  } catch {
    // View gagal terekam tidak boleh mengganggu pengunjung.
  }
  return new NextResponse(null, { status: 200 });
}