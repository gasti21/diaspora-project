import { Activity, Info } from "lucide-react";
import { adminListAuditLog } from "@/lib/data";
import { getAdminUser } from "@/lib/auth";
import AdminAccessDenied from "@/components/admin/AdminAccessDenied";
import { formatDate, timeAgo } from "@/lib/utils";

export const dynamic = "force-dynamic";

const ACTION_META: Record<
  string,
  { label: string; verb: string; dot: string; chip: string }
> = {
  approve: { label: "Approve", verb: "menyetujui", dot: "bg-green-500", chip: "bg-green-50 text-green-700" },
  revision: { label: "Revisi", verb: "minta revisi", dot: "bg-orange-500", chip: "bg-orange-50 text-orange-700" },
  reject: { label: "Tolak", verb: "menolak", dot: "bg-red-500", chip: "bg-red-50 text-red-700" },
  reopen: { label: "Buka ulang", verb: "mengembalikan ke pending", dot: "bg-amber-400", chip: "bg-amber-50 text-amber-700" },
  delete: { label: "Hapus", verb: "menghapus", dot: "bg-brand", chip: "bg-red-50 text-red-700" },
  bulk_approve: { label: "Approve massal", verb: "menyetujui (massal)", dot: "bg-green-500", chip: "bg-green-50 text-green-700" },
  bulk_reject: { label: "Tolak massal", verb: "menolak (massal)", dot: "bg-red-500", chip: "bg-red-50 text-red-700" },
};

/**
 * Timeline audit kurasi: setiap keputusan admin tercatat permanen -
 * siapa, aksi apa, pada produk mana, catatannya, dan waktunya.
 */
export default async function AdminActivityPage() {
  if (!(await getAdminUser())) return <AdminAccessDenied />;

  const items = await adminListAuditLog(30);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-extrabold text-navy">Aktivitas Kurasi</h1>
        <p className="mt-1 text-sm text-muted">
          30 keputusan terakhir - siapa, aksi apa, pada produk mana, dan catatannya.
        </p>
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-white px-6 py-14 text-center">
          <Activity className="mx-auto h-9 w-9 text-muted" aria-hidden="true" />
          <h2 className="mt-4 text-lg font-bold">Belum ada aktivitas</h2>
          <p className="mt-1 text-sm text-muted">
            Setiap approve / revisi / tolak yang kamu lakukan akan tercatat di sini.
          </p>
        </div>
      ) : (
        <ol className="relative space-y-3 before:absolute before:bottom-4 before:left-[9px] before:top-4 before:w-px before:bg-line">
          {items.map((item) => {
            const meta = ACTION_META[item.action] ?? ACTION_META.approve;
            return (
              <li key={item.id} className="relative flex gap-4">
                <span
                  className={cnDot(meta.dot)}
                  aria-hidden="true"
                />
                <div className="min-w-0 flex-1 rounded-2xl border border-line bg-white p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${meta.chip}`}
                    >
                      {meta.label}
                    </span>
                    <p className="min-w-0 truncate text-sm font-bold text-navy">
                      {item.productName}
                    </p>
                  </div>
                  <p className="mt-1.5 text-xs text-muted">
                    <span className="font-semibold text-navy">{item.actorName}</span>{" "}
                    {meta.verb} produk ini - {timeAgo(item.createdAt)} ({formatDate(item.createdAt)})
                  </p>
                  {item.note && (
                    <p className="mt-2.5 rounded-lg bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-800">
                      <span className="font-bold">Catatan reviewer: </span>
                      {item.note}
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      )}

      <p className="flex items-start gap-2 rounded-xl bg-surface px-4 py-3 text-xs leading-relaxed text-muted">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        Log ini permanen dan tidak bisa diedit - berlaku sejak fitur audit diaktifkan.
      </p>
    </div>
  );
}

function cnDot(dot: string) {
  return `relative z-10 mt-1.5 h-[18px] w-[18px] shrink-0 rounded-full border-2 border-white shadow ${dot}`;
}
