import { NextResponse } from "next/server";
import { getAdminUser, PROTECTED_ADMIN_EMAIL } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";

/**
 * GET /api/admin/manage - daftar admin (dari tabel profiles, role = 'admin').
 * Hanya admin yang boleh mengakses.
 */
export async function GET() {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
  if (!isSupabaseConfigured)
    return NextResponse.json({ error: "Database belum terhubung." }, { status: 500 });

  // Service-role client dipakai konsisten di route ini (akses sudah diguard
  // getAdminUser); perlu untuk read/update profile user lain tanpa tertahan RLS.
  const client = createAdminClient();

  const { data, error } = await client
    .from("profiles")
    .select("id, email, full_name, avatar_url, created_at")
    .eq("role", "admin")
    .order("created_at", { ascending: true });

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  const admins = (data ?? []).map((row) => ({
    id: row.id,
    email: row.email,
    name: row.full_name ?? row.email.split("@")[0],
    avatarUrl: row.avatar_url,
    createdAt: row.created_at,
    protected: row.email.toLowerCase() === PROTECTED_ADMIN_EMAIL,
  }));

  return NextResponse.json({ admins });
}

/**
 * POST /api/admin/manage - angkat user menjadi admin.
 * Hanya admin PEMILIK (owner, PROTECTED_ADMIN_EMAIL) yang boleh - prinsip
 * least-privilege: admin biasa tidak bisa menambah admin baru.
 */
export async function POST(request: Request) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
  if (admin.email.toLowerCase() !== PROTECTED_ADMIN_EMAIL)
    return NextResponse.json(
      { error: "Hanya admin pemilik platform yang dapat menambah admin." },
      { status: 403 }
    );
  if (!isSupabaseConfigured)
    return NextResponse.json({ error: "Database belum terhubung." }, { status: 500 });

  let body: { email?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Format permintaan tidak valid." }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return NextResponse.json({ error: "Email tidak valid." }, { status: 400 });

  // Service-role client: diperlukan untuk mengubah role baris profile user lain.
  const client = createAdminClient();

  // 1. User harus sudah pernah login (row profiles ada).
  const { data: profile, error: findError } = await client
    .from("profiles")
    .select("id, email, role")
    .eq("email", email)
    .maybeSingle();

  if (findError)
    return NextResponse.json({ error: findError.message }, { status: 500 });

  if (!profile)
    return NextResponse.json(
      {
        error:
          "Email tersebut belum pernah login ke platform. Minta orangnya login dulu dengan Google, lalu tambahkan lagi.",
      },
      { status: 404 }
    );

  if (profile.role === "admin")
    return NextResponse.json({ error: "User tersebut sudah menjadi admin." }, { status: 400 });

  // 2. Angkat jadi admin - verifikasi baris benar-benar ter-update
  //    (tanpa .select(), update 0 baris tidak memicu error = sukses palsu).
  const { data: promoted, error: updateError } = await client
    .from("profiles")
    .update({ role: "admin" })
    .eq("id", profile.id)
    .select("id")
    .maybeSingle();

  if (updateError)
    return NextResponse.json({ error: updateError.message }, { status: 500 });

  if (!promoted)
    return NextResponse.json(
      { error: "Gagal mengangkat admin - baris tidak ditemukan." },
      { status: 404 }
    );

  return NextResponse.json({ ok: true }, { status: 201 });
}

/**
 * DELETE /api/admin/manage - turunkan admin menjadi user biasa.
 * Guard 1: hanya admin pemilik (owner) yang boleh menurunkan admin.
 * Guard 2: admin pemilik (owner) tidak bisa dihapus.
 * Guard 3: admin terakhir tidak boleh dihapus.
 */
export async function DELETE(request: Request) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
  if (admin.email.toLowerCase() !== PROTECTED_ADMIN_EMAIL)
    return NextResponse.json(
      { error: "Hanya admin pemilik platform yang dapat menurunkan admin." },
      { status: 403 }
    );
  if (!isSupabaseConfigured)
    return NextResponse.json({ error: "Database belum terhubung." }, { status: 500 });

  let body: { email?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Format permintaan tidak valid." }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  if (!email)
    return NextResponse.json({ error: "Email wajib diisi." }, { status: 400 });

  // Guard 1: admin pemilik platform dilindungi.
  if (email === PROTECTED_ADMIN_EMAIL)
    return NextResponse.json(
      { error: "Admin pemilik platform tidak dapat dihapus atau diganti." },
      { status: 403 }
    );

  // Service-role client: diperlukan untuk mengubah role baris profile user lain.
  const client = createAdminClient();

  // Guard 2: minimal harus tersisa satu admin.
  const { count, error: countError } = await client
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("role", "admin");

  if (countError)
    return NextResponse.json({ error: countError.message }, { status: 500 });

  if ((count ?? 0) <= 1)
    return NextResponse.json(
      { error: "Tidak bisa menghapus - minimal harus tersisa satu admin." },
      { status: 400 }
    );

  // Turunkan role - verifikasi baris benar-benar ter-update
  // (tanpa .select(), update 0 baris tidak memicu error = sukses palsu).
  const { data: demoted, error: updateError } = await client
    .from("profiles")
    .update({ role: "user" })
    .eq("email", email)
    .eq("role", "admin")
    .select("id")
    .maybeSingle();

  if (updateError)
    return NextResponse.json({ error: updateError.message }, { status: 500 });

  if (!demoted)
    return NextResponse.json(
      { error: "Email tersebut bukan admin." },
      { status: 404 }
    );

  return NextResponse.json({ ok: true });
}