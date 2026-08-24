"use client";

/* eslint-disable @next/next/no-img-element */

import { categoryBySlug } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface Props {
  src?: string | null;
  alt: string;
  categorySlug?: string | null;
  className?: string;
}

/** Gambar produk dengan fallback ke placeholder kategori bila kosong/gagal. */
export function ProductImage({ src, alt, categorySlug, className }: Props) {
  const fallback = `/placeholders/${categoryBySlug(categorySlug)?.slug ?? "makanan-minuman"}.svg`;

  return (
    <img
      src={src || fallback}
      alt={alt}
      loading="lazy"
      className={cn("object-cover", className)}
      onError={(e) => {
        const img = e.currentTarget;
        if (img.src !== fallback && !img.src.endsWith(fallback)) img.src = fallback;
      }}
    />
  );
}
