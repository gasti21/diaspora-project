import Link from "next/link";
import {
  ArrowRight,
  TrendingUp,
  CheckCircle2,
  CircleX,
  FileText,
  Hourglass,
  PenLine,
  Users,
} from "lucide-react";
import { getAdminUser } from "@/lib/auth";
import { adminGetOverview, adminGetTrends } from "@/lib/data";
import { RecentActivity } from "@/components/admin/RecentActivity";
import AdminAccessDenied from "@/components/admin/AdminAccessDenied";
import { cn, daysSince } from "@/lib/utils";
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

/** Segmen grafik distribusi status (bar horizontal bertumpuk, pure CSS). */
const DISTRIBUTION: { key: "pending" | "published" | "revision" | "rejected"; label: string; color: string; dot: string }[] = [
  { key: "published", label: "Tayang", color: "bg-green-500", dot: "bg-green-500" },
  { key: "pending", label: "Pending", color: "bg-amber-400", dot: "bg-amber-400" },
  { key: "revision", label: "Revisi", color: "bg-orange-500", dot: "bg-orange-500" },
  { key: "rejected", label: "Ditolak", color: "bg-red-500", dot: "bg-red-500" },
];

const DAYS_ID = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const MONTHS_ID = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

export default async function AdminOverviewPage() {
  // Guard di level page (layout & page render paralel di Next.js):
  // cek admin SEBELUM fetch agar data overview tidak ter-stream ke tamu.
  const admin = await getAdminUser();
  if (!admin) return <AdminAccessDenied />;

  const [overview, trends] = await Promise.all([adminGetOverview(), adminGetTrends()]);
  const { stats, recent, oldestPending } = overview;

  const now = new Date();
  const today = `${DAYS_ID[now.getDay()]}, ${now.getDate()} ${MONTHS_ID[now.getMonth()]} ${now.getFullYear()}`;
  const totalProducts = stats.pending + stats.published + stats.revision + stats.rejected;

  return (
    <div className="space-y-6">
      {/* Sapaan + tanggal */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-navy">Halo, {admin.name} 👋</h1>
          <p className="mt-1 text-sm text-muted">{today} - ringkasan aktivitas KaryaDiaspora.</p>
        </div>
        <Link
          href="/admin/produk?status=pending"
          className="inline-flex items-center gap-2 rounded-lg bg-navy px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-navy-dark"
        >
          {stats.pending > 0 ? `Review ${stats.pending} pengajuan` : "Cek antrean review"}
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </div>

      {/* Kartu statistik */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        {CARDS.map((c) => (
          <Link
            key={c.key}
            href={c.href}
            className="group rounded-2xl border border-line bg-white p-4 transition hover:border-navy/30 hover:shadow-md"
          >
            <div className="flex items-start justify-between">
              <span className={cn("flex h-10 w-10 items-center justify-center rounded-xl", c.chip)}>
                <c.icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <ArrowRight
                className="h-4 w-4 -translate-x-1 text-muted/40 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100"
                aria-hidden="true"
              />
            </div>
            <p className={cn("mt-3 text-2xl font-extrabold", c.value)}>{stats[c.key]}</p>
            <p className="mt-0.5 text-xs font-medium text-muted">{c.label}</p>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        {/* Pengajuan terbaru + aksi cepat inline */}
        <section className="rounded-2xl border border-line bg-white xl:col-span-2">
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <h2 className="font-bold text-navy">Pengajuan Terbaru</h2>
            <span className="rounded-full bg-surface px-2.5 py-1 text-xs font-semibold text-muted">{recent.filter((p) => p.status === "pending").length} pending</span>
          </div>
          <RecentActivity recent={recent} />
        </section>

        <div className="space-y-6">
          {/* Distribusi status seluruh produk */}
          <section className="rounded-2xl border border-line bg-white p-5">
            <div className="flex items-baseline justify-between">
              <h2 className="font-bold text-navy">Distribusi Status</h2>
              <p className="text-xs text-muted">{totalProducts} produk</p>
            </div>
            <div className="mt-4 flex h-3 w-full overflow-hidden rounded-full bg-surface">
              {DISTRIBUTION.map((d) =>
                stats[d.key] > 0 ? (
                  <span
                    key={d.key}
                    className={d.color}
                    style={{ width: `${(stats[d.key] / Math.max(totalProducts, 1)) * 100}%` }}
                    title={`${d.label}: ${stats[d.key]}`}
                  />
                ) : null
              )}
            </div>
            <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2">
              {DISTRIBUTION.map((d) => (
                <li key={d.key} className="flex items-center gap-2 text-xs font-medium text-muted">
                  <span className={cn("h-2 w-2 rounded-full", d.dot)} aria-hidden="true" />
                  {d.label}
                  <span className="ml-auto font-bold text-navy">{stats[d.key]}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Produk pending paling lama */}
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

          {/* Tren pengajuan 6 minggu terakhir */}
          <section className="rounded-2xl border bg-white p-5">
            <h2 className="flex items-center gap-2 font-bold text-navy">
              <TrendingUp className="h-4 w-4 text-brand" aria-hidden="true" />
              Tren Pengajuan (6 Minggu)
            </h2>
            <div className="mt-4 flex h-28 items-end gap-2">
              {trends.weekly.map((w) => {
                const max = Math.max(...trends.weekly.map((x) => x.count), 1);
                return (
                  <div key={w.label} className="flex flex-1 flex-col items-center gap-1">
                    <span className="text-[10px] font-bold text-navy">{w.count}</span>
                    <div
                      className={cn(
                        "w-full rounded-t-md transition-all",
                        w.count > 0 ? "bg-brand" : "bg-line"
                      )}
                      style={{ height: `${Math.max(4, (w.count / max) * 72)}px` }}
                      title={`${w.count} pengajuan`}
                    />
                    <span className="text-[10px] text-muted">{w.label}</span>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 grid gap-4 border-t border-line pt-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-muted">Negara Teratas</p>
                {trends.topCountries.length === 0 ? (
                  <p className="mt-2 text-xs text-muted/70">Belum ada data.</p>
                ) : (
                  <ul className="mt-2 space-y-1.5">
                    {trends.topCountries.map((c) => (
                      <li key={c.country} className="flex items-center justify-between text-sm">
                        <span className="text-navy">{c.country}</span>
                        <span className="rounded-full bg-surface px-2 py-0.5 text-xs font-bold text-muted">{c.count}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-muted">Kategori Teratas</p>
                {trends.topCategories.length === 0 ? (
                  <p className="mt-2 text-xs text-muted/70">Belum ada data.</p>
                ) : (
                  <ul className="mt-2 space-y-1.5">
                    {trends.topCategories.map((c) => (
                      <li key={c.name} className="flex items-center justify-between text-sm">
                        <span className="text-navy">{c.name}</span>
                        <span className="rounded-full bg-surface px-2 py-0.5 text-xs font-bold text-muted">{c.count}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </section>

          {/* Aksi cepat */}
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
              <Link
                href="/admin/aktivitas"
                className="flex items-center justify-between rounded-lg border border-line px-4 py-3 font-medium text-navy transition hover:bg-surface"
              >
                Riwayat aktivitas kurasi
                <ArrowRight className="h-3.5 w-3.5 text-muted" aria-hidden="true" />
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
