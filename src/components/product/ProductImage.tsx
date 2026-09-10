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
  /** object-fit: "contain" untuk logo/ilustrasi, "cover" untuk foto. Default cover. */
  fit?: "cover" | "contain";
}

/** Ubah URL object public Supabase jadi endpoint render (resize + kualitas).
 * width+height+resize=contain: hasil selalu pas rasio bingkai 4:3 dengan
 * gambar utuh di dalamnya - render param width saja bisa menghasilkan
 * gambar ekstrem memanjang (mis. 640x5000) yang merusak layout. */
function toRenderUrl(src: string, width: number): string {
  const marker = "/storage/v1/object/public/";
  const idx = src.indexOf(marker);
  if (idx === -1) return src;
  const origin = src.slice(0, idx);
  const rest = src.slice(idx + marker.length); // product-images/user/file.jpg
  const height = Math.round((width * 3) / 4);
  return `${origin}/storage/v1/render/image/public/${rest}?width=${width}&height=${height}&resize=contain&quality=75`;
}

/**
 * Gambar produk: next/image + transform Supabase Render (WebP otomatis,
 * resize server-side) dengan fallback ke placeholder kategori.
 */
export function ProductImage({ src, alt, categorySlug, className, width = 640, priority, fit = "cover" }: Props) {
  const fallback = `/placeholders/${categoryBySlug(categorySlug)?.slug ?? "makanan-minuman"}.svg`;
  const objectFit = fit === "contain" ? "object-contain" : "object-cover";
  // Tahap kegagalan: 0 = coba render transform, 1 = tampilkan URL asli polos,
  // 2 = tampilkan placeholder kategori (URL asli juga rusak).
  const [stage, setStage] = useState(0);
  const usePlainImg = stage > 0 || !src;
  const resolved = stage === 2 || !src ? fallback : stage === 1 ? src : toRenderUrl(src, width);

  return usePlainImg ? (
    <img
      src={resolved}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      className={cn(objectFit, "bg-white", className)}
      onError={() => setStage((s) => Math.min(s + 1, 2))}
    />
  ) : (
    <Image
      src={resolved}
      alt={alt}
      width={width}
      height={Math.round((width * 3) / 4)}
      priority={priority}
      loading={priority ? undefined : "lazy"}
      className={cn(objectFit, fit === "contain" && "bg-white", className)}
      onError={() => setStage(1)}
    />
  );
}
