import Link from "next/link";
import type { Metadata } from "next";
import { CheckCircle2, ClipboardList, Info, ShieldCheck } from "lucide-react";
import { getSessionUser } from "@/lib/auth";
import { listCategories } from "@/lib/data";
import { SubmitForm } from "@/components/forms/SubmitForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  description:
    "Kirimkan produk atau karya Anda untuk ditayangkan di KaryaDiaspora.",
};

export default async function SubmitPage() {
  const user = await getSessionUser();
  if (!user) return null; // guard sesi ada di layout (member)

  const categories = await listCategories();

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold">Halo, {user.name} 👋</h1>
          <p className="mt-2 max-w-xl text-muted">
            Lengkapi informasi produk Anda - tim kami akan meninjau sebelum
            ditampilkan di katalog diaspora.
          </p>
        </div>
        <Link
          href="/pengajuan"
          className="flex items-center gap-2 rounded-lg border border-line bg-white px-4 py-2.5 text-sm font-semibold text-navy shadow-sm transition hover:bg-surface"
        >
          <ClipboardList className="h-4 w-4" aria-hidden="true" />
          Pengajuan Saya
        </Link>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
        <SubmitForm categories={categories} user={{ name: user.name, email: user.email }} />

        {/* Sidebar tips (desktop) */}
        <aside className="hidden lg:block">
          <div className="sticky top-24 space-y-4">
            <div className="rounded-2xl border border-line bg-white p-5">
              <h2 className="flex items-center gap-2 font-bold text-navy">
                <Info className="h-4 w-4 text-brand" aria-hidden="true" />
                Alur Setelah Submit
              </h2>
              <ol className="mt-4 space-y-4">
                {[
                  { title: "Produk terkirim", desc: "Status awal pengajuan Anda: Pending." },
                  { title: "Direview admin", desc: "Tim kami memeriksa kelengkapan & kualitas data (biasanya 1-3 hari)." },
                  { title: "Hasil di Pengajuan Saya", desc: "Disetujui (tayang), perlu revisi, atau ditolak beserta catatan." },
                ].map((s, i) => (
                  <li key={s.title} className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-navy text-xs font-bold text-white">
                      {i + 1}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-navy">{s.title}</p>
                      <p className="mt-0.5 text-xs leading-relaxed text-muted">{s.desc}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            <div className="rounded-2xl border border-line bg-white p-5">
              <h2 className="flex items-center gap-2 font-bold text-navy">
                <ShieldCheck className="h-4 w-4 text-green-600" aria-hidden="true" />
                Biar Cepat Disetujui
              </h2>
              <ul className="mt-4 space-y-2.5">
                {[
                  "Foto produk jernih, pencahayaan bagus (JPG/PNG, maks 5MB).",
                  "Deskripsi spesifik: apa produknya, keunggulannya, untuk siapa.",
                  "Nomor WhatsApp aktif - tim menghubungi lewat sana.",
                  "Lengkapi link website/video bila ada.",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-2 text-xs leading-relaxed text-muted">
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-600" aria-hidden="true" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
