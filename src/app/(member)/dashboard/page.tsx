import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  FileText,
  PackagePlus,
  Send,
} from "lucide-react";
import { getSessionUser } from "@/lib/auth";
import { listMySubmissions } from "@/lib/data";
import { StatusBadge } from "@/components/product/Badges";
import { ProductImage } from "@/components/product/ProductImage";
import { cn, formatDate, timeAgo } from "@/lib/utils";
import type { ProductStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  description: "Dashboard member KaryaDiaspora - ringkasan pengajuan produk Anda.",
};

/** Alur singkat yang ditampilkan di onboarding hero untuk user baru. */
const ONBOARDING_STEPS = [
  { step: "1", title: "Lengkapi data", desc: "Isi info produk & unggah foto" },
  { step: "2", title: "Direview tim", desc: "Kurasi 1-3 hari kerja" },
  { step: "3", title: "Tayang!", desc: "Produk tampil di katalog" },
];

/** Kartu dashboard member: ringkasan pengajuan, aktivitas terbaru, dan onboarding user baru. */
export default async function MemberDashboardPage() {
  const user = await getSessionUser();
  const submissions = user ? await listMySubmissions(user.id) : [];

  const count = (s: ProductStatus) => submissions.filter((p) => p.status === s).length;
  const attention = count("revision") + count("rejected");
  const needsAttention = attention > 0;

  const summary = [
    { label: "Total Pengajuan", value: submissions.length, icon: ClipboardList, chip: "bg-navy/10 text-navy", href: "/pengajuan" },
    { label: "Menunggu Review", value: count("pending"), icon: FileText, chip: "bg-amber-50 text-amber-600", href: "/pengajuan?status=pending" },
    { label: "Sudah Tayang", value: count("published"), icon: CheckCircle2, chip: "bg-green-50 text-green-600", href: "/pengajuan?status=published" },
    { label: "Perlu Perhatian", value: attention, icon: Send, chip: "bg-red-50 text-red-600", href: "/pengajuan" },
  ];

  const recent = submissions.slice(0, 5);

  // User baru (belum pernah submit) - tampilkan onboarding hero, bukan
  // dashboard lengkap: angka 0-0-0 dan panel status tidak relevan untuk mereka.
  if (submissions.length === 0) {
    return (
      <div className="rounded-2xl border border-line bg-white px-6 py-16 text-center sm:px-10">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-navy/10 text-navy">
          <ClipboardList className="h-7 w-7" aria-hidden="true" />
        </span>
        <h1 className="mt-5 text-2xl font-extrabold text-navy">
          Selamat datang, {user?.name}! 🎉
        </h1>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted">
          Satu langkah menuju produk Anda tayang di katalog diaspora.
          Isi formulir pengajuan, lalu tim kurasi kami yang urus sisanya.
        </p>

        {/* Alur singkat sampai tayang */}
        <ol className="mx-auto mt-8 grid max-w-xl gap-3 text-left sm:grid-cols-3">
          {ONBOARDING_STEPS.map((s) => (
            <li
              key={s.step}
              className="flex items-start gap-3 rounded-xl border border-line bg-surface/60 p-3.5"
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-bold text-white">
                {s.step}
              </span>
              <div>
                <p className="text-sm font-bold text-navy">{s.title}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-muted">{s.desc}</p>
              </div>
            </li>
          ))}
        </ol>

        <Link
          href="/submit"
          className="mt-8 inline-flex items-center gap-2 rounded-lg bg-brand px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-brand-dark"
        >
          <PackagePlus className="h-4.5 w-4.5" aria-hidden="true" />
          Ajukan Produk Pertama Anda
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-navy">Halo, {user?.name} 👋</h1>
          <p className="mt-1 text-sm text-muted">
            Ini ringkasan aktivitas pengajuan produk Anda di KaryaDiaspora.
          </p>
        </div>
        {/* Pintu submit khusus layar kecil - di desktop cukup CTA sidebar */}
        <Link
          href="/submit"
          className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-brand-dark lg:hidden"
        >
          <PackagePlus className="h-4 w-4" aria-hidden="true" />
          Submit Produk
        </Link>
      </div>

      {/* Kartu ringkasan */}
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {summary.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="group rounded-2xl border border-line bg-white p-4 transition hover:border-navy/30 hover:shadow-md"
          >
            <span className={cn("flex h-10 w-10 items-center justify-center rounded-xl", s.chip)}>
              <s.icon className="h-5 w-5" aria-hidden="true" />
            </span>
            <p className={cn("mt-3 text-2xl font-extrabold", s.value > 0 ? "text-navy" : "text-muted")}>
              {s.value}
            </p>
            <p className="mt-0.5 text-xs font-medium text-muted">{s.label}</p>
          </Link>
        ))}
      </div>

      <div className={cn("grid gap-6", needsAttention && "xl:grid-cols-3")}>
        {/* Pengajuan terbaru */}
        <section
          className={cn(
            "rounded-2xl border border-line bg-white",
            needsAttention && "xl:col-span-2"
          )}
        >
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <h2 className="font-bold text-navy">Pengajuan Terbaru</h2>
            <Link
              href="/pengajuan"
              className="flex items-center gap-1 text-xs font-semibold text-muted transition hover:text-navy"
            >
              Lihat semua <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>

          <ul className="divide-y divide-line/70">
            {recent.map((p) => (
              <li key={p.id}>
                <Link
                  href={p.status === "published" ? `/produk/${p.slug}` : "/pengajuan"}
                  className="flex items-center gap-3 px-5 py-3.5 transition hover:bg-surface/60"
                >
                  <span className="h-11 w-11 shrink-0 overflow-hidden rounded-xl border border-line bg-surface">
                    <ProductImage
                      src={p.images[0]}
                      alt={p.name}
                      categorySlug={p.categorySlug}
                      className="h-full w-full object-cover"
                    />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-navy">{p.name}</p>
                    <p className="mt-0.5 truncate text-xs text-muted">
                      Diajukan {timeAgo(p.createdAt)} · {formatDate(p.createdAt)}
                    </p>
                  </div>
                  <StatusBadge status={p.status} />
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {/* Panel status - hanya muncul saat ada pengajuan yang perlu
            revisi/ditolak. Saat aman, panel tidak dirender supaya dashboard
            tidak menampilkan pesan yang tidak relevan. */}
        {needsAttention && (
          <section className="rounded-2xl border border-amber-200 bg-white p-5">
            <h2 className="font-bold text-navy">Status Pengajuan</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Ada <span className="font-bold text-amber-600">{attention} pengajuan</span>{" "}
              yang perlu revisi atau ditolak. Buka Pengajuan Saya untuk membaca
              catatan reviewer dan mengajukan ulang.
            </p>
            <Link
              href="/pengajuan"
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-navy px-4 py-2.5 text-xs font-bold text-white transition hover:bg-navy-dark"
            >
              Buka Pengajuan Saya <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </section>
        )}
      </div>
    </div>
  );
}
