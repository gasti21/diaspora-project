import Link from "next/link";
import type { Product } from "@/lib/types";
import { NeedTag } from "./Badges";
import { ProductImage } from "./ProductImage";
import { FavoriteButton } from "./FavoriteButton";
import { countryFlag, formatLocation } from "@/lib/utils";

/**
 * Kartu produk katalog. Tombol favorit (hati) diposisikan di luar <Link>
 * supaya struktur HTML tetap valid (tidak ada button di dalam anchor).
 *
 * favoriteIds (opsional): set id favorit dari server - bila diberikan,
 * kartu tidak lagi fetch status per kartu (membasmi N+1 di katalog).
 */
export function ProductCard({
  product,
  favoriteIds,
}: {
  product: Product;
  /** Set id produk favorit milik user login (server-provided). */
  favoriteIds?: Set<string>;
}) {
  return (
    <div className="group relative flex w-full flex-col">
      <FavoriteButton
        product={product}
        initialFavorited={favoriteIds ? favoriteIds.has(product.id) : undefined}
      />

      <Link
        href={`/produk/${product.slug}`}
        className="group flex flex-1 flex-col rounded-2xl bg-white p-2 transition duration-200 hover:-translate-y-1 hover:shadow-lg hover:shadow-navy/5"
      >
        <div className="relative overflow-hidden rounded-xl bg-surface">
          <ProductImage
            src={product.images[0]}
            alt={product.name}
            categorySlug={product.categorySlug}
            className="aspect-square h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        </div>
        <div className="flex flex-1 flex-col px-2 pb-2 pt-3">
          <h3 className="line-clamp-2 text-sm font-medium leading-snug text-[#0d0d0d] transition group-hover:text-brand">
            {product.name}
          </h3>
          <p className="mt-1.5 flex items-center gap-1 text-xs text-[#7d7d7d]">
            <span>{countryFlag(product.country)}</span>
            {formatLocation(product)}
          </p>
          {/* ala Tokopedia: info sekunder cuma teks abu kecil, tanpa badge */}
          <p className="mt-0.5 truncate text-xs text-[#7d7d7d]">
            {product.categoryName} · {product.stage}
          </p>

          {product.needs.length > 0 && (
            <div className="mt-auto flex flex-wrap gap-1 pt-3">
              {product.needs.slice(0, 2).map((n) => (
                <NeedTag key={n} need={n} className="px-2 py-0.5 text-[11px]" />
              ))}
            </div>
          )}
        </div>
      </Link>
    </div>
  );
}
