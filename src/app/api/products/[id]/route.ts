import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  adminDeleteProduct,
  adminUpdateProductFields,
  getMySubmission,
  updateMySubmission,
} from "@/lib/data";
import { getAdminUser, getSessionUser } from "@/lib/auth";
import type { SubmissionPayload } from "@/lib/types";
import { validateSubmissionPayload } from "@/lib/validation";
import { rateLimit, rateLimitKey } from "@/lib/rate-limit";

/**
 * PATCH /api/products/[id] - perbaiki pengajuan.
 * Pemilik hanya boleh saat miliknya; admin boleh untuk semua produk.
 * Keduanya memvalidasi payload sama ketat dengan POST (submit baru).
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json(
      { error: "Silakan masuk dengan Google untuk memperbaiki pengajuan." },
      { status: 401 }
    );
  }

  const { id } = await params;

  // Rate limit: maks 15 edit per jam per user (member maupun admin).
  const rl = rateLimit(rateLimitKey(request, user.id, "product-edit"), 15, 60 * 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: `Terlalu sering menyimpan. Coba lagi dalam ${Math.ceil(rl.retryAfterSeconds / 60)} menit.` },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } }
    );
  }

  let body: SubmissionPayload;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Format permintaan tidak valid." }, { status: 400 });
  }

  const errors = validateSubmissionPayload(body);
  if (errors.length > 0) {
    return NextResponse.json({ error: errors.join(" ") }, { status: 400 });
  }

  try {
    // Cek kepemilikan: milik sendiri → alur revisi member.
    const owned = await getMySubmission(user.id, id);
    if (owned) {
      const result = await updateMySubmission(user.id, id, body);
      if (result.error) return NextResponse.json({ error: result.error }, { status: 400 });
      return NextResponse.json({ ok: true });
    }

    // Bukan miliknya → hanya admin yang boleh (mis. memperbaiki data produk).
    if (!(await getAdminUser())) {
      return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
    }
    const result = await adminUpdateProductFields(id, body);
    if (result.error) return NextResponse.json({ error: result.error }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Gagal menyimpan perbaikan." },
      { status: 500 }
    );
  }
}

/** DELETE /api/products/[id] - hapus produk permanen (khusus admin). */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await getAdminUser())) {
    return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
  }

  const { id } = await params;
  try {
    const result = await adminDeleteProduct(id);
    if (result.error) return NextResponse.json({ error: result.error }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Gagal menghapus produk." },
      { status: 500 }
    );
  }
}
