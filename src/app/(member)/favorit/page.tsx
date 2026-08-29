"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Heart, Trash2 } from "lucide-react";
import { ProductImage } from "@/components/product/ProductImage";
import { useToast } from "@/components/toast/ToastProvider";
import { cn, countryFlag } from "@/lib/utils";
import {
  FAVORITES_EVENT,
  getFavorites,
  removeFavorite,
  type FavoriteItem,
} from "@/lib/favorites";

/**
 * Halaman Favorit: produk yang di-heart pengguna (disimpan di perangkat
 * ini, tanpa perlu login). Menyegarkan otomatis saat favorit berubah.
 */
export default function FavoritPage() {
  const toast = useToast();
  const [items, setItems] = useState<FavoriteItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setItems(getFavorites());
    setHydrated(true);
    const sync = () => setItems(getFavorites());
    window.addEventListener(FAVORITES_EVENT, sync);
    return () => window.removeEventListener(FAVORITES_EVENT, sync);
  }, []);

  function remove(slug: string, name: string) {
    removeFavorite(slug);
    toast.info(`"${name}" dihapus dari Favorit.`);
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-extrabold text-navy">Favorit Saya</h1>
        <p className="mt-1 text-sm text-muted">
          Produk yang Anda simpan di perangkat ini - hati di kartu produk untuk menambah/menghapus.
        </p>
      </div>

      {!hydrated ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-64 animate-pulse rounded-xl border border-line bg-white" />
          ))}
        </div>
      ) : items.length === 0 ? (
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((f) => (
            <div
              key={f.slug}
              className="group relative flex flex-col overflow-hidden rounded-xl border border-line bg-white transition hover:-translate-y-1 hover:shadow-xl"
            >
              <Link href={`/produk/${f.slug}`} className="block">
                <div className="relative h-44 overflow-hidden bg-surface">
                  <ProductImage
                    src={f.image}
                    alt={f.name}
                    categorySlug={f.categorySlug}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="p-4">
                  <h3 className="text-sm font-bold text-navy transition group-hover:text-brand">
                    {f.name}
                  </h3>
                  <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-muted">
                    <span>{countryFlag(f.country)}</span>
                    {f.city ? `${f.city}, ${f.country}` : f.country}
                  </p>
                  <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-muted/90">
                    {f.shortDescription}
                  </p>
                  <p className={cn("mt-3 text-[11px] text-muted/70")}>
                    ❤️ Disimpan {new Date(f.savedAt).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </Link>
              <button
                onClick={() => remove(f.slug, f.name)}
                title="Hapus dari favorit"
                aria-label={`Hapus ${f.name} dari favorit`}
                className="absolute right-2.5 top-2.5 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-line/70 bg-white/95 text-navy/70 shadow-sm backdrop-blur transition-all duration-200 hover:scale-110 hover:bg-brand-soft hover:text-brand"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
