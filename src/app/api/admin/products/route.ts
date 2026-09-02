import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { adminListProducts } from "@/lib/data";
import { getAdminUser } from "@/lib/auth";
import { PER_PAGE } from "@/lib/constants";
import { serverError } from "@/lib/api-error";
import type { ProductStatus } from "@/lib/types";

/** GET /api/admin/products - daftar semua status (khusus admin). */
export async function GET(request: NextRequest) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
  }

  const sp = request.nextUrl.searchParams;
  const status = sp.get("status");
  try {
    const result = await adminListProducts({
      status: (status as ProductStatus) || undefined,
      q: sp.get("q") ?? undefined,
      page: Math.max(1, parseInt(sp.get("halaman") ?? "1", 10) || 1),
      perPage: Math.min(48, parseInt(sp.get("perHalaman") ?? String(PER_PAGE), 10) || PER_PAGE),
    });
    return NextResponse.json(result);
  } catch (e) {
    return serverError(e, "GET /api/admin/products", "Gagal memuat data.");
  }
}
