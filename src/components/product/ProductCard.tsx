import Link from "next/link";
import type { Product } from "@/lib/types";
import { NeedTag } from "./Badges";
import { ProductImage } from "./ProductImage";
import { FavoriteButton } from "./FavoriteButton";
import { countryFlag, formatLocation } from "@/lib/utils";

/**
 * Kartu produk katalog. Design: editorial anti-slop — rounded-md konsisten,
 * no hover shadow, no translate-y, border halus, spacing 8px rhythm.
 */
export function ProductCard({
  product,
  favoriteIds,
  favoriteCounts,
}: {
  product: Product;
  favoriteIds?: Set<string>;
  favoriteCounts?: Record<string, number>;
}) {
  return (
    <div className="group relative flex w-full flex-col">
      <FavoriteButton
        product={product}
        initialFavorited={favoriteIds ? favoriteIds.has(product.id) : undefined}
        initialCount={favoriteCounts?.[product.id] ?? 0}
      />

      <Link
        href={`/produk/${product.slug}`}
        className="group flex flex-1 flex-col overflow-hidden rounded-md border border-slate-200 bg-white transition-colors hover:border-slate-300"
      >
        <div className="relative aspect-square overflow-hidden bg-slate-50">
          <ProductImage
            src={product.images[0]}
            alt={product.name}
            categorySlug={product.categorySlug}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        </div>
        <div className="flex flex-1 flex-col p-4">
          <h3 className="line-clamp-2 text-sm font-medium leading-snug text-slate-900 transition-colors group-hover:text-brand">
            {product.name}
          </h3>
          <p className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-500">
            <span>{countryFlag(product.country)}</span>
            {formatLocation(product)}
          </p>
          <p className="mt-0.5 truncate text-xs text-slate-400">
            {product.categoryName} · {product.stage}
          </p>

          {product.needs.length > 0 && (
            <div className="mt-auto flex flex-wrap gap-1 pt-3">
              {product.needs.slice(0, 2).map((n) => (
                <NeedTag key={n} need={n} className="px-1.5 py-0.5 text-[10px]" />
              ))}
            </div>
          )}
        </div>
      </Link>
    </div>
  );
}
