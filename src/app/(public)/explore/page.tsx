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
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-extrabold">Explore Produk</h1>
      <p className="mt-2 text-muted">
        Temukan berbagai produk dan karya diaspora Indonesia dari seluruh dunia.
      </p>

      <div className="mt-6">
        <SearchBar initial={sp.q ?? ""} />
      </div>

      <div className="mt-4">
        <Suspense fallback={<div className="h-11" />}>
          <FilterBar countries={countries} />
        </Suspense>
      </div>

      <p className="mt-6 text-sm text-muted">
        Menampilkan <span className="font-semibold text-navy">{data.length}</span>{" "}
        dari <span className="font-semibold text-navy">{total}</span> produk
        {sp.q ? (
          <>
            {" "}
            untuk pencarian “<span className="font-semibold text-navy">{sp.q}</span>”
          </>
        ) : null}
      </p>

      {data.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-line bg-surface/60 py-16 text-center">
          <Search className="mx-auto h-9 w-9 text-muted" aria-hidden="true" />
          <h2 className="mt-4 text-lg font-bold">Produk tidak ditemukan</h2>
          <p className="mt-1 text-sm text-muted">
            Coba ubah kata kunci atau reset filter pencarian Anda.
          </p>
        </div>
      ) : (
        <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {data.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}

      <div className="mt-10">
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
  );
}
