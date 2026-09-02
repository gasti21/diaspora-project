import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getMySupportSession, listSupportMessages, sendSupportMessage } from "@/lib/data";
import { getSessionUser } from "@/lib/auth";
import { rateLimit, rateLimitKey } from "@/lib/rate-limit";
import { serverError } from "@/lib/api-error";

/** GET /api/support/sessions/[id]/messages - pesan sesi milik user (kronologis). */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Belum masuk." }, { status: 401 });
  const { id } = await params;
  try {
    // Validasi kepemilikan dulu - jangan bocorkan pesan sesi orang lain.
    const session = await getMySupportSession(user.id, id);
    if (!session) return NextResponse.json({ error: "Sesi tidak ditemukan." }, { status: 404 });
    const messages = await listSupportMessages(id);
    return NextResponse.json({ session, messages });
  } catch (e) {
    return serverError(e, "GET .../messages", "Gagal memuat pesan.");
  }
}

/** POST /api/support/sessions/[id]/messages - kirim pesan (ditolak bila sesi closed). */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Belum masuk." }, { status: 401 });
  const { id } = await params;

  // Rate limit: maks 30 pesan per menit per user.
  const rl = rateLimit(rateLimitKey(request, user.id, "support-msg"), 30, 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Terlalu cepat mengirim pesan. Pelankan sedikit ya." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } }
    );
  }

  let body: { body?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Format permintaan tidak valid." }, { status: 400 });
  }

  try {
    const result = await sendSupportMessage(id, user.id, body.body ?? "", "user");
    if (result.error) return NextResponse.json({ error: result.error }, { status: 400 });
    return NextResponse.json({ message: result.message }, { status: 201 });
  } catch (e) {
    return serverError(e, "POST .../messages", "Gagal mengirim pesan.");
  }
}
