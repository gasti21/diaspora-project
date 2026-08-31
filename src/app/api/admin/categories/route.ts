import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAdminUser } from "@/lib/auth";
import { adminCreateCategory, adminListCategories } from "@/lib/data";

/** GET /api/admin/categories - daftar kategori + jumlah produk. */
export async function GET() {
  if (!(await getAdminUser()))
    return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
  try {
    return NextResponse.json({ categories: await adminListCategories() });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

/** POST /api/admin/categories - tambah kategori baru. */
export async function POST(request: NextRequest) {
  if (!(await getAdminUser()))
    return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });

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
    const result = await adminCreateCategory(name);
    if (result.error) return NextResponse.json({ error: result.error }, { status: 400 });
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
