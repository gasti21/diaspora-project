import Link from "next/link";
import { ClipboardCheck, FileUp, Handshake, Mail } from "lucide-react";
import { SearchBar } from "@/components/SearchBar";
import { ProductCard } from "@/components/ProductCard";
import { CATEGORIES } from "@/lib/constants";
import { getLatestProducts } from "@/lib/data";

export const dynamic = "force-dynamic";

const STEPS = [
  {
    title: "1. Submit Produk",
    desc: "Kirim informasi produk Anda dengan mudah.",
    icon: FileUp,
  },
  {
    title: "2. Admin Review",
    desc: "Tim kami akan memverifikasi produk.",
    icon: ClipboardCheck,
  },
  {
    title: "3. Produk Tampil",
    desc: "Produk Anda ditampilkan di platform kami.",
    icon: Mail,
  },
  {
    title: "4. Terhubung",
    desc: "Pengunjung menghubungi Anda jika tertarik.",
    icon: Handshake,
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
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a
                href="#produk-terbaru"
                className="group inline-flex items-center gap-2 rounded-xl bg-navy px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-navy-dark active:scale-[0.98]"
              >
                <span>Jelajahi Produk</span>
                <span className="transition-transform duration-200 group-hover:translate-y-0.5">↓</span>
              </a>
              <a
                href="#cara-kerja"
                className="inline-flex items-center gap-2 rounded-xl border border-line bg-white px-5 py-3 text-sm font-semibold text-navy/90 shadow-sm transition hover:border-navy/30 hover:bg-surface active:scale-[0.98]"
              >
                <span>Alur Pengajuan</span>
                <span className="text-muted transition-transform duration-200 group-hover:translate-x-0.5">→</span>
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
      <section id="cara-kerja" className="relative border-t border-line/80 bg-surface/50 py-20 scroll-mt-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex flex-col items-center text-center">
            <span className="rounded-full border border-brand/20 bg-brand-soft px-3.5 py-1 text-xs font-semibold text-brand">
              Proses Transparan
            </span>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-navy sm:text-4xl">
              Alur Platform & Cara Kerja
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted sm:text-base">
              Dari pengajuan hingga terhubung dengan publik — 4 langkah sederhana publikasi karya diaspora.
            </p>
          </div>

          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, idx) => (
              <div
                key={s.title}
                className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-line bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-navy/30 hover:shadow-lg"
              >
                {/* Visual Numbering Watermark */}
                <span className="absolute -top-3 -right-2 select-none text-6xl font-black tracking-tighter text-surface/80 transition duration-300 group-hover:text-brand-soft/80">
                  0{idx + 1}
                </span>

                <div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-line/60 bg-surface text-navy transition duration-300 group-hover:border-navy/20 group-hover:bg-navy group-hover:text-white">
                    <s.icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  
                  <h3 className="mt-6 text-base font-bold text-navy">
                    {s.title.replace(/^\d+\.\s*/, "")}
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-muted/90">
                    {s.desc}
                  </p>
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-line/60 pt-4">
                  <span className="text-[11px] font-medium text-muted">Langkah {idx + 1} dari 4</span>
                  <span className="text-xs font-semibold text-brand opacity-0 transition duration-200 group-hover:opacity-100">
                    Tahap {idx + 1}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
