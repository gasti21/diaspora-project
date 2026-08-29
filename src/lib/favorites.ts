/**
 * Favorit produk - disimpan di localStorage browser (tanpa login pun bisa).
 * Sengaja tanpa tabel database: MVP ringan, data pribadi per perangkat.
 * Snapshot produk disimpan utuh (nama, gambar, lokasi) supaya halaman
 * Favorit bisa dirender langsung tanpa request tambahan.
 */

/** Event custom: favorit berubah - tombol hati & halaman Favorit menyegarkan diri. */
export const FAVORITES_EVENT = "kd:favorites";

const STORAGE_KEY = "karyadiaspora:favorit";

export interface FavoriteItem {
  slug: string;
  name: string;
  image?: string;
  country: string;
  city?: string | null;
  categoryName?: string;
  categorySlug?: string;
  shortDescription: string;
  stage: string;
  needs: string[];
  savedAt: number;
}

function read(): FavoriteItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as FavoriteItem[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function write(items: FavoriteItem[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event(FAVORITES_EVENT));
}

export function getFavorites(): FavoriteItem[] {
  return read().sort((a, b) => b.savedAt - a.savedAt);
}

export function isFavorite(slug: string): boolean {
  return read().some((f) => f.slug === slug);
}

/** Tambah/hapus favorit. Return true bila produk menjadi favorit. */
export function toggleFavorite(item: Omit<FavoriteItem, "savedAt">): boolean {
  const list = read();
  const exists = list.some((f) => f.slug === item.slug);
  if (exists) {
    write(list.filter((f) => f.slug !== item.slug));
    return false;
  }
  write([...list, { ...item, savedAt: Date.now() }]);
  return true;
}

export function removeFavorite(slug: string) {
  write(read().filter((f) => f.slug !== slug));
}

export function countFavorites(): number {
  return read().length;
}
