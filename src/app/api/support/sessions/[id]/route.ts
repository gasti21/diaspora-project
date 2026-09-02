import { NextResponse } from "next/server";
import {
  closeSupportSession,
  getMySupportSession,
  markSupportSessionRead,
} from "@/lib/data";
import { getSessionUser } from "@/lib/auth";
import { serverError } from "@/lib/api-error";

/** GET /api/support/sessions/[id] - detail sesi milik user. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Belum masuk." }, { status: 401 });
  const { id } = await params;
  try {
    const session = await getMySupportSession(user.id, id);
    if (!session) return NextResponse.json({ error: "Sesi tidak ditemukan." }, { status: 404 });
    return NextResponse.json({ session });
  } catch (e) {
    return serverError(e, "GET /api/support/sessions/[id]", "Gagal memuat sesi chat.");
  }
}

/**
 * PATCH /api/support/sessions/[id]
 * body { action: "close" }  → tutup sesi (konfirmasi di UI)
 * body { action: "read" }   → tandai semua pesan sudah dibaca user
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Belum masuk." }, { status: 401 });
  const { id } = await params;

  let body: { action?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Format permintaan tidak valid." }, { status: 400 });
  }

  try {
    if (body.action === "close") {
      const result = await closeSupportSession(id, user.id, "user");
      if (result.error) return NextResponse.json({ error: result.error }, { status: 400 });
      return NextResponse.json({ ok: true });
    }
    if (body.action === "read") {
      const result = await markSupportSessionRead(id, user.id, "user");
      if (result.error) return NextResponse.json({ error: result.error }, { status: 400 });
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ error: "Aksi tidak dikenal." }, { status: 400 });
  } catch (e) {
    return serverError(e, "PATCH /api/support/sessions/[id]", "Gagal memperbarui sesi.");
  }
}
