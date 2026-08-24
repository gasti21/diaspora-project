import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { adminUpdateProduct } from "@/lib/data";
import { getAdminUser } from "@/lib/auth";
import type { ProductStatus } from "@/lib/types";

const VALID: ProductStatus[] = ["pending", "published", "revision", "rejected"];

/** PATCH /api/admin/products/[id] - ubah status + catatan review (khusus admin). */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
  }

  const { id } = await params;
  let body: { status?: string; reviewNote?: string | null };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Format permintaan tidak valid." }, { status: 400 });
  }

  if (!body.status || !VALID.includes(body.status as ProductStatus)) {
    return NextResponse.json({ error: "Status tidak valid." }, { status: 400 });
  }

  try {
    const result = await adminUpdateProduct(id, {
      status: body.status as ProductStatus,
      reviewNote: body.reviewNote?.trim() || null,
    });
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Gagal memperbarui produk." },
      { status: 500 }
    );
  }
}
