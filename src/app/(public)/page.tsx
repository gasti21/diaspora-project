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
            <div className="mt-7 flex flex-wrap gap-3">
              <a
                href="#produk-terbaru"
                className="inline-flex items-center justify-center rounded-lg bg-navy px-6 py-3 text-sm font-semibold text-white transition hover:bg-navy-dark active:scale-[0.98]"
              >
                Lihat Produk ↓
              </a>
              <a
                href="#cara-kerja"
                className="inline-flex items-center justify-center rounded-lg border border-line bg-white px-6 py-3 text-sm font-semibold text-navy transition hover:bg-surface active:scale-[0.98]"
              >
                Cara Kerja
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
      <section id="cara-kerja" className="border-t border-line bg-gradient-to-b from-white to-surface py-20 scroll-mt-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center">
            <span className="text-xs font-bold uppercase tracking-wider text-brand">
              Alur Platform
            </span>
            <h2 className="mt-1.5 text-3xl font-extrabold text-navy">Cara Kerja</h2>
            <p className="mx-auto mt-2 max-w-lg text-sm text-muted">
              Empat langkah mudah menampilkan dan menemukan produk karya diaspora Indonesia.
            </p>
          </div>

          <div className="relative mt-14">
            {/* Garis penghubung titik-titik antar langkah (desktop only) */}
            <div
              className="absolute top-7 left-[12%] right-[12%] hidden h-0.5 border-t-2 border-dashed border-navy/15 lg:block"
              aria-hidden="true"
            />

            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {STEPS.map((s, idx) => (
                <div
                  key={s.title}
                  className="group relative flex flex-col items-center rounded-2xl border border-line/80 bg-white p-7 text-center shadow-sm transition duration-300 hover:-translate-y-1 hover:border-brand/30 hover:shadow-md"
                >
                  {/* Badge Nomor Langkah */}
                  <span className="absolute -top-3.5 right-6 rounded-full bg-brand-soft px-3 py-0.5 text-xs font-bold text-brand">
                    0{idx + 1}
                  </span>

                  <div className="relative z-10 flex h-14 w-14 items-center justify-center rounded-2xl bg-surface text-navy transition duration-300 group-hover:bg-brand group-hover:text-white">
                    <s.icon className="h-6 w-6" aria-hidden="true" />
                  </div>
                  
                  <h3 className="mt-5 text-base font-bold text-navy">{s.title.replace(/^\d+\.\s*/, "")}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-muted">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
