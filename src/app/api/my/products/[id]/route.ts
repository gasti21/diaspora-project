import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { deleteMySubmission } from "@/lib/data";
import { getSessionUser } from "@/lib/auth";
import { serverError } from "@/lib/api-error";

type RouteContext = { params: Promise<{ id: string }> };

/** DELETE /api/my/products/[id] - tarik pengajuan sendiri (butuh login + kepemilikan). */
export async function DELETE(_request: NextRequest, context: RouteContext) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Silakan masuk terlebih dahulu." }, { status: 401 });
  }
  const { id } = await context.params;
  try {
    const { error } = await deleteMySubmission(user.id, id);
    if (error) return NextResponse.json({ error }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return serverError(e, "DELETE /api/my/products/[id]", "Gagal menarik pengajuan.");
  }
}
