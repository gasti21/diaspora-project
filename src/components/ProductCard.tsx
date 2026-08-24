import Link from "next/link";
import type { Product } from "@/lib/types";
import { CategoryBadge, StageBadge, NeedTag } from "./Badges";
import { ProductImage } from "./ProductImage";
import { countryFlag, formatLocation } from "@/lib/utils";

export function ProductCard({ product }: { product: Product }) {
  return (
    <Link
      href={`/produk/${product.slug}`}
      className="group block overflow-hidden rounded-xl border border-line bg-white transition hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div className="relative h-44 overflow-hidden">
        <ProductImage
          src={product.images[0]}
          alt={product.name}
          categorySlug={product.categorySlug}
          className="h-full w-full transition duration-300 group-hover:scale-105"
        />
      </div>
      <div className="p-4">
        <div className="flex flex-wrap items-center gap-2">
          <CategoryBadge name={product.categoryName} slug={product.categorySlug} />
          <StageBadge stage={product.stage} />
        </div>
        <h3 className="mt-3 line-clamp-1 font-bold text-navy group-hover:text-brand">
          {product.name}
        </h3>
        <p className="mt-1 flex items-center gap-1.5 text-xs text-muted">
          <span>{countryFlag(product.country)}</span>
          {formatLocation(product)}
        </p>
        <p className="mt-2 line-clamp-2 text-sm text-muted">{product.shortDescription}</p>
        {product.needs.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {product.needs.slice(0, 3).map((n) => (
              <NeedTag key={n} need={n} />
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
