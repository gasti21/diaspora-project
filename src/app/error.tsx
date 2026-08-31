"use client";

import Link from "next/link";
import { RefreshCw, TriangleAlert } from "lucide-react";
import { LogoMark } from "@/components/branding/Logo";
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

  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-surface px-4">
      <div className="w-full max-w-md rounded-2xl border border-line bg-white p-10 text-center shadow-sm">
        <div className="flex justify-center">
          <LogoMark className="h-12 w-12" />
        </div>
        <span className="mx-auto mt-5 flex h-14 w-14 items-center justify-center rounded-full bg-amber-50">
          <TriangleAlert className="h-7 w-7 text-amber-500" aria-hidden="true" />
        </span>
        <h1 className="mt-4 text-xl font-extrabold text-navy">Ada Yang Salah</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Maaf, terjadi kesalahan tak terduga di sisi kami. Coba muat ulang
          halaman - kalau masih terjadi, hubungi kami lewat halaman kontak.
        </p>
        {error.digest && (
          <p className="mt-3 font-mono text-[11px] text-muted/60">
            Kode error: {error.digest}
          </p>
        )}
        <div className="mt-7 flex justify-center gap-3">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-lg bg-navy px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-navy-dark"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Muat Ulang
          </button>
          <Link
            href="/"
            className="rounded-lg border border-line px-5 py-2.5 text-sm font-semibold text-navy transition hover:bg-surface"
          >
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    </div>
  );
}
