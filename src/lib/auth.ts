import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured, adminEmails, adminAllowlistActive } from "@/lib/supabase/config";

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

/** Cek email terhadap allowlist admin (ADMIN_EMAILS). */
export function isAdminEmail(email?: string | null) {
  if (!email) return false;
  if (!adminAllowlistActive) return true; // dev tanpa allowlist
  if (adminEmails.length === 0) return process.env.NODE_ENV !== "production";
  return adminEmails.includes(email.toLowerCase());
}

/** User login yang sekaligus admin, atau null. */
export async function getAdminUser(): Promise<SessionUser | null> {
  const user = await getSessionUser();
  if (!user || !isAdminEmail(user.email)) return null;
  return user;
}
