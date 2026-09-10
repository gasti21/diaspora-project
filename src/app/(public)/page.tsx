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
import { ArrowRight, Globe2, Sparkles, ShieldCheck, TrendingUp } from "lucide-react";

export const dynamic = "force-dynamic";

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
    <section className="mx-auto max-w-7xl px-4 pt-12 sm:px-6">
      <div className="mb-6 flex items-end justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">
            Favorit Tersimpan — <span className="text-brand">{firstName}</span>
          </h2>
          <p className="mt-1 text-xs text-slate-500 sm:text-sm">
            {favorites.length} produk siap diakses kembali dari mana saja
          </p>
        </div>
        <Link
          href="/favorit"
          className="inline-flex shrink-0 items-center gap-1.5 text-xs font-semibold text-brand transition-colors hover:text-brand-dark sm:text-sm"
        >
          Lihat Semua
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
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
    num: "01",
    title: "Submit Karya & Bisnis",
    desc: "Isi informasi produk, foto, tahap pengembangan, serta kontak pemilik cukup dengan login Google.",
  },
  {
    num: "02",
    title: "Kurasi & Verifikasi",
    desc: "Tim kurator memeriksa keabsahan data dan kesesuaian kategori sebelum ditayangkan.",
  },
  {
    num: "03",
    title: "Tayang di Katalog Global",
    desc: "Produk Anda masuk katalog publik yang dapat diakses oleh jejaring diaspora seluruh dunia.",
  },
  {
    num: "04",
    title: "Koneksi & Kolaborasi",
    desc: "Pengunjung, investor, atau calon pembeli menghubungi Anda secara langsung via WhatsApp & Email.",
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

  // Ambil 1 produk unggulan untuk Hero Showcase jika ada
  const heroFeatured = latest[0] ?? null;

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-slate-900">
      {/* ===== HERO SECTION ===== */}
      <section className="relative border-b border-slate-200 bg-white py-14 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
            
            {/* Teks Hero Sisi Kiri */}
            <div className="lg:col-span-7">
              <div className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-slate-700">
                <Globe2 className="h-3.5 w-3.5 text-brand" aria-hidden="true" />
                Jejaring Bisnis &amp; Inovasi Diaspora
              </div>

              <h1 className="mt-6 text-3xl font-extrabold leading-[1.12] tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
                Direktori Resmi Produk &amp; Karya{" "}
                <span className="relative inline-block text-brand">
                  Diaspora Indonesia
                </span>
              </h1>

              <p className="mt-6 max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg">
                Pusat konektivitas bisnis, aplikasi, riset, dan produk kreatif karya
                anak bangsa di seluruh penjuru dunia. Dikurasi oleh Tim IT &amp; Data PPID DPBD.
              </p>

              {/* Box Search Utama */}
              <div className="mt-8 max-w-xl">
                <SearchBar placeholder="Cari produk, kategori (misal: Makanan), atau negara..." />
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span className="font-semibold text-slate-700">Populer:</span>
                  {CATEGORIES.slice(0, 4).map((c) => (
                    <Link
                      key={c.slug}
                      href={`/explore?kategori=${c.slug}`}
                      className="rounded border border-slate-200 bg-slate-50 px-2 py-0.5 transition-colors hover:border-slate-300 hover:text-brand"
                    >
                      {c.name}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  href="/submit"
                  className="inline-flex h-11 items-center gap-2 rounded-md bg-brand px-6 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-dark"
                >
                  <Sparkles className="h-4 w-4" aria-hidden="true" />
                  Daftarkan Karya Anda
                </Link>
                <Link
                  href="/explore"
                  className="inline-flex h-11 items-center gap-2 rounded-md border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                >
                  Jelajahi Katalog
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>

              {/* Proof Badges */}
              <div className="mt-10 flex flex-wrap items-center gap-6 border-t border-slate-100 pt-6 text-xs text-slate-500">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  <span>Kurasi Admin Terverifikasi</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-brand" />
                  <span>Koneksi Langsung ke Pemilik</span>
                </div>
              </div>
            </div>

            {/* Visual Showcase Kanan (Bento Highlight) */}
            <div className="lg:col-span-5">
              <div className="relative rounded-lg border border-slate-200 bg-slate-900 p-6 text-white shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Showcase Unggulan
                    </span>
                  </div>
                  <span className="rounded border border-slate-700 bg-slate-800 px-2 py-0.5 text-[10px] font-mono text-slate-300">
                    FEATURED
                  </span>
                </div>

                {heroFeatured ? (
                  <div className="mt-5 space-y-4">
                    <div className="aspect-[16/10] overflow-hidden rounded border border-slate-800 bg-slate-950">
                      <img
                        src={heroFeatured.images[0] ?? "/placeholders/makanan-minuman.svg"}
                        alt={heroFeatured.name}
                        className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-medium text-slate-400">
                          {heroFeatured.categoryName} · {heroFeatured.country}
                        </span>
                        <span className="rounded bg-brand/20 px-2 py-0.5 text-[11px] font-semibold text-red-400">
                          {heroFeatured.stage}
                        </span>
                      </div>
                      <h3 className="mt-2 text-xl font-extrabold text-white">
                        {heroFeatured.name}
                      </h3>
                      <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-300">
                        {heroFeatured.shortDescription || heroFeatured.longDescription}
                      </p>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-800/80 pt-4 text-xs">
                      <span className="text-slate-400">
                        Oleh: <strong className="text-slate-200">{heroFeatured.ownerName}</strong>
                      </span>
                      <Link
                        href={`/produk/${heroFeatured.slug}`}
                        className="inline-flex items-center gap-1 font-semibold text-brand transition-colors hover:text-red-400"
                      >
                        Detail Karya →
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="mt-8 py-12 text-center text-slate-500">
                    Belum ada produk unggulan
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ===== IMPACT STATS BAR ===== */}
      <section className="border-b border-slate-200 bg-white py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            {[
              { label: "Negara Terjangkau", val: "18+" },
              { label: "Kategori Bisnis", val: "6 Sektor" },
              { label: "Karya Terdaftar", val: "100+" },
              { label: "Akses Kontak", val: "Langsung" },
            ].map((stat) => (
              <div key={stat.label} className="border-l-2 border-brand pl-4">
                <p className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                  {stat.val}
                </p>
                <p className="mt-0.5 text-xs font-medium text-slate-500">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== KATEGORI BENTO GRID ===== */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-brand">
              Eksplorasi Sektor
            </span>
            <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
              Kategori Produk &amp; Inovasi
            </h2>
          </div>
          <Link
            href="/explore"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand transition-colors hover:text-brand-dark"
          >
            Lihat Katalog Lengkap
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CATEGORIES.map((c) => {
            return (
              <Link
                key={c.slug}
                href={`/explore?kategori=${c.slug}`}
                className="group flex items-start gap-4 rounded-lg border border-slate-200 bg-white p-5 transition-colors hover:border-slate-300 hover:bg-slate-50/50"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-slate-50 transition-colors group-hover:border-brand/40 group-hover:bg-brand/5">
                  <c.icon className="h-6 w-6 text-slate-700 transition-colors group-hover:text-brand" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-brand transition-colors">
                    {c.name}
                  </h3>
                  <p className="mt-1 text-xs text-slate-500 leading-relaxed line-clamp-2">
                    Jelajahi karya &amp; peluang kolaborasi di sektor {c.name.toLowerCase()}.
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ===== FAVORIT MEMBER (JIKA LOGIN) ===== */}
      {user && favorites.length > 0 && (
        <FavoriteSection
          favorites={favorites}
          favoriteIds={favoriteIds}
          favoriteCounts={favoriteCounts}
          firstName={firstName}
        />
      )}

      {/* ===== PRODUK TERBARU ===== */}
      <section id="produk-terbaru" className="border-t border-b border-slate-200 bg-white py-16 scroll-mt-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <span className="text-xs font-semibold uppercase tracking-widest text-brand">
                Katalog Publik
              </span>
              <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                Pengajuan Terbaru
              </h2>
            </div>
            <Link
              href="/explore"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand transition-colors hover:text-brand-dark"
            >
              Semua Produk
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {latest.map((p) => (
              <ProductCard key={p.id} product={p} favoriteIds={favoriteIds} favoriteCounts={favoriteCounts} />
            ))}
          </div>
        </div>
      </section>

      {/* ===== ALUR CARA KERJA ===== */}
      <section id="cara-kerja" className="py-20 scroll-mt-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="max-w-2xl">
            <span className="text-xs font-semibold uppercase tracking-widest text-brand">
              Panduan Platform
            </span>
            <h2 className="mt-1 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Alur Publikasi &amp; Kurasi
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base">
              Proses sederhana dari pengajuan hingga terhubung dengan publik internasional.
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s) => (
              <div
                key={s.num}
                className="flex flex-col justify-between rounded-lg border border-slate-200 bg-white p-6 transition-colors hover:border-slate-300"
              >
                <div>
                  <span className="text-2xl font-black text-brand">{s.num}</span>
                  <h3 className="mt-3 text-base font-bold text-slate-900">{s.title}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-slate-500">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom Call to Action Card */}
          <div className="mt-12 rounded-lg border border-slate-900 bg-slate-900 p-8 text-white sm:p-10 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-2xl font-extrabold">Punya Produk atau Karya Diaspora?</h3>
              <p className="mt-1 text-sm text-slate-300">
                Daftarkan karya Anda hari ini dan perluas jangkauan ke jejaring internasional.
              </p>
            </div>
            <Link
              href="/submit"
              className="inline-flex shrink-0 h-11 items-center gap-2 rounded-md bg-brand px-6 text-sm font-semibold text-white transition-colors hover:bg-brand-dark"
            >
              Ajukan Produk
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
