import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { adminDeleteReview } from "@/lib/data";
import { getAdminUser } from "@/lib/auth";
import { serverError } from "@/lib/api-error";

type RouteContext = { params: Promise<{ id: string }> };

/** DELETE /api/admin/reviews/[id] - hapus ulasan apa pun (moderasi admin). */
export async function DELETE(_request: NextRequest, context: RouteContext) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
  }
  const { id } = await context.params;
  try {
    const { error } = await adminDeleteReview(id);
    if (error) return NextResponse.json({ error }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return serverError(e, "DELETE /api/admin/reviews/[id]", "Gagal menghapus ulasan.");
  }
}
