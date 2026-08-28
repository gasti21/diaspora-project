import Link from "next/link";
import type { Product } from "@/lib/types";
import { CategoryBadge, StageBadge, NeedTag } from "./Badges";
import { ProductImage } from "./ProductImage";
import { countryFlag, formatLocation } from "@/lib/utils";

export function ProductCard({ product }: { product: Product }) {
  return (
    <Link
      href={`/produk/${product.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-line bg-white transition duration-200 hover:-translate-y-1 hover:border-navy/20 hover:shadow-xl"
    >
      <div className="relative h-48 overflow-hidden bg-surface">
        <ProductImage
          src={product.images[0]}
          alt={product.name}
          categorySlug={product.categorySlug}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 transition duration-300 group-hover:opacity-100" />
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CategoryBadge name={product.categoryName} slug={product.categorySlug} />
          <StageBadge stage={product.stage} />
        </div>
        <h3 className="mt-3.5 text-base font-bold text-navy transition group-hover:text-brand">
          {product.name}
        </h3>
        <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-muted">
          <span className="text-sm">{countryFlag(product.country)}</span>
          {formatLocation(product)}
        </p>
        <p className="mt-2.5 line-clamp-2 text-sm leading-relaxed text-muted/90">{product.shortDescription}</p>
        
        {product.needs.length > 0 && (
          <div className="mt-auto pt-4 flex flex-wrap gap-1.5 border-t border-line/60">
            {product.needs.slice(0, 3).map((n) => (
              <NeedTag key={n} need={n} />
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
