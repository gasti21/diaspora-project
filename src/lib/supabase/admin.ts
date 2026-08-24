import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/** Klien service-role: hanya untuk Route Handler admin (bypass RLS). */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
