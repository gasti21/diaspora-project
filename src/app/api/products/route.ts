import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { listPublicProducts, createSubmission } from "@/lib/data";
import { getSessionUser } from "@/lib/auth";
import { PER_PAGE } from "@/lib/constants";
import { rateLimit, rateLimitKey } from "@/lib/rate-limit";
import { serverError } from "@/lib/api-error";
import type { SubmissionPayload } from "@/lib/types";
import { validateSubmissionPayload } from "@/lib/validation";

/** GET /api/products - katalog publik (hanya published). */
export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  try {
    const result = await listPublicProducts({
      q: sp.get("q") ?? undefined,
      category: sp.get("kategori") ?? undefined,
      country: sp.get("lokasi") ?? undefined,
      stage: sp.get("status") ?? undefined,
      need: sp.get("kebutuhan") ?? undefined,
      sort: (sp.get("urutkan") as "terbaru" | "terlama" | "nama") ?? undefined,
      page: Math.max(1, parseInt(sp.get("halaman") ?? "1", 10) || 1),
      perPage: Math.min(48, parseInt(sp.get("perHalaman") ?? String(PER_PAGE), 10) || PER_PAGE),
    });
    return NextResponse.json(result);
  } catch (e) {
    return serverError(e, "GET /api/products", "Gagal memuat produk.");
  }
}

/** POST /api/products - ajukan produk (butuh login Google) → status pending. */
export async function POST(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json(
      { error: "Silakan masuk dengan Google untuk mengirim produk." },
      { status: 401 }
    );
  }

  // Rate limit: maks 5 pengajuan baru per jam per user.
  const rl = rateLimit(rateLimitKey(request, user.id, "submit"), 5, 60 * 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      {
        error: `Batas pengajuan tercapai. Coba lagi dalam ${Math.ceil(rl.retryAfterSeconds / 60)} menit.`,
      },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } }
    );
  }

  let body: SubmissionPayload;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Format permintaan tidak valid." }, { status: 400 });
  }

  // Validasi sisi server (form juga memvalidasi di klien).
  const errors = validateSubmissionPayload(body);
  if (errors.length > 0) {
    return NextResponse.json({ error: errors.join(" ") }, { status: 400 });
  }

  try {
    const result = await createSubmission(body, user);
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json(result, { status: 201 });
  } catch (e) {
    return serverError(e, "POST /api/products", "Gagal menyimpan produk.");
  }
}
