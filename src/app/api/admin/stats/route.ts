import { NextResponse } from "next/server";
import { adminGetStats } from "@/lib/data";
import { getAdminUser } from "@/lib/auth";
import { serverError } from "@/lib/api-error";

/** GET /api/admin/stats - jumlah produk per status (khusus admin). */
export async function GET() {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
  }
  try {
    return NextResponse.json(await adminGetStats());
  } catch (e) {
    return serverError(e, "GET /api/admin/stats", "Gagal memuat statistik.");
  }
}
