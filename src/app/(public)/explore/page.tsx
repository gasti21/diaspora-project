import { Suspense } from "react";
import type { Metadata } from "next";
import { Search } from "lucide-react";
import { SearchBar } from "@/components/catalog/SearchBar";
import { FilterBar } from "@/components/catalog/FilterBar";
import { ProductCard } from "@/components/product/ProductCard";
import { Pagination } from "@/components/catalog/Pagination";
import { listPublicProducts, listCountries } from "@/lib/data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  description:
    "Temukan berbagai produk dan karya diaspora Indonesia dari seluruh dunia.",
};

interface SearchParams {
  q?: string;
  kategori?: string;
  lokasi?: string;
  status?: string;
  kebutuhan?: string;
  urutkan?: string;
  halaman?: string;
}

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.halaman ?? "1", 10) || 1);
  const hasQuery = Boolean(sp.q || sp.kategori || sp.lokasi || sp.status || sp.kebutuhan);

  const [{ data, total, totalPages }, countries] = await Promise.all([
    listPublicProducts({
      q: sp.q,
      category: sp.kategori,
      country: sp.lokasi,
      stage: sp.status,
      need: sp.kebutuhan,
      sort: sp.urutkan === "terlama" || sp.urutkan === "nama" ? sp.urutkan : undefined,
      page,
    }),
    listCountries(),
  ]);

  return (
    <>
      {/* Hero band - konsisten dengan /kontak dan /tentang */}
      <header className="relative overflow-hidden bg-surface">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full bg-brand/10 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-32 -left-16 h-64 w-64 rounded-full bg-navy/5 blur-2xl"
        />
        <div className="relative mx-auto max-w-7xl px-4 pb-12 pt-16 sm:px-6">
          <h1 className="max-w-2xl text-4xl font-extrabold leading-[1.15] tracking-tight sm:text-5xl">
            Explore{" "}
            <span className="relative whitespace-nowrap text-brand">
              Karya
              <svg
                className="absolute -bottom-1.5 left-0 h-2 w-full text-brand/30"
                viewBox="0 0 120 8"
                fill="none"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <path d="M2 6C30 2 60 2 118 5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              </svg>
            </span>{" "}
            Diaspora
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
            Temukan produk, aplikasi, dan karya kreatif diaspora Indonesia dari
            seluruh dunia - kurasi langsung dari tim kami.
          </p>
          <div className="mt-8 max-w-2xl">
            <SearchBar initial={sp.q ?? ""} />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="-mt-6 relative z-10">
          <Suspense fallback={<div className="h-11" />}>
            <FilterBar countries={countries} />
          </Suspense>
        </div>

        <div className="mt-8 flex flex-wrap items-baseline justify-between gap-2 border-b border-line pb-4">
          <p className="text-sm text-muted">
            Menampilkan <span className="font-semibold text-navy">{data.length}</span>{" "}
            dari <span className="font-semibold text-navy">{total}</span> produk
            {sp.q ? (
              <>
                {" "}
                untuk pencarian “<span className="font-semibold text-navy">{sp.q}</span>”
              </>
            ) : null}
          </p>
        </div>

        {data.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-dashed border-line bg-surface/60 py-16 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-soft">
              <Search className="h-7 w-7 text-brand" aria-hidden="true" />
            </div>
            <h2 className="mt-5 text-lg font-bold text-navy">
              {hasQuery ? "Produk tidak ditemukan" : "Belum ada produk"}
            </h2>
            <p className="mx-auto mt-1 max-w-sm text-sm leading-relaxed text-muted">
              {hasQuery
                ? "Coba ubah kata kunci atau reset filter pencarian Anda."
                : "Produk baru akan segera tampil di sini setelah melewati kurasi."}
            </p>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {data.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}

        <div className="mt-10 pb-4">
          <Pagination
            page={page}
            totalPages={totalPages}
            basePath="/explore"
            query={{
              q: sp.q,
              kategori: sp.kategori,
              lokasi: sp.lokasi,
              status: sp.status,
              kebutuhan: sp.kebutuhan,
              urutkan: sp.urutkan,
            }}
          />
        </div>
      </div>
    </>
  );
}
