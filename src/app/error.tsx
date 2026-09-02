"use client";

import Link from "next/link";
import { RefreshCw } from "lucide-react";
import { useEffect } from "react";

/**
 * Error boundary global: menangkap error render yang tidak tertangani
 * (mis. database tidak merespons) dan menampilkannya dengan branding,
 * bukan layar crash default Next.js.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Kaitkan ke layar monitoring (Sentry) nanti - untuk sekarang log ke console.
    console.error("Unhandled app error:", error);
  }, [error]);

  const isDev = process.env.NODE_ENV === "development";

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-white px-4">
      <div className="w-full max-w-lg animate-fade-in text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-brand">
          Error
        </p>

        <h1 className="mt-4 text-2xl font-bold tracking-tight text-navy sm:text-3xl">
          Ada yang salah di sisi kami
        </h1>
        <p className="mx-auto mt-3 max-w-sm text-[15px] leading-relaxed text-muted">
          Terjadi kesalahan tak terduga saat memuat halaman ini. Coba muat
          ulang - kalau masih terjadi, coba lagi beberapa saat.
        </p>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-dark focus-visible:outline-brand"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Muat Ulang
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-lg border border-line px-6 py-3 text-sm font-semibold text-navy transition hover:border-navy/30 hover:bg-surface"
          >
            Kembali ke Beranda
          </Link>
        </div>

        {isDev && error.message ? (
          <p className="mx-auto mt-10 max-w-md break-words rounded-lg bg-surface px-4 py-3 text-left font-mono text-xs leading-relaxed text-muted">
            {error.message}
          </p>
        ) : null}

        {error.digest && (
          <p className="mt-6 font-mono text-[11px] tracking-wide text-muted/50">
            Kode: {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}
