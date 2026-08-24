import Link from "next/link";
import { LogoMark } from "@/components/Logo";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface px-4 text-center">
      <LogoMark className="h-14 w-14" />
      <p className="mt-6 text-5xl font-extrabold text-navy">404</p>
      <h1 className="mt-2 text-xl font-bold">Halaman tidak ditemukan</h1>
      <p className="mt-2 max-w-sm text-sm text-muted">
        Produk yang Anda cari mungkin sudah tidak tayang atau tautannya salah.
      </p>
      <div className="mt-7 flex gap-3">
        <Link href="/" className="rounded-lg bg-navy px-5 py-3 text-sm font-semibold text-white hover:bg-navy-dark">
          Ke Beranda
        </Link>
        <Link href="/explore" className="rounded-lg border border-line bg-white px-5 py-3 text-sm font-semibold text-navy hover:bg-white/60">
          Explore Produk
        </Link>
      </div>
    </div>
  );
}
