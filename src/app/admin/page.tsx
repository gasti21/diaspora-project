import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  CircleX,
  FileText,
  Hourglass,
  PenLine,
  Users,
} from "lucide-react";
import { getAdminUser } from "@/lib/auth";
import { adminGetOverview } from "@/lib/data";
import { StatusBadge } from "@/components/product/Badges";
import { ProductImage } from "@/components/product/ProductImage";
import { cn, daysSince, timeAgo } from "@/lib/utils";
import type { AdminStats } from "@/lib/types";

export const dynamic = "force-dynamic";

/** Kartu statistik yang bisa diklik - memfilter halaman terkait. */
const CARDS: {
  key: keyof AdminStats;
  label: string;
  href: string;
  icon: typeof FileText;
  chip: string;
  value: string;
}[] = [
  { key: "pending", label: "Menunggu Review", href: "/admin/produk?status=pending", icon: FileText, chip: "bg-amber-50 text-amber-600", value: "text-amber-600" },
  { key: "published", label: "Sudah Tayang", href: "/admin/produk?status=published", icon: CheckCircle2, chip: "bg-green-50 text-green-600", value: "text-green-600" },
  { key: "revision", label: "Perlu Revisi", href: "/admin/produk?status=revision", icon: PenLine, chip: "bg-orange-50 text-orange-500", value: "text-orange-500" },
  { key: "rejected", label: "Ditolak", href: "/admin/produk?status=rejected", icon: CircleX, chip: "bg-red-50 text-red-600", value: "text-red-600" },
  { key: "users", label: "Pengguna Terdaftar", href: "/admin/pengguna", icon: Users, chip: "bg-navy/10 text-navy", value: "text-navy" },
];

export default async function AdminOverviewPage() {
  const [admin, overview] = await Promise.all([
    getAdminUser(),
    adminGetOverview(),
  ]);
  const { stats, recent, oldestPending } = overview;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-navy">Halo, {admin?.name} 👋</h1>
        <p className="mt-1 text-sm text-muted">Ringkasan aktivitas KaryaDiaspora hari ini.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        {CARDS.map((c) => (
          <Link
            key={c.key}
            href={c.href}
            className="group rounded-2xl border border-line bg-white p-4 transition hover:border-navy/30 hover:shadow-md"
          >
            <span className={cn("flex h-10 w-10 items-center justify-center rounded-xl", c.chip)}>
              <c.icon className="h-5 w-5" aria-hidden="true" />
            </span>
            <p className={cn("mt-3 text-2xl font-extrabold", c.value)}>{stats[c.key]}</p>
            <p className="mt-0.5 text-xs font-medium text-muted">{c.label}</p>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <section className="rounded-2xl border border-line bg-white xl:col-span-2">
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <h2 className="font-bold text-navy">Pengajuan Terbaru</h2>
            <Link
              href="/admin/produk"
              className="flex items-center gap-1 text-xs font-semibold text-muted transition hover:text-navy"
            >
              Lihat semua <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>
          <ul className="divide-y divide-line/70">
            {recent.length === 0 && (
              <li className="px-5 py-10 text-center text-sm text-muted">
                Belum ada pengajuan produk masuk.
              </li>
            )}
            {recent.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/admin/produk?q=${encodeURIComponent(p.name)}`}
                  className="flex items-center gap-4 px-5 py-3.5 transition hover:bg-surface/60"
                >
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg">
                    <ProductImage
                      src={p.images?.[0] ?? null}
                      alt={p.name}
                      categorySlug={p.categorySlug}
                      className="h-full w-full"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-navy">{p.name}</p>
                    <p className="mt-0.5 truncate text-xs text-muted">
                      {p.ownerName} · {p.country}
                      {p.categoryName ? ` · ${p.categoryName}` : ""}
                    </p>
                  </div>
                  <div className="hidden shrink-0 sm:block">
                    <StatusBadge status={p.status} />
                  </div>
                  <p className="w-20 shrink-0 text-right text-xs text-muted">
                    {timeAgo(p.createdAt)}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <div className="space-y-6">
          <section
            className={cn(
              "rounded-2xl border bg-white p-5",
              oldestPending ? "border-amber-200" : "border-line"
            )}
          >
            <h2 className="flex items-center gap-2 font-bold text-navy">
              <Hourglass className="h-4 w-4 text-amber-500" aria-hidden="true" />
              Butuh Perhatian
            </h2>
            {oldestPending ? (
              <>
                <p className="mt-3 text-sm leading-relaxed text-muted">
                  <span className="font-semibold text-navy">{oldestPending.name}</span> dari{" "}
                  {oldestPending.ownerName} sudah menunggu{" "}
                  <span className="font-bold text-amber-600">
                    {daysSince(oldestPending.createdAt)} hari
                  </span>{" "}
                  tanpa review.
                </p>
                <Link
                  href="/admin/produk?status=pending"
                  className="mt-4 inline-flex items-center gap-2 rounded-lg bg-navy px-4 py-2.5 text-xs font-bold text-white transition hover:bg-navy-dark"
                >
                  Review sekarang <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              </>
            ) : (
              <p className="mt-3 flex items-start gap-2 text-sm leading-relaxed text-green-700">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                Semua pengajuan sudah diproses. Kerja bagus!
              </p>
            )}
          </section>

          <section className="rounded-2xl border border-line bg-white p-5">
            <h2 className="font-bold text-navy">Aksi Cepat</h2>
            <div className="mt-3 space-y-2 text-sm">
              <Link
                href="/admin/produk?status=pending"
                className="flex items-center justify-between rounded-lg border border-line px-4 py-3 font-medium text-navy transition hover:bg-surface"
              >
                Review pengajuan
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-700">
                  {stats.pending}
                </span>
              </Link>
              <Link
                href="/admin/pengguna"
                className="flex items-center justify-between rounded-lg border border-line px-4 py-3 font-medium text-navy transition hover:bg-surface"
              >
                Kelola pengguna & admin
                <span className="rounded-full bg-navy/10 px-2 py-0.5 text-xs font-bold text-navy">
                  {stats.users}
                </span>
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
