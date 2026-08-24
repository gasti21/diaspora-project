/** True bila env Supabase sudah diisi - aplikasi memakai database asli. */
export const isSupabaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

/** Daftar email admin dari env, lowercase & tanpa spasi. */
export const adminEmails = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

/** Admin terbuka tanpa allowlist hanya untuk development. */
export const adminAllowlistActive =
  adminEmails.length > 0 || process.env.NODE_ENV === "production";

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
