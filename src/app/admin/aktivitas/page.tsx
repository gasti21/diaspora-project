import Link from "next/link";
import { Activity, ArrowRight, Info } from "lucide-react";
import { adminListActivity } from "@/lib/data";
import { getAdminUser } from "@/lib/auth";
import { StatusBadge } from "@/components/product/Badges";
import { ProductImage } from "@/components/product/ProductImage";
import AdminAccessDenied from "@/components/admin/AdminAccessDenied";
import { formatDate, timeAgo } from "@/lib/utils";

export const dynamic = "force-dynamic";

/**
 * Riwayat aktivitas kurasi: produk terakhir diubah (status, catatan review,
 * siapa pemiliknya) - membantu admin menelusuri keputusan yang sudah dibuat.
 */
export default async function AdminActivityPage() {
  // Guard page (bukan cuma layout) supaya riwayat kurasi tidak bocor.
  if (!(await getAdminUser())) return <AdminAccessDenied />;

  const items = await adminListActivity(20);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-navy">Aktivitas Kurasi</h1>
          <p className="mt-1 text-sm text-muted">
            20 perubahan terakhir pada produk - status review, catatan, dan waktunya.
          </p>
        </div>
        <Link
          href="/admin/produk"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted transition hover:text-navy"
        >
          Buka manajemen produk
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-white px-6 py-14 text-center">
          <Activity className="mx-auto h-9 w-9 text-muted" aria-hidden="true" />
          <h2 className="mt-4 text-lg font-bold">Belum ada aktivitas</h2>
          <p className="mt-1 text-sm text-muted">
            Aktivitas akan muncul setelah ada pengajuan atau aksi review produk.
          </p>
        </div>
      ) : (
        <ol className="relative space-y-3 before:absolute before:bottom-4 before:left-[26px] before:top-4 before:w-px before:bg-line">
          {items.map((p) => (
            <li key={p.id} className="relative flex gap-4">
              <span className="relative z-10 h-11 w-11 shrink-0 overflow-hidden rounded-xl border border-line bg-white">
                <ProductImage
                  src={p.images[0]}
                  alt={p.name}
                  categorySlug={p.categorySlug}
                  className="h-full w-full object-cover"
                />
              </span>
              <div className="min-w-0 flex-1 rounded-2xl border border-line bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-bold text-navy">{p.name}</p>
                  <StatusBadge status={p.status} />
                </div>
                <p className="mt-1 text-xs text-muted">
                  {p.ownerName} · {p.country}
                  {p.categoryName ? ` · ${p.categoryName}` : ""} · diperbarui{" "}
                  {timeAgo(p.updatedAt)} ({formatDate(p.updatedAt)})
                </p>
                {p.reviewNote && (
                  <p className="mt-2.5 rounded-lg bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-800">
                    <span className="font-bold">Catatan reviewer: </span>
                    {p.reviewNote}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ol>
      )}

      <p className="flex items-start gap-2 rounded-xl bg-surface px-4 py-3 text-xs leading-relaxed text-muted">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        MVP menyimpan satu status terakhir per produk - daftar ini merangkum
        perubahan terbaru, bukan log histori penuh.
      </p>
    </div>
  );
}
