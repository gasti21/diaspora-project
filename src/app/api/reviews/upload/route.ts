import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { uploadReviewMedia } from "@/lib/data";
import { getSessionUser } from "@/lib/auth";
import {
  REVIEW_IMAGE_MAX_MB,
  REVIEW_VIDEO_MAX_MB,
  REVIEW_IMAGE_TYPES,
  REVIEW_VIDEO_TYPES,
  MAX_REVIEW_MEDIA_FILES,
} from "@/lib/constants";
import { rateLimit, rateLimitKey } from "@/lib/rate-limit";
import { serverError } from "@/lib/api-error";

/** POST /api/reviews/upload - unggah foto/video ulasan ke Storage (butuh login). */
export async function POST(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Silakan masuk terlebih dahulu." }, { status: 401 });
  }

  // Rate limit: maks 30 upload media ulasan per 15 menit per user.
  const rl = rateLimit(rateLimitKey(request, user.id, "review-upload"), 30, 15 * 60_000);
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

  const isImage = REVIEW_IMAGE_TYPES.includes(file.type);
  const isVideo = REVIEW_VIDEO_TYPES.includes(file.type);
  if (!isImage && !isVideo) {
    return NextResponse.json(
      { error: "Format harus JPG, PNG, WEBP (foto) atau MP4, WEBM, MOV (video)." },
      { status: 400 }
    );
  }

  const maxMb = isImage ? REVIEW_IMAGE_MAX_MB : REVIEW_VIDEO_MAX_MB;
  if (file.size > maxMb * 1024 * 1024) {
    return NextResponse.json(
      { error: isImage ? `Ukuran foto maksimal ${maxMb}MB.` : `Ukuran video maksimal ${maxMb}MB.` },
      { status: 400 }
    );
  }

  // Magic bytes sederhana: pastikan isi file sesuai klaim MIME-nya.
  const head = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const okImage =
    (head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff) || // JPEG
    (head[0] === 0x89 && head[1] === 0x50 && head[2] === 0x4e && head[3] === 0x47) || // PNG
    (head[0] === 0x52 && head[1] === 0x49 && head[8] === 0x57 && head[9] === 0x45); // WEBP (RIFF....WEBP)
  const okVideo =
    (head[4] === 0x66 && head[5] === 0x74 && head[6] === 0x79 && head[7] === 0x70) || // MP4/MOV (....ftyp)
    (head[0] === 0x1a && head[1] === 0x45 && head[2] === 0xdf && head[3] === 0xa3); // WEBM (EBML)
  if (isImage && !okImage) {
    return NextResponse.json({ error: "Isi file bukan gambar yang valid." }, { status: 400 });
  }
  if (isVideo && !okVideo) {
    return NextResponse.json({ error: "Isi file bukan video yang valid." }, { status: 400 });
  }

  try {
    const result = await uploadReviewMedia(file, user.id, MAX_REVIEW_MEDIA_FILES);
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json(
      { url: result.url, type: isImage ? "image" : "video" },
      { status: 201 }
    );
  } catch (e) {
    return serverError(e, "POST /api/reviews/upload", "Gagal mengunggah media.");
  }
}