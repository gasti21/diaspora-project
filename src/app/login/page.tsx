"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { LogoMark } from "@/components/branding/Logo";
import { useToast } from "@/components/toast/ToastProvider";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const params = useSearchParams();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const oauthNotified = useRef(false);

  // Error dari /auth/callback (?error=oauth | not-configured) -> toast kanan-atas.
  useEffect(() => {
    if (oauthNotified.current) return; // jangan dobel saat strict mode
    switch (params.get("error")) {
      case "oauth":
        oauthNotified.current = true;
        toast.error("Login Google gagal atau dibatalkan. Silakan coba lagi.");
        break;
      case "not-configured":
        oauthNotified.current = true;
        toast.error(
          "Login Google belum aktif: kredensial Supabase belum diisi di .env.local."
        );
        break;
    }
  }, [params, toast]);

  async function signInWithGoogle() {
    if (!isSupabaseConfigured) {
      toast.error(
        "Login Google belum aktif: kredensial Supabase belum diisi di .env.local. Lihat README bagian Setup."
      );
      return;
    }
    setLoading(true);
    const supabase = createClient();
    // Param `next` hanya dikirim bila eksplisit; callback punya routing cerdas
    // sendiri (admin -> /admin, user -> /submit atau /pengajuan).
    const explicit = params.get("next");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: explicit
          ? `${window.location.origin}/auth/callback?next=${encodeURIComponent(explicit)}`
          : `${window.location.origin}/auth/callback`,
        queryParams: { prompt: "select_account" },
      },
    });
    if (error) {
      toast.error(error.message);
      setLoading(false);
    }
    // Berhasil: browser diarahkan ke Google oleh Supabase.
  }

  return (
    <div className="flex min-h-screen bg-surface">
      {/* Panel brand (desktop) */}
      <div className="relative hidden w-[46%] flex-col justify-between overflow-hidden bg-navy-deep p-12 text-white lg:flex">
        <div className="flex items-center gap-3">
          <LogoMark className="h-10 w-10" />
          <p className="text-xl font-extrabold">
            Karya<span className="text-red-400">Diaspora</span>
          </p>
        </div>

        <div>
          <h2 className="text-3xl font-extrabold leading-snug">
            Satu pintu menuju karya<br />diaspora Indonesia.
          </h2>
          <ul className="mt-8 space-y-4 text-sm text-white/80">
            {[
              "Ajukan produk Anda dan pantau statusnya secara transparan",
              "Produk ditinjau tim kurasi sebelum tayang di katalog publik",
              "Tanpa password baru - cukup akun Google Anda",
            ].map((t) => (
              <li key={t} className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-4.5 w-4.5 shrink-0 text-green-400" aria-hidden="true" />
                {t}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-white/50">
          © {new Date().getFullYear()} KaryaDiaspora - Platform Konektivitas Bisnis Diaspora Indonesia
        </p>
      </div>

      {/* Panel form */}
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="rounded-2xl border border-line bg-white p-8 shadow-sm sm:p-10">
            <div className="flex justify-center lg:hidden">
              <LogoMark className="h-12 w-12" />
            </div>
            <h1 className="mt-4 text-center text-2xl font-extrabold lg:mt-0">
              Masuk ke <span className="text-brand">KaryaDiaspora</span>
            </h1>
            <p className="mt-2 text-center text-sm leading-relaxed text-muted">
              Gunakan akun Google (Gmail) Anda - tanpa perlu membuat password baru.
            </p>

            <button
              onClick={signInWithGoogle}
              disabled={loading}
              className="mt-6 flex w-full items-center justify-center gap-3 rounded-xl border border-line bg-white px-5 py-3.5 text-sm font-semibold text-navy shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-surface hover:shadow-md active:translate-y-0 active:shadow-sm disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-sm"
            >
              {loading ? (
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-navy/30 border-t-navy" />
              ) : (
                <GoogleIcon />
              )}
              {loading ? "Mengalihkan ke Google..." : "Masuk dengan Google"}
            </button>

            <p className="mt-6 text-center text-xs leading-relaxed text-muted">
              Dengan masuk, Anda menyetujui data yang dikirimkan akan ditinjau
              oleh admin sebelum ditayangkan.
            </p>
          </div>

          <Link
            href="/"
            className="mt-6 block text-center text-sm font-medium text-navy/70 transition hover:text-brand"
          >
            ← Kembali ke beranda
          </Link>
        </div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.5 12.3c0-.9-.1-1.5-.3-2.3H12v4.5h6.5a5.6 5.6 0 0 1-2.4 3.6v3h3.9c2.3-2.1 3.5-5.2 3.5-8.8Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.2 0 6-1.1 8-2.9l-3.9-3a7.2 7.2 0 0 1-10.8-3.8H1.2v3.1A12 12 0 0 0 12 24Z"
      />
      <path fill="#FBBC05" d="M5.3 14.3a7.2 7.2 0 0 1 0-4.6V6.6H1.2a12 12 0 0 0 0 10.8l4.1-3.1Z" />
      <path
        fill="#EA4335"
        d="M12 4.8c1.8 0 3.4.6 4.6 1.8L20 3.1A12 12 0 0 0 1.2 6.6l4.1 3.1A7.2 7.2 0 0 1 12 4.8Z"
      />
    </svg>
  );
}
