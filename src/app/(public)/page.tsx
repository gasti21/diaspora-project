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
              <Link
                href="/explore"
                className="rounded-lg bg-navy px-6 py-3 text-sm font-semibold text-white transition hover:bg-navy-dark"
              >
                Explore Produk
              </Link>
              <Link
                href="/submit"
                className="rounded-lg bg-brand px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-dark"
              >
                Submit Produk
              </Link>
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
          {CATEGORIES.map((c) => (
            <Link
              key={c.slug}
              href={`/explore?kategori=${c.slug}`}
              className="flex flex-col items-center gap-2.5 rounded-xl border border-line bg-white p-5 text-center transition hover:-translate-y-0.5 hover:border-navy/30 hover:shadow-md"
            >
              <c.icon className={`h-7 w-7 ${c.color}`} aria-hidden="true" />
              <span className="text-sm font-semibold leading-snug">{c.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ===== Produk Terbaru ===== */}
      <section className="bg-surface/60 py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-6 flex items-end justify-between">
            <h2 className="text-2xl font-extrabold">Produk Terbaru</h2>
            <Link href="/explore" className="text-sm font-medium text-brand hover:underline">
              Lihat semua produk
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {latest.map((p) => (
              <div key={p.id} className="flex">
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Cara Kerja ===== */}
      <section className="bg-navy-deep py-16 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <h2 className="text-center text-2xl font-extrabold">Cara Kerja</h2>
          <div className="mt-10 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s) => (
              <div key={s.title} className="flex flex-col items-center text-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10">
                  <s.icon className="h-6 w-6" aria-hidden="true" />
                </span>
                <h3 className="mt-4 font-bold">{s.title}</h3>
                <p className="mt-1.5 text-sm text-white/70">{s.desc}</p>
              </div>
            ))}
          </div>

          {/* CTA banner */}
          <div className="mt-14 flex flex-col items-center justify-between gap-5 rounded-2xl bg-white/5 p-8 sm:flex-row">
            <div className="text-center sm:text-left">
              <h3 className="text-xl font-bold">Punya produk atau karya untuk ditampilkan?</h3>
              <p className="mt-1 text-sm text-white/70">
                Jangan lewatkan kesempatan menemukan peluang baru!
              </p>
            </div>
            <Link
              href="/submit"
              className="shrink-0 rounded-lg bg-brand px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-brand-dark"
            >
              Submit Produk Sekarang
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
