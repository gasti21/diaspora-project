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
import { ArrowRight, Globe2, Sparkles, ShieldCheck, CheckCircle2, Building2 } from "lucide-react";

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
    <section className="mx-auto max-w-7xl px-4 pt-14 sm:px-6">
      <div className="mb-6 flex items-end justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">
            Favorit Tersimpan — <span className="text-brand">{firstName}</span>
          </h2>
          <p className="mt-1 text-xs text-slate-500 sm:text-sm">
            {favorites.length} produk tersimpan di daftar favoritmu
          </p>
        </div>
        <Link
          href="/favorit"
          className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-brand transition-colors hover:text-brand-dark sm:text-sm"
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
    title: "Submit Produk & Karya",
    desc: "Isi form singkat mengenai produk, foto, dan informasi kontak Anda.",
  },
  {
    num: "02",
    title: "Kurasi Tim Admin",
    desc: "Verifikasi kelayakan dan kesesuaian kategori oleh kurator resmi.",
  },
  {
    num: "03",
    title: "Publikasi Global",
    desc: "Karya Anda tayang di katalog publik yang diakses oleh jaringan diaspora.",
  },
  {
    num: "04",
    title: "Terhubung & Kolaborasi",
    desc: "Pengunjung menghubungi Anda langsung via Email & WhatsApp.",
  },
];

