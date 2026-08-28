import Link from "next/link";
import { ArrowDown, ArrowRight } from "lucide-react";
import { SearchBar } from "@/components/catalog/SearchBar";
import { ProductCard } from "@/components/product/ProductCard";
import { CATEGORIES } from "@/lib/constants";
import { getLatestProducts } from "@/lib/data";

export const dynamic = "force-dynamic";

const STEPS = [
  {
    title: "Submit Produk",
    desc: "Kirim informasi produk Anda dengan mudah.",
  },
  {
    title: "Admin Review",
    desc: "Tim kami akan memverifikasi produk.",
  },
  {
    title: "Produk Tampil",
    desc: "Produk Anda ditampilkan di platform kami.",
  },
  {
    title: "Terhubung",
    desc: "Pengunjung menghubungi Anda jika tertarik.",
  },
];

export default async function HomePage() {
  const latest = await getLatestProducts(6);

  return (
    <>
      {/* ===== Hero ===== */}
      <section className="relative overflow-hidden bg-surface">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:py-20">
          <div>
            <h1 className="text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
              Temukan Produk dan Karya{" "}
              <span className="text-brand">Diaspora Indonesia</span> di Seluruh
              Dunia
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-muted">
              Jelajahi produk, bisnis, aplikasi, riset, dan karya kreatif buatan
              diaspora Indonesia. Terhubung dengan pemilik produk untuk
              berkolaborasi, membeli, atau mendukung.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3">
              <a
                href="#produk-terbaru"
                className="group inline-flex items-center gap-2.5 rounded-lg bg-navy px-6 py-3 text-sm font-semibold text-white shadow-sm transition duration-300 hover:bg-navy-dark hover:shadow-md"
              >
                <span>Jelajahi Produk</span>
                <ArrowDown
                  className="h-4 w-4 text-white/80 transition-transform duration-300 ease-out group-hover:translate-y-0.5"
                  aria-hidden="true"
                />
              </a>
              <a
                href="#cara-kerja"
                className="group relative inline-flex items-center gap-2 py-3 text-sm font-semibold text-navy transition-colors duration-300 hover:text-navy-dark"
              >
                <span>Cara Kerja</span>
                <ArrowRight
                  className="h-4 w-4 text-muted transition-transform duration-300 ease-out group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
                <span
                  aria-hidden="true"
                  className="absolute inset-x-0 bottom-1 h-px origin-left scale-x-0 bg-navy transition-transform duration-300 ease-out group-hover:scale-x-100"
                />
              </a>
            </div>
            <div className="mt-8 max-w-lg">
              <SearchBar />
            </div>
          </div>

          {/* Kolase foto */}
          <div className="hidden grid-cols-3 gap-3 lg:grid">
            {[
              "placeholders/makanan-minuman.svg",
              "placeholders/aplikasi-software.svg",
              "placeholders/fashion-accessories.svg",
              "placeholders/umkm-kerajinan.svg",
              "placeholders/riset-inovasi.svg",
              "placeholders/pendidikan-edukasi.svg",
            ].map((src, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={src}
                src={src}
                alt=""
                className={`h-44 w-full rounded-2xl object-cover shadow-md ${i % 3 === 1 ? "translate-y-4" : ""}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ===== Kategori Populer ===== */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="mb-6 flex items-end justify-between">
          <h2 className="text-2xl font-extrabold">Kategori Populer</h2>
          <Link href="/explore" className="text-sm font-medium text-brand hover:underline">
            Lihat semua kategori
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {CATEGORIES.map((c) => {
            // Mapping warna background pastel untuk icon
            const bgSoft = c.color.replace('text-', 'bg-').replace('500', '50');
            
            return (
              <Link
                key={c.slug}
                href={`/explore?kategori=${c.slug}`}
                className="group flex flex-col items-center gap-3 rounded-xl border border-line bg-white p-5 text-center transition hover:-translate-y-1 hover:border-navy/30 hover:shadow-md"
              >
                <div className={`flex h-14 w-14 items-center justify-center rounded-full ${bgSoft} transition group-hover:scale-110`}>
                  <c.icon className={`h-7 w-7 ${c.color}`} aria-hidden="true" />
                </div>
                <span className="text-sm font-semibold leading-snug">{c.name}</span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ===== Produk Terbaru ===== */}
      <section id="produk-terbaru" className="bg-surface/60 py-14 scroll-mt-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-6 flex items-end justify-between">
            <h2 className="text-2xl font-extrabold">Produk Terbaru</h2>
            <Link href="/explore" className="text-sm font-medium text-brand hover:underline">
              Lihat semua produk
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {latest.map((p) => (
              <div key={p.id} className="flex">
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Cara Kerja ===== */}
      <section id="cara-kerja" className="border-t border-line/80 bg-white py-20 scroll-mt-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-extrabold tracking-tight text-navy sm:text-4xl">
              Alur Platform &amp; Cara Kerja
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted sm:text-base">
              Dari pengajuan hingga terhubung dengan publik — 4 langkah sederhana
              publikasi karya diaspora.
            </p>
          </div>

          <div className="mt-14 grid gap-y-10 sm:grid-cols-2 sm:gap-x-12 lg:grid-cols-4 lg:gap-x-0 lg:divide-x lg:divide-line">
            {STEPS.map((s, idx) => (
              <div
                key={s.title}
                className="group lg:px-8 lg:first:pl-0 lg:last:pr-0"
              >
                <span className="text-sm font-medium tabular-nums text-muted transition-colors duration-300 group-hover:text-brand">
                  {String(idx + 1).padStart(2, "0")}
                </span>
                <span
                  aria-hidden="true"
                  className="mt-3 block h-0.5 w-6 bg-brand transition-[width] duration-300 ease-out group-hover:w-12"
                />
                <h3 className="mt-4 text-base font-bold text-navy">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
