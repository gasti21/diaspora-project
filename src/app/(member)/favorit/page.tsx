import Link from "next/link";
import { Heart, PackagePlus } from "lucide-react";
import { getSessionUser } from "@/lib/auth";
import { listMyFavoriteProducts } from "@/lib/data";
import { ProductCard } from "@/components/product/ProductCard";

export const dynamic = "force-dynamic";

/**
 * Halaman Favorit: produk yang di-heart user - kini tersimpan di database
 * (login-only) sehingga sinkron di semua perangkat.
 */
export default async function FavoritPage() {
  const user = await getSessionUser();
  if (!user) return null; // guard sesi ada di layout (member)

  const products = await listMyFavoriteProducts(user.id);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-extrabold text-navy">Favorit Saya</h1>
        <p className="mt-1 text-sm text-muted">
          Produk yang Anda simpan - tersimpan di akun Anda, ikut ke semua perangkat.
        </p>
      </div>

      {products.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-white px-6 py-14 text-center">
          <Heart className="mx-auto h-9 w-9 text-muted" aria-hidden="true" />
          <h2 className="mt-4 text-lg font-bold">Belum ada favorit</h2>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted">
            Jelajahi katalog dan tekan ikon hati pada produk yang Anda minati
            untuk menyimpannya di sini.
          </p>
          <Link
            href="/explore"
            className="mt-6 inline-block rounded-lg bg-navy px-5 py-3 text-sm font-semibold text-white transition hover:bg-navy-dark"
          >
            Jelajahi Produk
          </Link>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}

      {products.length > 0 && (
        <Link
          href="/explore"
          className="inline-flex items-center gap-2 text-sm font-semibold text-navy transition hover:text-brand"
        >
          <PackagePlus className="h-4 w-4" aria-hidden="true" />
          Tambah favorit lain dari katalog
        </Link>
      )}
    </div>
  );
}
