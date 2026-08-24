import type { Metadata } from "next";
import { Landmark, Mail, MessageCircle, type LucideIcon } from "lucide-react";

export const metadata: Metadata = {
  title: "Contact",
  description: "Hubungi tim KaryaDiaspora - PPID DPBD.",
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
          value="info@karyadiaspora.example"
          href="mailto:info@karyadiaspora.example"
        />
        <Card
          icon={MessageCircle}
          title="WhatsApp"
          desc="Jam kerja 09.00–17.00 WIB."
          value="Hubungi via WhatsApp"
          href="https://wa.me/6281234567890"
        />
        <Card
          icon={Landmark}
          title="Sekretariat PPID DPBD"
          desc="Tim Bidang IT dan Data PPID DPBD."
          value="Kunjungi situs DPBD"
          href="https://dpbd.org"
        />
      </div>

      <div className="mt-10 rounded-2xl bg-surface p-6 text-sm leading-relaxed text-navy/85">
        <h2 className="font-bold">Catatan untuk pemilik produk</h2>
        <p className="mt-2 text-muted">
          Setelah Anda mengirimkan produk melalui halaman Submit, admin akan
          meninjau dalam waktu kurang dari 24 jam dan menghubungi Anda melalui
          email atau WhatsApp yang terdaftar.
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
  href: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-4 rounded-2xl border border-line bg-white p-5 transition hover:border-navy/30 hover:shadow-md"
    >
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand">
        <Icon className="h-5.5 w-5.5" aria-hidden="true" />
      </span>
      <div>
        <h2 className="font-bold">{title}</h2>
        <p className="text-sm text-muted">{desc}</p>
        <p className="mt-0.5 text-sm font-semibold text-brand">{value}</p>
      </div>
    </a>
  );
}
