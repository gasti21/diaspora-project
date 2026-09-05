import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { adminBulkUpdateStatus } from "@/lib/data";
import { getAdminUser } from "@/lib/auth";
import { serverError } from "@/lib/api-error";
import type { ProductStatus } from "@/lib/types";

const VALID: ProductStatus[] = ["pending", "published", "revision", "rejected"];

/**
 * POST /api/admin/products/bulk - ubah status banyak produk sekaligus.
 * body: { ids: string[], status: ProductStatus, reviewNote?: string }
 * Per produk memakai jalur adminUpdateProduct -> email "tayang" tetap jalan.
 */
export async function POST(request: NextRequest) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });

  let body: { ids?: string[]; status?: string; reviewNote?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Format permintaan tidak valid." }, { status: 400 });
  }

  const ids = (body.ids ?? []).filter(
    (id) => typeof id === "string" && /^[0-9a-f-]{36}$/i.test(id)
  );
  if (ids.length === 0) {
    return NextResponse.json({ error: "Tidak ada produk yang dipilih." }, { status: 400 });
  }
  if (ids.length > 50) {
    return NextResponse.json({ error: "Maksimal 50 produk per aksi massal." }, { status: 400 });
  }
  if (!body.status || !VALID.includes(body.status as ProductStatus)) {
    return NextResponse.json({ error: "Status tidak valid." }, { status: 400 });
  }

  try {
    const result = await adminBulkUpdateStatus(ids, body.status as ProductStatus, {
      reviewNote: body.reviewNote?.trim() || null,
    });
    if (result.error) return NextResponse.json({ error: result.error }, { status: 400 });
    return NextResponse.json({ updated: result.updated, failed: result.failed });
  } catch (e) {
    return serverError(e, "POST /api/admin/products/bulk", "Gagal memproses aksi massal.");
  }
}
