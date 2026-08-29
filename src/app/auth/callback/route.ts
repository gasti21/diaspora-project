import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

/** Callback OAuth Google: tukar kode menjadi sesi lalu arahkan sesuai role. */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next");

  if (!isSupabaseConfigured) {
    return NextResponse.redirect(`${origin}/login?error=not-configured`);
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Tujuan eksplisit (mis. ?next=/admin atau /pengajuan) selalu dihormati.
      // "/submit" dianggap default (bukan eksplisit) supaya admin tetap
      // diarahkan ke dashboard.
      if (next && next.startsWith("/") && next !== "/submit") {
        return NextResponse.redirect(`${origin}${next}`);
      }

      // Default cerdas berdasarkan role & riwayat pengajuan:
      // admin -> /admin, user yang sudah pernah submit -> /dashboard
      // (pusat ringkasan member), user baru -> /submit.
      const {
        data: { user },
      } = await supabase.auth.getUser();

      let target = "/submit";
      let welcome = "user";

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle();

        if (profile?.role === "admin") {
          target = "/admin";
          welcome = "admin";
        } else {
          const { count } = await supabase
            .from("products")
            .select("id", { count: "exact", head: true })
            .eq("submitted_by", user.id);
          if ((count ?? 0) > 0) target = "/dashboard";
        }
      }

      return NextResponse.redirect(`${origin}${target}?welcome=${welcome}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=oauth`);
}
