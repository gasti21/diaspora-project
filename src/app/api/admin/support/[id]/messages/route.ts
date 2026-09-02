import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { sendSupportMessage } from "@/lib/data";
import { getAdminUser } from "@/lib/auth";
import { rateLimit, rateLimitKey } from "@/lib/rate-limit";
import { serverError } from "@/lib/api-error";

/** POST /api/admin/support/[id]/messages - balasan admin ke sesi (khusus admin). */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
  const { id } = await params;

  // Rate limit: maks 60 balasan per menit per admin.
  const rl = rateLimit(rateLimitKey(request, admin.id, "support-reply"), 60, 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Terlalu cepat mengirim pesan." },
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
    const result = await sendSupportMessage(id, admin.id, body.body ?? "", "admin");
    if (result.error) return NextResponse.json({ error: result.error }, { status: 400 });
    return NextResponse.json({ message: result.message }, { status: 201 });
  } catch (e) {
    return serverError(e, "POST /api/admin/support/[id]/messages", "Gagal mengirim balasan.");
  }
}
