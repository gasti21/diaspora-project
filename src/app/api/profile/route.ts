import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getMyProfile, updateMyProfile, uploadAvatar } from "@/lib/data";
import { getSessionUser } from "@/lib/auth";
import { rateLimit, rateLimitKey } from "@/lib/rate-limit";

/** GET /api/profile - profil user yang sedang login. */
export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Belum masuk." }, { status: 401 });
  try {
    const profile = await getMyProfile(user.id);
    if (!profile) return NextResponse.json({ error: "Profil tidak ditemukan." }, { status: 404 });
    return NextResponse.json(profile);
  } catch (e) {
    return NextResponse.json({ error: "Terjadi kesalahan pada server. Silakan coba lagi." }, { status: 500 });
  }
}

/** PATCH /api/profile - perbarui nama/bio/avatar. Email tidak bisa diubah. */
export async function PATCH(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Belum masuk." }, { status: 401 });

  // Rate limit: maks 10 simpan profil per menit.
  const rl = rateLimit(rateLimitKey(request, user.id, "profile"), 10, 60_000);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Terlalu sering menyimpan. Coba sebentar lagi." }, {
      status: 429,
      headers: { "Retry-After": String(rl.retryAfterSeconds) },
    });
  }

  let body: {
    name?: string;
    bio?: string | null;
    avatarUrl?: string | null;
    socials?: Record<string, string | null>;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Format permintaan tidak valid." }, { status: 400 });
  }

  try {
    const result = await updateMyProfile(user.id, body);
    if (result.error) return NextResponse.json({ error: result.error }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: "Terjadi kesalahan pada server. Silakan coba lagi." }, { status: 500 });
  }
}

/** POST /api/profile - upload avatar (multipart, field "file"). */
export async function POST(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Belum masuk." }, { status: 401 });

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "File tidak ditemukan." }, { status: 400 });
  }

  try {
    const result = await uploadAvatar(file, user.id);
    if (result.error) return NextResponse.json({ error: result.error }, { status: 400 });
    return NextResponse.json({ url: result.url }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: "Terjadi kesalahan pada server. Silakan coba lagi." }, { status: 500 });
  }
}
