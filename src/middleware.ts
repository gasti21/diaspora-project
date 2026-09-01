import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

/**
 * Middleware Supabase Auth: memastikan cookie sesi selalu segar.
 * Tanpa ini, sesi login bisa kedaluwarsa di Server Component tanpa pernah
 * di-refresh, sehingga user "tiba-tiba logout" saat pindah halaman.
 */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  if (!isSupabaseConfigured) return response; // mode demo: tanpa Supabase

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Penting: memicu refresh token bila sudah mendekati kedaluwarsa.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Halaman "guest-only": marketing/onboarding untuk tamu. User yang sudah
  // login dialihkan langsung ke katalog (Explore) - tidak ada alasan melihat
  // landing page, tentang, atau kontak publik.
  const GUEST_ONLY = ["/", "/tentang", "/kontak"];
  if (user && GUEST_ONLY.includes(request.nextUrl.pathname)) {
    return NextResponse.redirect(new URL("/explore", request.url));
  }

  return response;
}

export const config = {
  // Jalankan di semua route kecuali aset statis (pola resmi @supabase/ssr).
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};