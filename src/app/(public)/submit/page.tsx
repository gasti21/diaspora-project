import Link from "next/link";
import type { Metadata } from "next";
import { getSessionUser } from "@/lib/auth";
import { listCategories } from "@/lib/data";
import { SubmitForm } from "@/components/forms/SubmitForm";
import { LogoMark } from "@/components/branding/Logo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Submit Produk",
  description:
    "Kirimkan produk atau karya Anda untuk ditayangkan di KaryaDiaspora.",
};

export default async function SubmitPage() {
  const user = await getSessionUser();

  // PRD: submit hanya setelah otentikasi Gmail - pengunjung tanpa login
  // dihadapkan pada ajakan masuk via Google, bukan form.
  if (!user) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-20 text-center">
        <LogoMark className="h-12 w-12" />
        <h1 className="mt-5 text-2xl font-extrabold">Masuk untuk Submit Produk</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Untuk menjaga kualitas katalog, pengajuan produk dilakukan melalui
          akun Google Anda - tanpa perlu membuat password baru.
        </p>
        <Link
          href="/login?next=%2Fsubmit"
          className="mt-6 flex items-center justify-center gap-3 rounded-xl border border-line bg-white px-6 py-3.5 text-sm font-semibold text-navy shadow-sm transition hover:bg-surface"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
            <path fill="#4285F4" d="M23.5 12.3c0-.9-.1-1.5-.3-2.3H12v4.5h6.5a5.6 5.6 0 0 1-2.4 3.6v3h3.9c2.3-2.1 3.5-5.2 3.5-8.8Z" />
            <path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-2.9l-3.9-3a7.2 7.2 0 0 1-10.8-3.8H1.2v3.1A12 12 0 0 0 12 24Z" />
            <path fill="#FBBC05" d="M5.3 14.3a7.2 7.2 0 0 1 0-4.6V6.6H1.2a12 12 0 0 0 0 10.8l4.1-3.1Z" />
            <path fill="#EA4335" d="M12 4.8c1.8 0 3.4.6 4.6 1.8L20 3.1A12 12 0 0 0 1.2 6.6l4.1 3.1A7.2 7.2 0 0 1 12 4.8Z" />
          </svg>
          Masuk dengan Google
        </Link>
        <p className="mt-6 max-w-sm text-xs leading-relaxed text-muted">
          Setelah submit, produk Anda akan ditinjau oleh admin. Kami akan
          menghubungi Anda melalui email atau WhatsApp.
        </p>
      </div>
    );
  }

  const categories = await listCategories();

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-extrabold">Submit Produk</h1>
      <p className="mt-2 text-muted">
        Lengkapi informasi produk Anda. Tim kami akan meninjau sebelum
        ditampilkan.
      </p>
      <SubmitForm categories={categories} user={{ name: user.name, email: user.email }} />
    </div>
  );
}
