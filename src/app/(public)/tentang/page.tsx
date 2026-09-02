import type { Metadata } from "next";
import { ArrowUpRight, Globe, Handshake, Landmark, Target, type LucideIcon } from "lucide-react";

export const metadata: Metadata = {
  description: "Tentang KaryaDiaspora dan PPID DPBD.",
};

const VALUES: { icon: LucideIcon; title: string; desc: string }[] = [
  {
    icon: Target,
    title: "Visi & Misi",
    desc: "Menjadi jembatan antara diaspora Indonesia dan peluang bisnis global.",
  },
  {
    icon: Globe,
    title: "Jangkauan",
    desc: "Produk diaspora dari berbagai negara di seluruh dunia.",
  },
  {
    icon: Handshake,
    title: "Kolaborasi",
    desc: "Menghubungkan pemilik produk dengan partner, pembeli, dan investor.",
  },
];

export default function TentangPage() {
  return (
    <div className="pb-20">
      {/* Hero */}
      <header className="relative overflow-hidden bg-surface">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-brand/5 blur-2xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-32 -left-16 h-64 w-64 rounded-full bg-navy/5 blur-2xl"
        />
        <div className="relative mx-auto max-w-4xl px-4 pb-16 pt-16 sm:px-6">
          <h1 className="max-w-2xl text-4xl font-extrabold leading-[1.15] tracking-tight sm:text-5xl">
            Tentang{" "}
            <span className="relative whitespace-nowrap text-brand">
              KaryaDiaspora
              <svg
                className="absolute -bottom-1.5 left-0 h-2 w-full text-brand/30"
                viewBox="0 0 120 8"
                fill="none"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <path d="M2 6C30 2 60 2 118 5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              </svg>
            </span>
          </h1>
          <p className="mt-4 max-w-lg text-base leading-relaxed text-muted sm:text-lg">
            Pusat informasi bisnis, karya, dan peluang kolaborasi diaspora
            Indonesia di seluruh dunia.
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        {/* Lede editorial - kartu melayang, ritme sama dengan /kontak */}
        <div className="group relative -mt-8 overflow-hidden rounded-2xl border border-line bg-white p-7 shadow-[0_12px_32px_-12px_rgba(11,31,59,0.12)] transition-shadow hover:shadow-[0_20px_44px_-16px_rgba(11,31,59,0.18)] sm:p-9">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand via-brand/60 to-transparent" />
          <p className="text-2xl font-bold leading-snug tracking-tight text-navy sm:text-[1.75rem]">
            KaryaDiaspora adalah Platform Konektivitas Bisnis Diaspora
            Indonesia -{" "}
            <span className="text-brand">
              pusat informasi peluang bisnis, kolaborasi, dan pengembangan
              ekonomi diaspora
            </span>{" "}
            di seluruh dunia.
          </p>
        </div>

        <div className="mt-8 grid gap-x-10 gap-y-4 text-sm leading-relaxed text-muted sm:grid-cols-2">
          <p>
            Kami percaya bahwa produk, aplikasi, riset, dan karya kreatif
            diaspora Indonesia layak dikenal luas - dan koneksi yang tepat
            dapat membuka peluang bisnis lintas negara.
          </p>
          <p>
            Diaspora menampilkan produknya tanpa hambatan, pengunjung bebas
            menjelajah tanpa registrasi, dan setiap produk dikurasi tim admin
            agar kualitas serta keaslian informasi terjaga.
          </p>
        </div>

        {/* Garis kredit */}
        <div className="mt-10 flex flex-col gap-4 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted">
            <span className="font-semibold text-navy">Dikembangkan oleh Tim Bidang IT &amp; Data</span>{" "}
            - PPID DPBD, Direktorat Pengembangan Bisnis dan Dana Abadi
            Mengabdi PPI Dunia.
          </p>
          <a
            href="https://ppi.id/"
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-brand hover:text-brand-dark"
          >
            <Landmark className="h-4 w-4" aria-hidden="true" />
            PPI Dunia
            <ArrowUpRight
              className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </a>
        </div>

        {/* Nilai */}
        <p className="mt-14 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-brand">
          <span className="h-px w-8 bg-brand" aria-hidden="true" />
          Nilai Kami
        </p>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          {VALUES.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="group relative flex flex-col overflow-hidden rounded-2xl border border-line bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-navy/10"
            >
              <span
                aria-hidden="true"
                className="absolute inset-x-0 top-0 h-1 origin-left scale-x-0 bg-gradient-to-r from-brand to-brand-dark transition-transform duration-300 group-hover:scale-x-100"
              />
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-soft text-brand transition-colors duration-300 group-hover:bg-brand group-hover:text-white">
                <Icon className="h-5.5 w-5.5" aria-hidden="true" />
              </span>
              <h2 className="mt-4 font-bold">{title}</h2>
              <p className="mt-1 text-sm leading-relaxed text-muted">{desc}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <section className="relative mt-10 overflow-hidden rounded-2xl bg-gradient-to-br from-brand to-brand-dark px-6 py-10 text-center text-white sm:px-10">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/10"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-20 -left-10 h-40 w-40 rounded-full bg-white/5"
          />
          <h2 className="relative text-2xl font-extrabold tracking-tight">
            Temukan karya diaspora Indonesia
          </h2>
          <p className="relative mx-auto mt-2 max-w-md text-sm leading-relaxed text-white/85">
            Jelajahi katalog produk, aplikasi, dan karya kreatif dari diaspora
            di berbagai negara - tanpa perlu registrasi.
          </p>
          <a
            href="/explore"
            className="relative mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-bold text-brand-dark shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0"
          >
            Mulai Explore Produk
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </a>
        </section>
      </div>
    </div>
  );
}
