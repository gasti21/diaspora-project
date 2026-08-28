"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { LogoMark } from "@/components/branding/Logo";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") ?? "/submit";

  async function signInWithGoogle() {
    if (!isSupabaseConfigured) {
      setError(
        "Login Google belum aktif: kredensial Supabase belum diisi di .env.local. Lihat README bagian Setup - sementara ini Anda tetap bisa menjelajahi platform tanpa login."
      );
      return;
    }
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
        queryParams: { prompt: "select_account" },
      },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    }
    // Berhasil: browser diarahkan ke Google oleh Supabase.
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4">
      <div className="w-full max-w-md rounded-2xl border border-line bg-white p-8 text-center shadow-sm">
        <div className="flex justify-center">
          <LogoMark className="h-12 w-12" />
        </div>
        <h1 className="mt-4 text-2xl font-extrabold">
          Karya<span className="text-brand">Diaspora</span>
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Masuk untuk mengirimkan produk Anda. Tanpa perlu membuat password baru
          - cukup akun Google (Gmail) Anda.
        </p>

        <button
          onClick={signInWithGoogle}
          disabled={loading}
          className="mt-6 flex w-full items-center justify-center gap-3 rounded-xl border border-line bg-white px-5 py-3.5 text-sm font-semibold text-navy shadow-sm transition hover:bg-surface disabled:opacity-60"
        >
          {loading ? (
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-navy/30 border-t-navy" />
          ) : (
            <GoogleIcon />
          )}
          {loading ? "Mengalihkan ke Google..." : "Masuk dengan Google"}
        </button>

        {error && <p className="mt-4 text-sm text-brand">{error}</p>}

        <p className="mt-6 text-xs leading-relaxed text-muted">
          Dengan masuk, Anda menyetujui data yang dikirimkan akan ditinjau oleh
          admin sebelum ditayangkan.
        </p>
        <Link href="/" className="mt-4 inline-block text-sm font-medium text-navy/70 hover:text-brand">
          ← Kembali ke beranda
        </Link>
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