export default async function HomePage() {
  const latest = await getLatestProducts(8);

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
  const heroFeatured = latest[0] ?? null;

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-slate-900">
      {/* ===== HERO SECTION ===== */}
      <section className="relative overflow-hidden border-b border-slate-200 bg-white py-12 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
            
            {/* Kiri: Messaging & Search */}
            <div className="lg:col-span-7">
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs">
                <Globe2 className="h-3.5 w-3.5 text-brand" aria-hidden="true" />
                <span>Direktori Resmi PPID DPBD</span>
              </div>

              <h1 className="mt-5 text-3xl font-extrabold leading-[1.15] tracking-tight text-slate-900 sm:text-5xl lg:text-5xl">
                Konektivitas Bisnis &amp; Karya{" "}
                <span className="text-brand">Diaspora Indonesia</span>
              </h1>

              <p className="mt-4 max-w-xl text-sm leading-relaxed text-slate-600 sm:text-base">
                Platform etalase produk, aplikasi, bisnis, dan riset karya anak bangsa
                di seluruh dunia. Ditemukan publik, terhubung secara langsung.
              </p>

              {/* Box Search Utama */}
              <div className="mt-7 max-w-xl">
                <SearchBar placeholder="Cari karya, kategori (misal: Kuliner), atau negara..." />
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Link
                  href="/submit"
                  className="inline-flex h-10 items-center gap-2 rounded-md bg-brand px-5 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-brand-dark"
                >
                  <Sparkles className="h-4 w-4" aria-hidden="true" />
                  Submit Produk Anda
                </Link>
                <Link
                  href="/explore"
                  className="inline-flex h-10 items-center gap-1.5 rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                >
                  Explore Katalog
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>

              {/* Guarantees / Proof */}
              <div className="mt-8 flex flex-wrap items-center gap-6 border-t border-slate-100 pt-6 text-xs font-medium text-slate-500">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  Dikurasi Tim IT PPID
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-brand" />
                  Kontak Pemilik Transparan
                </span>
              </div>
            </div>

            {/* Kanan: Visual Card Product Showcase (Clean White Card) */}
            <div className="lg:col-span-5">
              <div className="overflow-hidden rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-brand" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Highlight Minggu Ini
                    </span>
                  </div>
                  <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                    VERIFIED
                  </span>
                </div>

                {heroFeatured ? (
                  <div className="mt-4 space-y-3.5">
                    <div className="aspect-[16/10] overflow-hidden rounded bg-slate-100">
                      <img
                        src={heroFeatured.images[0] ?? "/placeholders/makanan-minuman.svg"}
                        alt={heroFeatured.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>{heroFeatured.categoryName}</span>
                        <span className="font-semibold text-slate-700">{heroFeatured.country}</span>
                      </div>
                      <h3 className="mt-1 text-lg font-bold text-slate-900 line-clamp-1">
                        {heroFeatured.name}
                      </h3>
                      <p className="mt-1 text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        {heroFeatured.shortDescription || heroFeatured.longDescription}
                      </p>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
                      <span className="text-slate-500">
                        Oleh: <strong className="text-slate-800">{heroFeatured.ownerName}</strong>
                      </span>
                      <Link
                        href={`/produk/${heroFeatured.slug}`}
                        className="font-semibold text-brand hover:underline"
                      >
                        Lihat Detail →
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="py-12 text-center text-xs text-slate-400">
                    Belum ada produk untuk ditampilkan
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ===== STATISTIK BAR ===== */}
      <section className="border-b border-slate-200 bg-white py-6">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { label: "Negara Diaspora", val: "18+" },
              { label: "Kategori Produk", val: "6 Sektor" },
              { label: "Karya Terdaftar", val: "100+" },
              { label: "Akses Kontak", val: "Langsung" },
            ].map((s) => (
              <div key={s.label} className="border-l-2 border-brand/80 pl-3.5">
                <p className="text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">
                  {s.val}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== KATEGORI SEKTOR ===== */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="mb-6 flex items-end justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-brand">
              Kategori
            </span>
            <h2 className="mt-1 text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">
              Jelajahi Berdasarkan Sektor
            </h2>
          </div>
          <Link
            href="/explore"
            className="inline-flex items-center gap-1 text-xs font-semibold text-brand hover:underline sm:text-sm"
          >
            Semua Kategori
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-6">
          {CATEGORIES.map((c) => {
            const bgSoft = c.color.replace("text-", "bg-").replace("500", "50");
            return (
              <Link
                key={c.slug}
                href={`/explore?kategori=${c.slug}`}
                className="group flex flex-col items-center rounded-lg border border-slate-200 bg-white p-4 text-center transition-colors hover:border-slate-300 hover:bg-slate-50"
              >
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-md ${bgSoft} transition-transform group-hover:scale-105`}
                >
                  <c.icon className={`h-5 w-5 ${c.color}`} aria-hidden="true" />
                </div>
                <span className="mt-3 text-xs font-bold leading-tight text-slate-800">
                  {c.name}
                </span>
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
      <section id="produk-terbaru" className="border-t border-b border-slate-200 bg-white py-14 scroll-mt-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-6 flex items-end justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <span className="text-xs font-semibold uppercase tracking-widest text-brand">
                Katalog Terbaru
              </span>
              <h2 className="mt-1 text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">
                Karya &amp; Produk Terkini
              </h2>
            </div>
            <Link
              href="/explore"
              className="inline-flex items-center gap-1 text-xs font-semibold text-brand hover:underline sm:text-sm"
            >
              Lihat Semua ({latest.length})
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

      {/* ===== ALUR CARA KERJA ===== */}
      <section id="cara-kerja" className="py-16 scroll-mt-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="max-w-xl">
            <span className="text-xs font-semibold uppercase tracking-widest text-brand">
              Alur Platform
            </span>
            <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
              Cara Kerja Publikasi
            </h2>
            <p className="mt-2 text-xs leading-relaxed text-slate-600 sm:text-sm">
              4 langkah mudah mendaftarkan dan mempublikasikan karya Anda di katalog diaspora.
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s) => (
              <div
                key={s.num}
                className="rounded-lg border border-slate-200 bg-white p-5 transition-colors hover:border-slate-300"
              >
                <span className="text-xl font-extrabold text-brand">{s.num}</span>
                <h3 className="mt-2 text-sm font-bold text-slate-900">{s.title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-500">{s.desc}</p>
              </div>
            ))}
          </div>

          {/* CTA Box Sederhana & Elegan */}
          <div className="mt-10 flex flex-col items-start justify-between gap-4 rounded-lg border border-slate-200 bg-white p-6 sm:flex-row sm:items-center sm:p-8">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Punya Karya atau Produk Diaspora?</h3>
              <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                Publikasikan karya Anda agar dikenal oleh jejaring diaspora internasional.
              </p>
            </div>
            <Link
              href="/submit"
              className="inline-flex shrink-0 h-10 items-center gap-2 rounded-md bg-brand px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-dark"
            >
              <Building2 className="h-4 w-4" />
              Ajukan Sekarang
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
