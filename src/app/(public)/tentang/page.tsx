import type { Metadata } from "next";
import Link from "next/link";
import { Globe, Handshake, Target, type LucideIcon } from "lucide-react";

export const metadata: Metadata = {
  description: "Tentang KaryaDiaspora dan PPID DPBD.",
};

const VALUES: { icon: LucideIcon; title: string; desc: string }[] = [
  {
    icon: Target,
    title: "Misi",
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
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <h1 className="text-3xl font-extrabold">Tentang Kami</h1>
      <div className="mt-6 space-y-5 text-justify text-sm leading-relaxed text-navy/85">
        <p>
          <strong>KaryaDiaspora</strong> adalah Platform Konektivitas Bisnis
          Diaspora Indonesia - pusat informasi peluang bisnis, kolaborasi, dan
          pengembangan ekonomi diaspora Indonesia di seluruh dunia.
        </p>
        <p>
          Platform ini dikembangkan oleh <strong>Tim Bidang IT dan Data PPID
          DPBD</strong> di bawah naungan Direktorat Pengembangan Bisnis dan
          Dana Abadi Mengabdi PPI Dunia. Kami percaya bahwa produk,
          aplikasi, riset, dan karya kreatif diaspora Indonesia layak dikenal
          luas, serta koneksi yang tepat dapat membuka peluang bisnis dan
          kolaborasi lintas negara.
        </p>
        <p>
          Melalui KaryaDiaspora, diaspora dapat menampilkan produknya tanpa
          hambatan, sementara pengunjung bebas menjelajah tanpa perlu
          registrasi. Setiap produk dikurasi oleh tim admin agar kualitas dan
          keaslian informasi terjaga.
        </p>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        {VALUES.map(({ icon: Icon, title, desc }) => (
          <div key={title} className="rounded-2xl border border-line bg-white p-6">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-navy/5 text-navy">
              <Icon className="h-5.5 w-5.5" aria-hidden="true" />
            </span>
            <h2 className="mt-3 font-bold">{title}</h2>
            <p className="mt-1.5 text-sm text-muted">{desc}</p>
          </div>
        ))}
      </div>

      <Link
        href="/explore"
        className="mt-10 inline-block rounded-lg bg-navy px-6 py-3 text-sm font-semibold text-white hover:bg-navy-dark"
      >
        Mulai Explore Produk
      </Link>
    </div>
  );
}
