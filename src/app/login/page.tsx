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
        {/* Ornamen latar */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-32 h-96 w-96 rounded-full bg-brand/20 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-white/5 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
            backgroundSize: "28px 28px",
          }}
        />

        <div className="relative flex items-center gap-3">
          <LogoMark className="h-10 w-10" />
          <p className="text-xl font-extrabold">
            Karya<span className="text-red-400">Diaspora</span>
          </p>
        </div>

        <div className="relative">
          <p className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-white/70">
            🏛 Didukung oleh PPI Dunia
          </p>
          <h2 className="mt-5 text-3xl font-extrabold leading-snug">
            Satu pintu menuju{" "}
            <span className="relative whitespace-nowrap text-red-400">
              karya
              <svg
                className="absolute -bottom-1.5 left-0 h-2 w-full text-red-400/40"
                viewBox="0 0 120 8"
                fill="none"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <path d="M2 6C30 2 60 2 118 5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              </svg>
            </span>{" "}
            diaspora Indonesia.
          </h2>
          <ul className="mt-8 space-y-3 text-sm text-white/80">
            {[
              "Ajukan produk Anda dan pantau statusnya secara transparan",
              "Produk ditinjau tim kurasi sebelum tayang di katalog publik",
              "Tanpa password baru - cukup akun Google Anda",
            ].map((t) => (
              <li
                key={t}
                className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 transition-colors hover:border-white/20 hover:bg-white/10"
              >
                <CheckCircle2 className="mt-0.5 h-4.5 w-4.5 shrink-0 text-emerald-400" aria-hidden="true" />
                {t}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-white/50">
          © {new Date().getFullYear()} KaryaDiaspora - Platform Konektivitas Bisnis Diaspora Indonesia
        </p>
      </div>

      {/* Panel form */}
      <div className="relative flex flex-1 items-center justify-center overflow-hidden px-4 py-12">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-20 top-1/4 h-64 w-64 rounded-full bg-brand/5 blur-3xl"
        />
        <div className="relative w-full max-w-md">
          <div className="relative overflow-hidden rounded-2xl border border-line bg-white p-8 shadow-[0_16px_40px_-16px_rgba(11,31,59,0.14)] sm:p-10">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand via-brand/60 to-transparent" />
            <div className="flex justify-center lg:hidden">
              <LogoMark className="h-12 w-12" />
            </div>
            <h1 className="mt-4 text-center text-2xl font-extrabold text-navy lg:mt-0">
              Masuk ke <span className="text-brand">KaryaDiaspora</span>
            </h1>
            <p className="mt-2 text-center text-sm leading-relaxed text-muted">
              Gunakan akun Google (Gmail) Anda - tanpa perlu membuat password baru.
            </p>

            <button
              onClick={signInWithGoogle}
              disabled={loading}
              className="group mt-6 flex w-full items-center justify-center gap-3 rounded-xl border border-line bg-white px-5 py-3.5 text-sm font-semibold text-navy shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-brand/40 hover:bg-surface hover:shadow-md active:translate-y-0 active:shadow-sm disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-sm"
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
