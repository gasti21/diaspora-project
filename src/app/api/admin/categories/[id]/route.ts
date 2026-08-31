import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAdminUser } from "@/lib/auth";
import { adminDeleteCategory, adminUpdateCategory } from "@/lib/data";

/** PATCH /api/admin/categories/[id] - ubah nama kategori. */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await getAdminUser()))
    return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });

  const { id } = await params;
  let body: { name?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Format permintaan tidak valid." }, { status: 400 });
  }

  const name = body.name?.trim();
  if (!name || name.length < 2)
    return NextResponse.json(
      { error: "Nama kategori wajib diisi (minimal 2 karakter)." },
      { status: 400 }
    );

  try {
    const result = await adminUpdateCategory(id, name);
    if (result.error) return NextResponse.json({ error: result.error }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

/** DELETE /api/admin/categories/[id] - hapus kategori (ditolak bila masih dipakai produk). */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await getAdminUser()))
    return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });

  const { id } = await params;
  try {
    const result = await adminDeleteCategory(id);
    if (result.error) return NextResponse.json({ error: result.error }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
