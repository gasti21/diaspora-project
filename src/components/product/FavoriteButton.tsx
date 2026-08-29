"use client";

import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { useToast } from "@/components/toast/ToastProvider";
import { cn } from "@/lib/utils";
import { FAVORITES_EVENT, isFavorite, toggleFavorite } from "@/lib/favorites";
import type { Product } from "@/lib/types";

/**
 * Tombol hati favorit produk (disimpan di localStorage per perangkat).
 * - variant "card" : bulat kecil menempel di pojok foto produk.
 * - variant "detail": tombol di samping "Hubungi Pemilik" di halaman detail.
 */
export function FavoriteButton({
  product,
  variant = "card",
}: {
  product: Product;
  variant?: "card" | "detail";
}) {
  const toast = useToast();
  const [fav, setFav] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // sinkron state awal + dengarkan perubahan dari tombol/kartu lain
  useEffect(() => {
    setFav(isFavorite(product.slug));
    setHydrated(true);
    const sync = () => setFav(isFavorite(product.slug));
    window.addEventListener(FAVORITES_EVENT, sync);
    return () => window.removeEventListener(FAVORITES_EVENT, sync);
  }, [product.slug]);

  function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const now = toggleFavorite({
      slug: product.slug,
      name: product.name,
      image: product.images[0],
      country: product.country,
      city: product.city,
      categoryName: product.categoryName,
      categorySlug: product.categorySlug,
      shortDescription: product.shortDescription,
      stage: product.stage,
      needs: product.needs,
    });
    setFav(now);
    toast.success(
      now
        ? `"${product.name}" ditambahkan ke Favorit Anda.`
        : `"${product.name}" dihapus dari Favorit.`,
      { title: now ? "Difavoritkan ❤️" : "Favorit diperbarui" }
    );
  }

  if (variant === "detail") {
    return (
      <button
        onClick={toggle}
        aria-pressed={hydrated ? fav : undefined}
        aria-label={fav ? "Hapus dari favorit" : "Tambah ke favorit"}
        className={cn(
          "flex h-[52px] items-center justify-center gap-2 rounded-xl border px-5 text-sm font-semibold transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0",
          fav
            ? "border-brand bg-brand-soft text-brand"
            : "border-line bg-white text-navy hover:border-navy/40"
        )}
      >
        <Heart className={cn("h-5 w-5", fav && "fill-brand text-brand")} aria-hidden="true" />
        {fav ? "Favorit" : "Favoritkan"}
      </button>
    );
  }

  return (
    <button
      onClick={toggle}
      aria-pressed={hydrated ? fav : undefined}
      aria-label={fav ? "Hapus dari favorit" : "Tambah ke favorit"}
      title={fav ? "Hapus dari favorit" : "Tambah ke favorit"}
      className={cn(
        "absolute right-2.5 top-2.5 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-line/70 bg-white/95 shadow-sm backdrop-blur transition-all duration-200 hover:scale-110",
        fav ? "text-brand" : "text-navy/70"
      )}
    >
      <Heart className={cn("h-4 w-4", hydrated && fav && "fill-brand text-brand")} aria-hidden="true" />
    </button>
  );
}
