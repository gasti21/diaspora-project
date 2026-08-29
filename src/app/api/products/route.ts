import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { listPublicProducts, createSubmission } from "@/lib/data";
import { getSessionUser } from "@/lib/auth";
import { PER_PAGE, MAX_IMAGES } from "@/lib/constants";
import type { Stage, SubmissionPayload } from "@/lib/types";

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
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Gagal memuat produk." },
      { status: 500 }
    );
  }
}

const STAGE_VALUES: Stage[] = ["Sudah Dijual", "Prototype", "Riset"];

/** POST /api/products - ajukan produk (butuh login Google) → status pending. */
export async function POST(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json(
      { error: "Silakan masuk dengan Google untuk mengirim produk." },
      { status: 401 }
    );
  }

  let body: SubmissionPayload;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Format permintaan tidak valid." }, { status: 400 });
  }

  // Validasi sisi server (form juga memvalidasi di klien).
  const errors: string[] = [];
  if (!body.name?.trim()) errors.push("Nama produk wajib diisi.");
  if (!body.categoryId) errors.push("Kategori wajib dipilih.");
  if (!body.stage || !STAGE_VALUES.includes(body.stage)) errors.push("Tahap produk tidak valid.");
  if (!body.country?.trim()) errors.push("Negara/lokasi wajib diisi.");
  if (!body.shortDescription?.trim()) errors.push("Deskripsi singkat wajib diisi.");
  if (!body.longDescription?.trim()) errors.push("Deskripsi lengkap wajib diisi.");
  if (!Array.isArray(body.images) || body.images.length === 0)
    errors.push("Minimal 1 foto produk.");
  if (Array.isArray(body.images) && body.images.length > MAX_IMAGES)
    errors.push(`Maksimal ${MAX_IMAGES} foto produk.`);
  if (!body.ownerName?.trim()) errors.push("Nama pemilik wajib diisi.");
  if (!body.ownerEmail?.trim()) errors.push("Email wajib diisi.");
  if (!body.ownerWhatsapp?.trim()) errors.push("Nomor WhatsApp wajib diisi.");
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
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Gagal menyimpan produk." },
      { status: 500 }
    );
  }
}
