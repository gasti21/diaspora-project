import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  createSupportSession,
  listMySupportSessions,
  countUnreadSupportForUser,
} from "@/lib/data";
import { getSessionUser } from "@/lib/auth";
import { rateLimit, rateLimitKey } from "@/lib/rate-limit";
import { serverError } from "@/lib/api-error";

/** GET /api/support/sessions - daftar sesi milik user + jumlah unread. */
export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Belum masuk." }, { status: 401 });
  try {
    const [sessions, unreadCount] = await Promise.all([
      listMySupportSessions(user.id),
      countUnreadSupportForUser(user.id),
    ]);
    return NextResponse.json({ sessions, unreadCount });
  } catch (e) {
    return serverError(e, "GET /api/support/sessions", "Gagal memuat sesi chat.");
  }
}

/** POST /api/support/sessions - buat sesi baru + pesan pertama. */
export async function POST(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Belum masuk." }, { status: 401 });

  // Rate limit: maks 5 sesi baru per jam per user.
  const rl = rateLimit(rateLimitKey(request, user.id, "support-new"), 5, 60 * 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Terlalu sering membuka sesi. Coba sebentar lagi." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } }
    );
  }

  let body: { message?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Format permintaan tidak valid." }, { status: 400 });
  }

  try {
    const result = await createSupportSession(user.id, body.message ?? "");
    if (result.error) return NextResponse.json({ error: result.error }, { status: 400 });
    return NextResponse.json({ session: result.session }, { status: 201 });
  } catch (e) {
    return serverError(e, "POST /api/support/sessions", "Gagal membuat sesi chat.");
  }
}
