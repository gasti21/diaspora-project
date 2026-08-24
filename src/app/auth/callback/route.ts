import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

/** Callback OAuth Google: tukar kode menjadi sesi lalu lanjut ke halaman tujuan. */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/submit";

  if (!isSupabaseConfigured) {
    return NextResponse.redirect(`${origin}/login?error=not-configured`);
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next.startsWith("/") ? next : "/submit"}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=oauth`);
}
