"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { useToast } from "@/components/toast/ToastProvider";
import { cn } from "@/lib/utils";
import { FAVORITES_EVENT } from "@/lib/constants";
import type { Product } from "@/lib/types";

/**
 * Tombol hati favorit produk (login-only, tersimpan di database - sinkron
 * antar perangkat). Pengunjung anonim diarahkan ke halaman masuk dengan
 * pesan yang ramah.
 * - variant "card" : bulat kecil menempel di pojok foto produk.
 * - variant "detail": tombol di samping "Hubungi Pemilik" di halaman detail.
 */
export function FavoriteButton({
  product,
  variant = "card",
  initialFavorited,
}: {
  product: Product;
  variant?: "card" | "detail";
  /**
   * Status awal dari server (set id favorit halaman). undefined = mode lama,
   * fetch per kartu (dipakai halaman yang belum mengoper set favorit).
   */
  initialFavorited?: boolean;
}) {
  const toast = useToast();
  const router = useRouter();
  const [fav, setFav] = useState(Boolean(initialFavorited));
  const [state, setState] = useState<"loading" | "ready" | "anon">(
    initialFavorited === undefined ? "loading" : "ready"
  );

  // Muat status awal dari API (hanya bila server tidak menyediakannya).
  useEffect(() => {
    if (initialFavorited !== undefined) return;
    let alive = true;
    fetch(`/api/favorites/${product.id}`)
      .then(async (res) => {
        if (!alive) return;
        if (res.status === 401) {
          setState("anon");
          return;
        }
        const json = await res.json();
        setFav(Boolean(json.favorited));
        setState("ready");
      })
      .catch(() => alive && setState("anon"));
    return () => {
      alive = false;
    };
  }, [product.id, initialFavorited]);

  // Sinkron bila tombol lain untuk produk yang sama berubah.
  useEffect(() => {
    const sync = () => {
      fetch(`/api/favorites/${product.id}`)
        .then(async (res) => {
          if (res.ok) setFav(Boolean((await res.json()).favorited));
        })
        .catch(() => {});
    };
    window.addEventListener(FAVORITES_EVENT, sync);
    return () => window.removeEventListener(FAVORITES_EVENT, sync);
  }, [product.id]);

  async function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (state === "anon") {
      toast.info("Masuk untuk menyimpan favoritmu - datanya ikut ke semua perangkat.", {
        title: "Masuk dulu ya",
      });
      router.push("/login");
      return;
    }

    // Optimistic update - request jalan di belakang.
    const next = !fav;
    setFav(next);
    try {
      const res = await fetch(`/api/favorites/${product.id}`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) {
        setFav(!next); // rollback
        toast.error(json.error ?? "Gagal memperbarui favorit.");
        return;
      }
      setFav(Boolean(json.favorited));
      toast.success(
        json.favorited
          ? `"${product.name}" ditambahkan ke Favorit Anda.`
          : `"${product.name}" dihapus dari Favorit.`,
        { title: json.favorited ? "Difavoritkan ❤️" : "Favorit diperbarui" }
      );
      window.dispatchEvent(new Event(FAVORITES_EVENT));
    } catch {
      setFav(!next);
      toast.error("Gagal memperbarui favorit. Coba lagi.");
    }
  }

  if (variant === "detail") {
    return (
      <button
        onClick={toggle}
        aria-pressed={state === "ready" ? fav : undefined}
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
      aria-pressed={state === "ready" ? fav : undefined}
      aria-label={fav ? "Hapus dari favorit" : "Tambah ke favorit"}
      title={fav ? "Hapus dari favorit" : "Tambah ke favorit"}
      className={cn(
        "absolute right-2.5 top-2.5 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-line/70 bg-white/95 shadow-sm backdrop-blur transition-all duration-200 hover:scale-110",
        fav ? "text-brand" : "text-navy/70"
      )}
    >
      <Heart className={cn("h-4 w-4", state === "ready" && fav && "fill-brand text-brand")} aria-hidden="true" />
    </button>
  );
}
