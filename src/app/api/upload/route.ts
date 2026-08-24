import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { uploadProductImage } from "@/lib/data";
import { getSessionUser } from "@/lib/auth";
import { IMAGE_MAX_MB, IMAGE_TYPES } from "@/lib/constants";

/** POST /api/upload - unggah foto produk ke Storage (butuh login). */
export async function POST(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Silakan masuk terlebih dahulu." }, { status: 401 });
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

  try {
    const result = await uploadProductImage(file, user.id);
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ url: result.url }, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Gagal mengunggah file." },
      { status: 500 }
    );
  }
}
