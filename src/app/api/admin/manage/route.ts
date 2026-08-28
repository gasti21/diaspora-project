import { NextResponse } from "next/server";
import { getAdminUser, PROTECTED_ADMIN_EMAIL } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
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

  const client = await createClient();

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
 * Syarat: user sudah pernah login (row profiles sudah ada).
 */
export async function POST(request: Request) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
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

  const client = await createClient();

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

  // 2. Angkat jadi admin.
  const { error: updateError } = await client
    .from("profiles")
    .update({ role: "admin" })
    .eq("id", profile.id);

  if (updateError)
    return NextResponse.json({ error: updateError.message }, { status: 500 });

  return NextResponse.json({ ok: true }, { status: 201 });
}

/**
 * DELETE /api/admin/manage - turunkan admin menjadi user biasa.
 * Guard: admin pemilik (owner) tidak bisa dihapus, dan admin terakhir tidak boleh dihapus.
 */
export async function DELETE(request: Request) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
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

  const client = await createClient();

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

  const { error: updateError } = await client
    .from("profiles")
    .update({ role: "user" })
    .eq("email", email)
    .eq("role", "admin");

  if (updateError)
    return NextResponse.json({ error: updateError.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}