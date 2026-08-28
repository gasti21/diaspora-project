"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Download, Inbox, Search, SquarePen, X } from "lucide-react";
import { ProductDrawer } from "./ProductDrawer";
import { STATS_EVENT } from "./admin-nav";
import { useToast } from "@/components/toast/ToastProvider";
import { StatusBadge } from "@/components/product/Badges";
import { ProductImage } from "@/components/product/ProductImage";
import { cn, daysSince, formatDate, timeAgo } from "@/lib/utils";
import type { Paginated, Product, ProductStatus } from "@/lib/types";

const STATUS_FILTERS = [
  { key: "all", label: "Semua" },
  { key: "pending", label: "Pending" },
  { key: "published", label: "Published" },
  { key: "revision", label: "Revisi" },
  { key: "rejected", label: "Ditolak" },
] as const;

type StatusFilter = (typeof STATUS_FILTERS)[number]["key"];

interface Props {
  initialStatus: string;
  initialQ: string;
  initialPage: number;
}

/** Tabel manajemen produk admin + filter status + pencarian + aksi review. */
export function ProductsView({ initialStatus, initialQ, initialPage }: Props) {
  const router = useRouter();
  const toast = useToast();
  const firstRun = useRef(true);

  const valid = STATUS_FILTERS.some((s) => s.key === initialStatus);
  const [status, setStatus] = useState<StatusFilter>(valid ? (initialStatus as StatusFilter) : "all");
  const [qInput, setQInput] = useState(initialQ);
  const [q, setQ] = useState(initialQ);
  const [page, setPage] = useState(initialPage);
  const [list, setList] = useState<Paginated<Product> | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Product | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  // debounce pencarian -> mulai lagi dari halaman 1
  useEffect(() => {
    if (firstRun.current) return; // jangan reset halaman dari URL saat mount
    const t = setTimeout(() => {
      setQ(qInput.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [qInput]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ halaman: String(page) });
      if (status !== "all") params.set("status", status);
      if (q) params.set("q", q);
      const res = await fetch(`/api/admin/products?${params}`);
      if (res.ok) {
        setList(await res.json());
      } else {
        toast.error("Gagal memuat data produk.");
      }
    } catch {
      toast.error("Gagal memuat data produk.");
    }
    setLoading(false);
  }, [status, q, page, toast]);

  useEffect(() => {
    load();
  }, [load]);

  // simpan filter di URL supaya bisa di-share / di-back
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    const params = new URLSearchParams();
    if (status !== "all") params.set("status", status);
    if (q) params.set("q", q);
    if (page > 1) params.set("halaman", String(page));
    const qs = params.toString();
    router.replace(qs ? `/admin/produk?${qs}` : "/admin/produk", { scroll: false });
  }, [status, q, page, router]);

  /** Aksi review (quick approve di tabel maupun lewat drawer). */
  const act = useCallback(
    async (product: Product, next: ProductStatus, reviewNote?: string) => {
      setBusyId(product.id);
      try {
        const res = await fetch(`/api/admin/products/${product.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: next, reviewNote }),
        });
        const json = await res.json();
        if (!res.ok) {
          toast.error(json.error ?? "Gagal memperbarui status.");
          return false;
        }
        toast.success(
          next === "published"
            ? `"${product.name}" disetujui dan langsung tayang.`
            : `"${product.name}" dipindah ke status ${next}.`
        );
        window.dispatchEvent(new Event(STATS_EVENT)); // refresh badge sidebar
        setSelected((prev) => (prev?.id === product.id ? { ...prev, status: next } : prev));
        await load();
        return true;
      } catch {
        toast.error("Gagal memperbarui status. Coba lagi.");
        return false;
      } finally {
        setBusyId(null);
      }
    },
    [load, toast]
  );

  /** Unduh daftar produk halaman ini sebagai CSV. */
  function exportCsv() {
    if (!list?.data.length) return;
    const rows: (string | number)[][] = [
      ["Nama", "Pemilik", "Email", "Kategori", "Negara", "Status", "Diajukan", "Catatan Review"],
      ...list.data.map((p) => [
        p.name,
        p.ownerName,
        p.ownerEmail,
        p.categoryName ?? "",
        p.country,
        p.status,
        formatDate(p.createdAt),
        p.reviewNote ?? "",
      ]),
    ];
    const csv = rows
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `produk-karyadiaspora-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.info("CSV produk berhasil diunduh.");
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s.key}
              onClick={() => {
                setStatus(s.key);
                setPage(1);
              }}
              className={cn(
                "rounded-full px-3.5 py-1.5 text-xs font-semibold transition",
                status === s.key
                  ? "bg-navy text-white"
                  : "border border-line bg-white text-navy hover:bg-surface"
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <div className="relative flex-1 lg:w-72">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
              aria-hidden="true"
            />
            <input
              value={qInput}
              onChange={(e) => setQInput(e.target.value)}
              placeholder="Cari produk atau pemilik…"
              className="h-10 w-full rounded-lg border border-line bg-white pl-9 pr-3 text-sm outline-none transition focus:border-navy"
            />
          </div>
          <button
            onClick={exportCsv}
            disabled={!list?.data.length}
            title="Unduh daftar halaman ini sebagai CSV"
            className="flex h-10 shrink-0 items-center gap-2 rounded-lg border border-line bg-white px-3 text-xs font-semibold text-navy transition hover:bg-surface disabled:opacity-50"
          >
            <Download className="h-4 w-4" aria-hidden="true" /> CSV
          </button>
        </div>
      </div>

      {/* Tabel */}
      <div className="overflow-hidden rounded-2xl border border-line bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="border-b border-line bg-surface/60 text-xs uppercase tracking-wide text-muted">
                <th className="px-4 py-3 font-semibold">Produk</th>
                <th className="px-4 py-3 font-semibold">Kategori</th>
                <th className="px-4 py-3 font-semibold">Diajukan</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 text-right font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <>
                  {[0, 1, 2, 3].map((i) => (
                    <tr key={i} className="border-b border-line/70">
                      {[0, 1, 2, 3, 4].map((j) => (
                        <td key={j} className="px-4 py-4">
                          <div className="h-4 animate-pulse rounded bg-line" />
                        </td>
                      ))}
                    </tr>
                  ))}
                </>
              )}

              {!loading && list?.data.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-14 text-center">
                    <Inbox className="mx-auto h-9 w-9 text-muted/40" aria-hidden="true" />
                    <p className="mt-3 text-sm font-semibold text-navy">
                      Tidak ada produk pada filter ini
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      Coba ubah kata kunci pencarian atau pilih status lain.
                    </p>
                  </td>
                </tr>
              )}

              {!loading &&
                list?.data.map((p) => {
                  const age = daysSince(p.createdAt);
                  return (
                    <tr
                      key={p.id}
                      onClick={() => setSelected(p)}
                      className={cn(
                        "cursor-pointer border-b border-line/70 transition last:border-0 hover:bg-surface/60",
                        selected?.id === p.id && "bg-blue-50/50"
                      )}
                    >
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="h-11 w-11 shrink-0 overflow-hidden rounded-lg">
                            <ProductImage
                              src={p.images?.[0] ?? null}
                              alt={p.name}
                              categorySlug={p.categorySlug}
                              className="h-full w-full"
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="max-w-[220px] truncate font-semibold text-navy">{p.name}</p>
                            <p className="max-w-[220px] truncate text-xs text-muted">
                              {p.ownerName} · {p.country}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-muted">{p.categoryName ?? "-"}</td>
                      <td className="px-4 py-3.5">
                        <p className="text-navy">{formatDate(p.createdAt)}</p>
                        <p className="mt-0.5 text-xs text-muted">
                          {p.status === "pending" && age >= 3 ? (
                            <span className="font-bold text-amber-600">{age} hari menunggu</span>
                          ) : (
                            timeAgo(p.createdAt)
                          )}
                        </p>
                      </td>
                      <td className="px-4 py-3.5">
                        <StatusBadge status={p.status} />
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex justify-end gap-1.5">
                          <RowAction
                            title="Approve"
                            busy={busyId === p.id}
                            className="bg-green-100 text-green-600 hover:bg-green-200"
                            onClick={() => act(p, "published")}
                          >
                            <Check className="h-4 w-4" aria-hidden="true" />
                          </RowAction>
                          <RowAction
                            title="Minta revisi (isi catatan)"
                            busy={busyId === p.id}
                            className="bg-orange-100 text-orange-600 hover:bg-orange-200"
                            onClick={() => setSelected(p)}
                          >
                            <SquarePen className="h-4 w-4" aria-hidden="true" />
                          </RowAction>
                          <RowAction
                            title="Tolak (isi catatan)"
                            busy={busyId === p.id}
                            className="bg-red-100 text-red-600 hover:bg-red-200"
                            onClick={() => setSelected(p)}
                          >
                            <X className="h-4 w-4" aria-hidden="true" />
                          </RowAction>
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {list && list.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-line px-4 py-3">
            <p className="text-xs text-muted">
              Halaman {list.page} dari {list.totalPages} · {list.total} produk
            </p>
            <div className="flex gap-2">
              <button
                disabled={list.page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="rounded-lg border border-line px-3 py-1.5 text-sm font-medium transition hover:bg-surface disabled:opacity-40"
              >
                ‹ Sebelumnya
              </button>
              <button
                disabled={list.page >= list.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-lg border border-line px-3 py-1.5 text-sm font-medium transition hover:bg-surface disabled:opacity-40"
              >
                Berikutnya ›
              </button>
            </div>
          </div>
        )}
      </div>

      <ProductDrawer
        product={selected}
        busy={Boolean(selected && busyId === selected.id)}
        onClose={() => setSelected(null)}
        onAct={act}
      />
    </div>
  );
}

/** Tombol aksi kecil di baris tabel. */
function RowAction({
  title,
  className,
  busy,
  onClick,
  children,
}: {
  title: string;
  className: string;
  busy?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      title={title}
      aria-label={title}
      disabled={busy}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-full transition disabled:opacity-40",
        className
      )}
    >
      {children}
    </button>
  );
}
