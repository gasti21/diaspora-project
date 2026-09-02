import { NextResponse } from "next/server";
import {
  adminGetSupportSession,
  closeSupportSession,
  listSupportMessages,
  markSupportSessionRead,
} from "@/lib/data";
import { getAdminUser } from "@/lib/auth";
import { serverError } from "@/lib/api-error";

/** GET /api/admin/support/[id] - detail sesi + seluruh pesan (khusus admin). */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
  const { id } = await params;
  try {
    const session = await adminGetSupportSession(id);
    if (!session) return NextResponse.json({ error: "Sesi tidak ditemukan." }, { status: 404 });
    const messages = await listSupportMessages(id);
    return NextResponse.json({ session, messages });
  } catch (e) {
    return serverError(e, "GET /api/admin/support/[id]", "Gagal memuat sesi.");
  }
}

/** PATCH /api/admin/support/[id] - { action: "close" | "read" } (khusus admin). */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
  const { id } = await params;

  let body: { action?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Format permintaan tidak valid." }, { status: 400 });
  }

  try {
    if (body.action === "close") {
      const result = await closeSupportSession(id, admin.id, "admin");
      if (result.error) return NextResponse.json({ error: result.error }, { status: 400 });
      return NextResponse.json({ ok: true });
    }
    if (body.action === "read") {
      const result = await markSupportSessionRead(id, admin.id, "admin");
      if (result.error) return NextResponse.json({ error: result.error }, { status: 400 });
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ error: "Aksi tidak dikenal." }, { status: 400 });
  } catch (e) {
    return serverError(e, "PATCH /api/admin/support/[id]", "Gagal memperbarui sesi.");
  }
}
