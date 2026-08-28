import Link from "next/link";
import type { Metadata } from "next";
import { ArrowUpRight, ClipboardList, PackagePlus } from "lucide-react";
import { getSessionUser } from "@/lib/auth";
import { listMySubmissions } from "@/lib/data";
import { LogoMark } from "@/components/branding/Logo";
import { StatusBadge } from "@/components/product/Badges";
import { ProductImage } from "@/components/product/ProductImage";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  description:
    "Pantau status pengajuan produk Anda di KaryaDiaspora - pending, published, revisi, atau rejected.",
};

export default async function PengajuanPage() {
  const user = await getSessionUser();

  // Sama seperti submit: pengunjung tanpa login dihadapkan pada ajakan masuk.
  if (!user) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-20 text-center">
        <LogoMark className="h-12 w-12" />
        <h1 className="mt-5 text-2xl font-extrabold">Pengajuan Saya</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Masuk dengan akun Google Anda untuk melihat status pengajuan produk
          yang sudah Anda kirim.
        </p>
        <Link
          href="/login?next=%2Fpengajuan"
          className="mt-6 flex items-center justify-center gap-3 rounded-xl border border-line bg-white px-6 py-3.5 text-sm font-semibold text-navy shadow-sm transition hover:bg-surface"
        >
          <ClipboardList className="h-5 w-5" aria-hidden="true" />
          Masuk untuk melihat pengajuan
        </Link>
      </div>
    );
  }

  const submissions = await listMySubmissions(user.id);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-extrabold">Pengajuan Saya</h1>
      <p className="mt-2 text-muted">
        Status semua produk yang Anda ajukan - diperbarui setelah tim kami
        mereview.
      </p>

      {submissions.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-line bg-white px-6 py-16 text-center">
          <ClipboardList className="mx-auto h-10 w-10 text-muted/50" aria-hidden="true" />
          <p className="mt-4 font-semibold">Belum ada pengajuan</p>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted">
            Produk pertama Anda menanti - bagikan karya Anda ke seluruh
            diaspora.
          </p>
          <Link
            href="/submit"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark"
          >
            <PackagePlus className="h-4 w-4" aria-hidden="true" />
            Submit Produk
          </Link>
        </div>
      ) : (
        <ul className="mt-8 space-y-4">
          {submissions.map((p) => (
            <li
              key={p.id}
              className="flex gap-4 rounded-2xl border border-line bg-white p-4 shadow-sm transition hover:shadow-md"
            >
              <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl sm:h-24 sm:w-24">
                <ProductImage
                  src={p.images?.[0] ?? null}
                  alt={p.name}
                  categorySlug={p.categorySlug}
                  className="h-full w-full"
                />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={p.status} />
                  {p.categoryName && (
                    <span className="text-xs font-medium text-muted">
                      {p.categoryName}
                    </span>
                  )}
                </div>
                <h2 className="mt-1.5 truncate font-bold">{p.name}</h2>
                <p className="mt-0.5 text-xs text-muted">
                  Diajukan {formatDate(p.createdAt)}
                  {[p.city, p.country].filter(Boolean).length > 0 &&
                    ` · ${[p.city, p.country].filter(Boolean).join(", ")}`}
                </p>

                {p.reviewNote && (
                  <p className="mt-2.5 rounded-lg bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-800">
                    <span className="font-bold">Catatan reviewer: </span>
                    {p.reviewNote}
                  </p>
                )}

                {p.status === "published" && (
                  <Link
                    href={`/produk/${p.slug}`}
                    className="mt-2.5 inline-flex items-center gap-1 text-xs font-semibold text-navy transition hover:text-brand"
                  >
                    Lihat halaman publik
                    <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </Link>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
