"use client";

import { useState } from "react";
import Image from "next/image";
import { categoryBySlug } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface Props {
  src?: string | null;
  alt: string;
  categorySlug?: string | null;
  className?: string;
  /** Lebar render (px) - kartu 640, hero 1280. Default 640. */
  width?: 640 | 1280;
  /** true = priority/LCP (satu gambar teratas saja). */
  priority?: boolean;
}

/** Ubah URL object public Supabase jadi endpoint render (resize + kualitas). */
function toRenderUrl(src: string, width: number): string {
  const marker = "/storage/v1/object/public/";
  const idx = src.indexOf(marker);
  if (idx === -1) return src;
  const origin = src.slice(0, idx);
  const rest = src.slice(idx + marker.length); // product-images/user/file.jpg
  return `${origin}/storage/v1/render/image/public/${rest}?width=${width}&quality=75`;
}

/**
 * Gambar produk: next/image + transform Supabase Render (WebP otomatis,
 * resize server-side) dengan fallback ke placeholder kategori.
 */
export function ProductImage({ src, alt, categorySlug, className, width = 640, priority }: Props) {
  const fallback = `/placeholders/${categoryBySlug(categorySlug)?.slug ?? "makanan-minuman"}.svg`;
  const [failed, setFailed] = useState(false);
  // Setelah URL render gagal, tampilkan placeholder SVG - lewat <img> biasa
  // karena optimizer next/image memblokir SVG (400) tanpa dangerouslyAllowSVG.
  const usePlainImg = failed || !src;
  const resolved = usePlainImg ? fallback : toRenderUrl(src, width);

  return usePlainImg ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={resolved} alt={alt} loading={priority ? "eager" : "lazy"} className={cn("object-cover", className)} />
  ) : (
    <Image
      src={resolved}
      alt={alt}
      width={width}
      height={Math.round((width * 3) / 4)}
      priority={priority}
      loading={priority ? undefined : "lazy"}
      className={cn("object-cover", className)}
      onError={() => setFailed(true)}
    />
  );
}
