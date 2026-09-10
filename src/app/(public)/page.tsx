import Link from "next/link";
import { SearchBar } from "@/components/catalog/SearchBar";
import { ProductCard } from "@/components/product/ProductCard";
import { CATEGORIES } from "@/lib/constants";
import {
  getLatestProducts,
  listMyFavoriteProducts,
  listMyFavoriteProductIds,
  getFavoriteCounts,
} from "@/lib/data";
import { getSessionUser } from "@/lib/auth";
import type { Product } from "@/lib/types";
import { ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";

/** Section "Favorit Kamu" - hanya dirender untuk member yang login dan punya favorit. */
function FavoriteSection({
  favorites,
  favoriteIds,
  favoriteCounts,
  firstName,
}: {
  favorites: Product[];
  favoriteIds: Set<string>;
  favoriteCounts: Record<string, number>;
  firstName: string;
}) {
  return (
    <section className="mx-auto max-w-7xl px-4 pt-14 sm:px-6">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">
            Halo, {firstName} — Favorit Kamu
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {favorites.length} produk tersimpan di daftar favoritmu
          </p>
        </div>
        <Link
          href="/favorit"
          className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-brand transition-colors hover:text-brand-dark"
        >
          Kelola favorit
        </Link>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {favorites.slice(0, 4).map((p) => (
          <ProductCard key={p.id} product={p} favoriteIds={favoriteIds} favoriteCounts={favoriteCounts} />
        ))}
      </div>
    </section>
  );
}

const STEPS = [
  {
    title: "Submit Produk",
    desc: "Kirim informasi produk Anda dengan mudah — cukup login Google.",
  },
  {
    title: "Admin Review",
    desc: "Tim kurasi memverifikasi kelengkapan dan kualitas pengajuan.",
  },
  {
    title: "Produk Tampil",
    desc: "Karya Anda dipublikasikan di katalog diaspora internasional.",
  },
  {
    title: "Terhubung",
    desc: "Pengunjung yang tertarik menghubungi Anda langsung.",
  },
];

export default async function HomePage() {
  const latest = await getLatestProducts(6);

  const user = await getSessionUser();
  const favoriteIds = user ? await listMyFavoriteProductIds(user.id) : new Set<string>();
  const favoriteCounts = await getFavoriteCounts(latest.map((p) => p.id));
  let favorites: Product[] = [];
  if (user) {
    try {
      favorites = (await listMyFavoriteProducts(user.id)).slice(0, 4);
    } catch (error) {
      console.error("Gagal memuat favorit di homepage:", error);
    }
  }
  const firstName = user?.name?.trim().split(/\s+/)[0] ?? "";

  return (
    <>
      {/* ===== Hero — editorial, tanpa blur orbs / gradient slop ===== */}
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1fr_1.1fr] lg:py-24">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-slate-600">
              <span className="h-1.5 w-1.5 rounded-full bg-brand" aria-hidden="true" />
              Platform Konektivitas Diaspora
            </p>
            <h1 className="mt-5 text-4xl font-extrabold leading-[1.1] tracking-tight text-slate-900 sm:text-5xl">
              Temukan karya{" "}
              <span className="text-brand">diaspora Indonesia</span> di seluruh dunia
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-500">
              Jelajahi produk, bisnis, aplikasi, riset, dan karya kreatif buatan
              diaspora Indonesia. Terhubung dengan pemiliknya untuk berkolaborasi,
              membeli, atau mendukung.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a
                href="#produk-terbaru"
                className="inline-flex h-11 items-center gap-2 rounded-md bg-brand px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-dark"
              >
                Jelajahi Produk
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </a>
              <a
                href="#cara-kerja"
                className="inline-flex h-11 items-center rounded-md border border-slate-200 px-5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
              >
                Cara Kerja
              </a>
            </div>
            <div className="mt-8 max-w-lg">
              <SearchBar />
            </div>
          </div>

          {/* Kolase kategori — grid rapi tanpa shadow/translate acak */}
          <div className="hidden grid-cols-3 gap-3 lg:grid">
            {CATEGORIES.slice(0, 6).map((c, i) => (
              <div
                key={c.slug}
                className={`flex aspect-square flex-col items-center justify-center gap-2 rounded-md border border-slate-200 bg-slate-50 p-4 ${
                  i % 3 === 1 ? "translate-y-4" : ""
                }`}
              >
                <c.icon className={`h-7 w-7 ${c.color}`} aria-hidden="true" />
                <span className="text-center text-[11px] font-medium leading-tight text-slate-600">
                  {c.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Kategori Populer ===== */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-brand">
              Kategori
            </p>
            <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900">
              Jelajahi Berdasarkan Kategori
            </h2>
          </div>
          <Link
            href="/explore"
            className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-brand transition-colors hover:text-brand-dark"
          >
            Lihat semua kategori
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {CATEGORIES.map((c) => {
            const bgSoft = c.color.replace("text-", "bg-").replace("500", "50");
            return (
              <Link
                key={c.slug}
                href={`/explore?kategori=${c.slug}`}
                className="group flex flex-col items-center gap-3 rounded-md border border-slate-200 bg-white p-5 text-center transition-colors hover:border-slate-300 hover:bg-slate-50"
              >
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-md ${bgSoft} transition-transform group-hover:scale-105`}
                >
                  <c.icon className={`h-6 w-6 ${c.color}`} aria-hidden="true" />
                </div>
                <span className="text-sm font-semibold leading-snug text-slate-800">
                  {c.name}
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ===== Favorit Kamu (hanya member yang login & punya favorit) ===== */}
      {user && favorites.length > 0 && (
        <FavoriteSection
          favorites={favorites}
          favoriteIds={favoriteIds}
          favoriteCounts={favoriteCounts}
          firstName={firstName}
        />
      )}

      {/* ===== Produk Terbaru ===== */}
      <section id="produk-terbaru" className="bg-slate-50/60 py-16 scroll-mt-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-brand">
                Terbaru
              </p>
              <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900">
                Produk Terbaru
              </h2>
            </div>
            <Link
              href="/explore"
              className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-brand transition-colors hover:text-brand-dark"
            >
              Lihat semua produk
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {latest.map((p) => (
              <ProductCard key={p.id} product={p} favoriteIds={favoriteIds} favoriteCounts={favoriteCounts} />
            ))}
          </div>
        </div>
      </section>

      {/* ===== Cara Kerja ===== */}
      <section id="cara-kerja" className="border-t border-slate-200 bg-white py-20 scroll-mt-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-widest text-brand">
              Alur Platform
            </p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Cara Kerja
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-500 sm:text-base">
              Dari pengajuan hingga terhubung dengan publik — 4 langkah sederhana
              publikasi karya diaspora.
            </p>
          </div>

          <div className="mt-14 grid gap-y-10 sm:grid-cols-2 sm:gap-x-12 lg:grid-cols-4 lg:gap-x-0 lg:divide-x lg:divide-slate-200">
            {STEPS.map((s, idx) => (
              <div key={s.title} className="group lg:px-8 lg:first:pl-0 lg:last:pr-0">
                <span className="text-sm font-semibold tabular-nums text-slate-400 transition-colors group-hover:text-brand">
                  {String(idx + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-3 text-base font-bold text-slate-900">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}