import type { Metadata } from "next";
import {
  ArrowUpRight,
  ChevronRight,
  Landmark,
  Mail,
  MessageCircle,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  description: "Hubungi tim KaryaDiaspora - Perhimpunan Pelajar Indonesia (PPI) Dunia.",
};

const CONTACT_EMAIL = "karyadiaspora@ppi.id";

const STEPS = [
  { title: "Submit produk", desc: "Isi form lengkap dengan foto dan lokasi usaha Anda." },
  { title: "Review kurator", desc: "Admin meninjau pengajuan dalam waktu kurang dari 24 jam." },
  { title: "Tayang di katalog", desc: "Produk disetujui dan langsung tampil di halaman Explore." },
] as const;

export default function KontakPage() {
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
            Mari Terhubung dengan{" "}
            <span className="relative whitespace-nowrap text-brand">
              Kami
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
            Pertanyaan tentang platform, peluang kemitraan, atau pengajuan
            produk - tim kami siap membantu Anda.
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        {/* Kanal kontak: email & chat support */}
        <div className="-mt-8 grid gap-4 sm:grid-cols-2">
          <ChannelCard
            href={`mailto:${CONTACT_EMAIL}`}
            icon={Mail}
            title="Email"
            desc="Balasan dalam 1–2 hari kerja."
            action={CONTACT_EMAIL}
          />
          <ChannelCard
            href="/login?next=%2Fexplore"
            icon={MessageCircle}
            title="Chat Support"
            desc="Hubungi tim langsung dari dalam platform - tanpa keluar aplikasi."
            action="Masuk untuk memulai percakapan"
          />
        </div>

        {/* Kartu institusi */}
        <InstitutionCard />

        {/* Alur untuk pemilik produk */}
        <section
          aria-labelledby="catatan-pemilik"
          className="mt-8 overflow-hidden rounded-2xl border border-line bg-white"
        >
          <div className="border-l-4 border-brand bg-surface px-6 py-5">
            <h2 id="catatan-pemilik" className="font-bold text-navy">
              Catatan untuk pemilik produk
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-muted">
              Tiga langkah sampai produk Anda tampil di katalog.
            </p>
          </div>



        <ol className="grid gap-0 divide-y divide-line px-6 py-2 sm:grid-cols-3 sm:divide-x sm:divide-y-0 sm:py-0">
          {STEPS.map((step, i) => (
            <li key={step.title} className="flex gap-3 py-4 sm:flex-col sm:gap-2 sm:px-6 sm:py-5">
              <span
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-soft text-xs font-bold text-brand"
                aria-hidden="true"
              >
                {i + 1}
              </span>
              <div>
                <h3 className="text-sm font-semibold text-navy">{step.title}</h3>
                <p className="mt-0.5 text-sm leading-relaxed text-muted">{step.desc}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

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
            Siap menampilkan karya Anda?
          </h2>
          <p className="relative mx-auto mt-2 max-w-md text-sm leading-relaxed text-white/85">
            Bergabung dengan pelaku usaha dan kreator diaspora Indonesia yang
            sudah tampil di katalog kami - gratis.
          </p>
          <a
            href="/submit"
            className="relative mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-bold text-brand-dark shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0"
          >
            Submit Produk Sekarang
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </a>
        </section>
      </div>
    </div>
  );
}

function ChannelCard({
  icon: Icon,
  title,
  desc,
  action,
  href,
}: {
  icon: LucideIcon;
  title: string;
  desc: string;
  action: string;
  href: string;
}) {
  return (
    <a
      href={href}
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
      <span className="mt-auto flex items-center gap-1 pt-4 text-sm font-semibold break-all text-brand">
        {action}
        <ArrowUpRight
          className="h-4 w-4 shrink-0 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
          aria-hidden="true"
        />
      </span>
    </a>
  );
}

function InstitutionCard() {
  return (
    <a
      href="https://ppi.id/"
      target="_blank"
      rel="noopener noreferrer"
      className="group mt-4 flex flex-col gap-5 rounded-2xl bg-navy-deep p-6 text-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-navy/30 sm:flex-row sm:items-center sm:justify-between sm:p-7"
    >
      <div className="flex items-start gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white">
          <Landmark className="h-5.5 w-5.5" aria-hidden="true" />
        </span>
        <div>
          <h2 className="font-bold">Didukung oleh PPI Dunia</h2>
          <p className="mt-1 max-w-md text-sm leading-relaxed text-white/70">
            KaryaDiaspora adalah inisiatif Perhimpunan Pelajar Indonesia (PPI)
            Dunia untuk menghubungkan karya diaspora dengan pasar global.
          </p>
        </div>
      </div>
      <span
        className={cn(
          "inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold",
          "transition-colors group-hover:bg-white group-hover:text-navy-deep"
        )}
      >
        Kunjungi situs
        <ChevronRight className="h-4 w-4" aria-hidden="true" />
      </span>
    </a>
  );
}
