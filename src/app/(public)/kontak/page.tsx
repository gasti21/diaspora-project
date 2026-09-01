import type { Metadata } from "next";
import { Landmark, Mail, MessageCircle, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  description: "Hubungi tim KaryaDiaspora - Perhimpunan Pelajar Indonesia (PPI) Dunia.",
};

export default function KontakPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <h1 className="text-3xl font-extrabold">Contact</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        Ada pertanyaan tentang platform, kemitraan, atau pengajuan produk? Tim
        kami siap membantu.
      </p>

      <div className="mt-8 space-y-4">
        <Card
          icon={Mail}
          title="Email"
          desc="Balasan dalam 1–2 hari kerja."
          value="karyadiaspora@ppi.id"
          href="mailto:karyadiaspora@gmail.com"
        />
        <Card
          icon={MessageCircle}
          title="Chat Support"
          desc="Member dapat menghubungi tim langsung dari dalam platform — tanpa keluar aplikasi."
          value="Tersedia setelah masuk ke akun"
          href="/login?next=%2Fexplore"
        />
        <Card
          icon={Landmark}
          title="PPI Dunia"
          desc="Perhimpunan Pelajar Indonesia (PPI) Dunia."
          value="Kunjungi situs PPI Dunia"
          href="https://ppi.id/"
        />
      </div>

      <div className="mt-10 rounded-2xl bg-surface p-6 text-justify text-sm leading-relaxed text-navy/85">
        <h2 className="font-bold">Catatan untuk pemilik produk</h2>
        <p className="mt-2 text-muted">
          Setelah Anda mengirimkan produk melalui halaman Submit, admin akan
          meninjau dalam waktu kurang dari 24 jam dan menghubungi Anda melalui
          email yang terdaftar.
        </p>
      </div>
    </div>
  );
}

function Card({
  icon: Icon,
  title,
  desc,
  value,
  href,
}: {
  icon: LucideIcon;
  title: string;
  desc: string;
  value: string;
  /** Kosongkan untuk kartu non-tautan (belum aktif). */
  href?: string;
}) {
  const cls = cn(
    "flex items-center gap-4 rounded-2xl border border-line bg-white p-5",
    href && "transition hover:border-navy/30 hover:shadow-md"
  );
  const body = (
    <>
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand">
        <Icon className="h-5.5 w-5.5" aria-hidden="true" />
      </span>
      <div>
        <h2 className="font-bold">{title}</h2>
        <p className="text-sm text-muted">{desc}</p>
        <p className="mt-0.5 text-sm font-semibold text-brand">{value}</p>
      </div>
    </>
  );

  // Kartu tanpa href dirender sebagai div non-klik (link WA menyusul nanti).
  if (!href) return <div className={cls}>{body}</div>;

  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>
      {body}
    </a>
  );
}
