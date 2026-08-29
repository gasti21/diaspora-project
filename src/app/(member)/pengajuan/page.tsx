import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowUpRight,
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
import { cn, formatDate } from "@/lib/utils";
import type { ProductStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  description:
    "Pantau status pengajuan produk Anda di KaryaDiaspora - pending, published, revisi, atau rejected.",
};

const FILTERS: { key: "all" | ProductStatus; label: string }[] = [
  { key: "all", label: "Semua" },
  { key: "pending", label: "Pending" },
  { key: "published", label: "Tayang" },
  { key: "revision", label: "Revisi" },
  { key: "rejected", label: "Ditolak" },
];

export default async function PengajuanPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const user = await getSessionUser();
  if (!user) return null; // guard sesi ada di layout (member)

  const [all, sp] = await Promise.all([listMySubmissions(user.id), searchParams]);
  const active = FILTERS.some((f) => f.key === sp.status) ? (sp.status as "all" | ProductStatus) : "all";
  const submissions = active === "all" ? all : all.filter((p) => p.status === active);

  const count = (s: ProductStatus) => all.filter((p) => p.status === s).length;
  const summary = [
    { label: "Total Pengajuan", value: all.length, icon: ClipboardList, cls: "bg-navy/10 text-navy" },
    { label: "Menunggu Review", value: count("pending"), icon: FileText, cls: "bg-amber-50 text-amber-600" },
    { label: "Sudah Tayang", value: count("published"), icon: CheckCircle2, cls: "bg-green-50 text-green-600" },
    { label: "Perlu Perhatian", value: count("revision") + count("rejected"), icon: Send, cls: "bg-red-50 text-red-600" },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold">Pengajuan Saya</h1>
          <p className="mt-2 text-muted">
            Pantau perkembangan semua produk yang Anda ajukan - dari submit sampai tayang.
          </p>
        </div>
        <Link
          href="/submit"
          className="flex items-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark"
        >
          <PackagePlus className="h-4 w-4" aria-hidden="true" />
          Ajukan Produk Baru
        </Link>
      </div>

      {/* Ringkasan */}
      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {summary.map((s) => (
          <div key={s.label} className="rounded-2xl border border-line bg-white p-4">
            <span className={cn("flex h-9 w-9 items-center justify-center rounded-lg", s.cls)}>
              <s.icon className="h-4.5 w-4.5" aria-hidden="true" />
            </span>
            <p className="mt-2.5 text-2xl font-extrabold text-navy">{s.value}</p>
            <p className="mt-0.5 text-xs font-medium text-muted">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filter */}
      {all.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <Link
              key={f.key}
              href={f.key === "all" ? "/pengajuan" : `/pengajuan?status=${f.key}`}
              className={cn(
                "rounded-full px-3.5 py-1.5 text-xs font-semibold transition",
                active === f.key
                  ? "bg-navy text-white"
                  : "border border-line bg-white text-navy hover:bg-surface"
              )}
            >
              {f.label}
            </Link>
          ))}
        </div>
      )}

      {/* Daftar */}
      {all.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-line bg-white px-6 py-16 text-center">
          <ClipboardList className="mx-auto h-10 w-10 text-muted/50" aria-hidden="true" />
          <p className="mt-4 font-semibold">Belum ada pengajuan</p>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted">
            Produk pertama Anda menanti - bagikan karya Anda ke seluruh diaspora.
          </p>
          <Link
            href="/submit"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark"
          >
            <PackagePlus className="h-4 w-4" aria-hidden="true" />
            Submit Produk
          </Link>
        </div>
      ) : (
        <ul className="mt-6 space-y-4">
          {submissions.map((p) => (
            <li key={p.id} className="rounded-2xl border border-line bg-white p-4 shadow-sm transition hover:shadow-md sm:p-5">
              <div className="flex flex-col gap-4 sm:flex-row">
                <div className="h-24 w-full shrink-0 overflow-hidden rounded-xl sm:h-24 sm:w-24">
                  <ProductImage
                    src={p.images?.[0] ?? null}
                    alt={p.name}
                    categorySlug={p.categorySlug}
                    className="h-full w-full"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={p.status} />
                    {p.categoryName && (
                      <span className="text-xs font-medium text-muted">{p.categoryName}</span>
                    )}
                  </div>
                  <h2 className="mt-1.5 font-bold">{p.name}</h2>
                  <p className="mt-0.5 text-xs text-muted">
                    Diajukan {formatDate(p.createdAt)}
                    {[p.city, p.country].filter(Boolean).length > 0 &&
                      ` · ${[p.city, p.country].filter(Boolean).join(", ")}`}
                  </p>

                  {/* Alur status */}
                  <TimelineSteps status={p.status} />

                  {p.reviewNote && (
                    <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-800">
                      <span className="font-bold">Catatan reviewer: </span>
                      {p.reviewNote}
                    </p>
                  )}

                  <div className="mt-3 flex flex-wrap gap-3">
                    {p.status === "published" ? (
                      <Link
                        href={`/produk/${p.slug}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-navy transition hover:text-brand"
                      >
                        Lihat halaman publik
                        <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                      </Link>
                    ) : p.status !== "pending" ? (
                      <Link
                        href="/submit"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-navy transition hover:text-brand"
                      >
                        <PackagePlus className="h-3.5 w-3.5" aria-hidden="true" />
                        Perbaiki & ajukan ulang
                      </Link>
                    ) : null}
                  </div>
                </div>
              </div>
            </li>
          ))}

          {submissions.length === 0 && (
            <li className="rounded-2xl border border-dashed border-line bg-white px-6 py-12 text-center text-sm text-muted">
              Tidak ada pengajuan dengan status ini.
            </li>
          )}
        </ul>
      )}
    </div>
  );
}

/** Alur ringkas: Diajukan -> Review -> Hasil. */
function TimelineSteps({ status }: { status: ProductStatus }) {
  const steps = [
    { label: "Diajukan", done: true },
    {
      label: "Direview tim",
      done: status !== "pending",
      active: status === "pending",
    },
    {
      label:
        status === "published"
          ? "Tayang di katalog"
          : status === "revision"
            ? "Perlu revisi"
            : status === "rejected"
              ? "Ditolak"
              : "Menunggu hasil",
      done: status === "published",
      active: status !== "published",
      last: true,
    },
  ] as { label: string; done?: boolean; active?: boolean; last?: boolean }[];

  return (
    <ol className="mt-3 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[11px] font-medium">
      {steps.map((s, i) => (
        <li key={i} className="flex items-center gap-1.5">
          <span
            className={cn(
              "flex h-4 w-4 items-center justify-center rounded-full text-[8px] font-bold text-white",
              s.done
                ? "bg-green-500"
                : s.active
                  ? "bg-amber-400"
                  : "bg-gray-300"
            )}
          >
            {s.done ? "✓" : i + 1}
          </span>
          <span className={s.done ? "text-navy" : "text-muted"}>{s.label}</span>
          {!s.last && <span className="text-muted/50">·</span>}
        </li>
      ))}
    </ol>
  );
}
