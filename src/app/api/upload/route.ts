import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { uploadProductImage } from "@/lib/data";
import { getSessionUser } from "@/lib/auth";
import { IMAGE_MAX_MB, IMAGE_TYPES } from "@/lib/constants";
import { rateLimit, rateLimitKey } from "@/lib/rate-limit";
import { serverError } from "@/lib/api-error";

/** Batas file foto per user di bucket (mencegah penyalahgunaan storage). */
const MAX_FILES_PER_USER = 25;

/** POST /api/upload - unggah foto produk ke Storage (butuh login). */
export async function POST(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Silakan masuk terlebih dahulu." }, { status: 401 });
  }

  // Rate limit: maks 20 upload per 15 menit per user.
  const rl = rateLimit(rateLimitKey(request, user.id, "upload"), 20, 15 * 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: `Terlalu sering mengunggah. Coba lagi dalam ${Math.ceil(rl.retryAfterSeconds / 60)} menit.` },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } }
    );
  }

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "File tidak ditemukan." }, { status: 400 });
  }
  if (!IMAGE_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Format harus JPG atau PNG." }, { status: 400 });
  }
  if (file.size > IMAGE_MAX_MB * 1024 * 1024) {
    return NextResponse.json(
      { error: `Ukuran maksimal ${IMAGE_MAX_MB}MB.` },
      { status: 400 }
    );
  }

  // Magic bytes: MIME header bisa dipalsukan - periksa isi file sungguhan.
  const head = new Uint8Array(await file.slice(0, 8).arrayBuffer());
  const isJpeg = head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff;
  const isPng =
    head[0] === 0x89 && head[1] === 0x50 && head[2] === 0x4e && head[3] === 0x47;
  if (!isJpeg && !isPng) {
    return NextResponse.json(
      { error: "Isi file bukan gambar JPG/PNG yang valid." },
      { status: 400 }
    );
  }

  try {
    // Kuota storage per user (service role melihat seluruh prefix user).
    const result = await uploadProductImage(file, user.id, MAX_FILES_PER_USER);
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ url: result.url }, { status: 201 });
  } catch (e) {
    return serverError(e, "POST /api/upload", "Gagal mengunggah file.");
  }
}
