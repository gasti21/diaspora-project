import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  FileText,
  Heart,
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

/** Kartu ringkasan status pengajuan milik user yang sedang login. */
export default async function MemberDashboardPage() {
  const user = await getSessionUser();
  const submissions = user ? await listMySubmissions(user.id) : [];

  const count = (s: ProductStatus) => submissions.filter((p) => p.status === s).length;
  const attention = count("revision") + count("rejected");
  const summary = [
    { label: "Total Pengajuan", value: submissions.length, icon: ClipboardList, chip: "bg-navy/10 text-navy", href: "/pengajuan" },
    { label: "Menunggu Review", value: count("pending"), icon: FileText, chip: "bg-amber-50 text-amber-600", href: "/pengajuan?status=pending" },
    { label: "Sudah Tayang", value: count("published"), icon: CheckCircle2, chip: "bg-green-50 text-green-600", href: "/pengajuan?status=published" },
    { label: "Perlu Perhatian", value: attention, icon: Send, chip: "bg-red-50 text-red-600", href: "/pengajuan" },
  ];

  const recent = submissions.slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-navy">Halo, {user?.name} 👋</h1>
          <p className="mt-1 text-sm text-muted">
            Ini ringkasan aktivitas pengajuan produk Anda di KaryaDiaspora.
          </p>
        </div>
        <Link
          href="/submit"
          className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-brand-dark"
        >
          <PackagePlus className="h-4 w-4" aria-hidden="true" />
          Ajukan Produk Baru
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

      <div className="grid gap-6 xl:grid-cols-3">
        {/* Pengajuan terbaru */}
        <section className="rounded-2xl border border-line bg-white xl:col-span-2">
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <h2 className="font-bold text-navy">Pengajuan Terbaru</h2>
            <Link
              href="/pengajuan"
              className="flex items-center gap-1 text-xs font-semibold text-muted transition hover:text-navy"
            >
              Lihat semua <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>

          {recent.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <ClipboardList className="mx-auto h-9 w-9 text-muted" aria-hidden="true" />
              <h3 className="mt-3 text-sm font-bold text-navy">Belum ada pengajuan</h3>
              <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-muted">
                Karya Anda layak dikenal dunia. Ajukan produk pertama Anda sekarang -
                tim kurasi kami akan meninjaunya dalam 1-3 hari.
              </p>
              <Link
                href="/submit"
                className="mt-5 inline-flex items-center gap-2 rounded-lg bg-navy px-4 py-2.5 text-xs font-bold text-white transition hover:bg-navy-dark"
              >
                <PackagePlus className="h-3.5 w-3.5" aria-hidden="true" />
                Submit Produk
              </Link>
            </div>
          ) : (
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
          )}
        </section>

        <div className="space-y-6">
          {/* Panel perlu perhatian */}
          <section
            className={cn(
              "rounded-2xl border bg-white p-5",
              attention > 0 ? "border-amber-200" : "border-line"
            )}
          >
            <h2 className="font-bold text-navy">Status Pengajuan</h2>
            {attention > 0 ? (
              <p className="mt-3 text-sm leading-relaxed text-muted">
                Ada <span className="font-bold text-amber-600">{attention} pengajuan</span>{" "}
                yang perlu revisi atau ditolak. Buka Pengajuan Saya untuk membaca
                catatan reviewer dan mengajukan ulang.
              </p>
            ) : (
              <p className="mt-3 flex items-start gap-2 text-sm leading-relaxed text-green-700">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                Semua pengajuan Anda diproses dengan lancar. Terima kasih!
              </p>
            )}
            <Link
              href="/pengajuan"
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-navy px-4 py-2.5 text-xs font-bold text-white transition hover:bg-navy-dark"
            >
              Buka Pengajuan Saya <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </section>

          {/* Aksi cepat */}
          <section className="rounded-2xl border border-line bg-white p-5">
            <h2 className="font-bold text-navy">Aksi Cepat</h2>
            <div className="mt-3 space-y-2 text-sm">
              <Link
                href="/submit"
                className="flex items-center justify-between rounded-lg border border-line px-4 py-3 font-medium text-navy transition hover:bg-surface"
              >
                Submit produk baru
                <PackagePlus className="h-3.5 w-3.5 text-muted" aria-hidden="true" />
              </Link>
              <Link
                href="/favorit"
                className="flex items-center justify-between rounded-lg border border-line px-4 py-3 font-medium text-navy transition hover:bg-surface"
              >
                Lihat produk favorit
                <Heart className="h-3.5 w-3.5 text-muted" aria-hidden="true" />
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
