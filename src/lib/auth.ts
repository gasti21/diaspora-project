import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

/**
 * Email admin pemilik platform (owner).
 * Tidak dapat dihapus / diturunkan rolenya lewat dashboard maupun API.
 */
export const PROTECTED_ADMIN_EMAIL = "karyadiaspora@gmail.com";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
}

/** Ambil user yang sedang login (null bila tamu / Supabase belum dikonfigurasi). */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  if (!isSupabaseConfigured) return null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) return null;

  return {
    id: user.id,
    email: user.email,
    name:
      (user.user_metadata.full_name as string | undefined) ??
      (user.user_metadata.name as string | undefined) ??
      user.email.split("@")[0],
    avatarUrl: user.user_metadata.avatar_url as string | undefined,
  };
});

/**
 * Cek role admin dari database - SATU-SATUNYA sumber kebenaran.
 * Tidak ada lagi fallback env/allowlist: hanya profiles.role = 'admin'.
 */
export const isDbAdmin = cache(async (userId: string): Promise<boolean> => {
  if (!isSupabaseConfigured) return false;

  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  return data?.role === "admin";
});

/** User login yang sekaligus admin (berdasarkan profiles.role), atau null. */
export async function getAdminUser(): Promise<SessionUser | null> {
  const user = await getSessionUser();
  if (!user) return null;
  if (!(await isDbAdmin(user.id))) return null;
  return user;
}
