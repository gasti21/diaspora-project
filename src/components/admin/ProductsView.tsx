"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Ban, Check, Download, Inbox, Search, SquarePen, X } from "lucide-react";
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
  // Bulk action: set id produk yang dicentang + status aksi massal aktif.
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  // Jumlah produk per status - menampilkan angka di chip filter.
  const [counts, setCounts] = useState<{ pending: number; published: number; revision: number; rejected: number } | null>(null);

  function toggleCheck(id: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function bulkAct(newStatus: ProductStatus) {
    if (checked.size === 0 || bulkBusy) return;
    setBulkBusy(true);
    try {
      const res = await fetch("/api/admin/products/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [...checked], status: newStatus }),
      });
      const json = (await res.json()) as { updated?: number; failed?: string[]; error?: string };
      if (!res.ok) {
        toast.error(json.error ?? "Gagal memproses aksi massal.");
        return;
      }
      const failedCount = json.failed?.length ?? 0;
      toast.success(
        failedCount > 0
          ? `${json.updated} produk diperbarui, ${failedCount} gagal.`
          : `${json.updated} produk diperbarui.`,
        { title: "Aksi massal selesai" }
      );
      setChecked(new Set());
      await load();
      window.dispatchEvent(new Event(STATS_EVENT));
    } catch {
      toast.error("Koneksi bermasalah. Coba lagi.");
    } finally {
      setBulkBusy(false);
    }
  }

  // debounce pencarian -> mulai lagi dari halaman 1
  useEffect(() => {
    if (firstRun.current) return; // jangan reset halaman dari URL saat mount
    const t = setTimeout(() => {
      setQ(qInput.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [qInput]);

  const refreshCounts = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/stats");
      if (res.ok) setCounts(await res.json());
    } catch {
      // chip jumlah bersifat pelengkap
    }
  }, []);

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

  useEffect(() => {
    refreshCounts();
  }, [refreshCounts]);

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
        await refreshCounts();
        return true;
      } catch {
        toast.error("Gagal memperbarui status. Coba lagi.");
        return false;
      } finally {
        setBusyId(null);
      }
    },
    [load, toast, refreshCounts]
  );

  /** Hapus produk permanen (dari drawer). */
  const remove = useCallback(
    async (product: Product) => {
      setBusyId(product.id);
      try {
        const res = await fetch(`/api/products/${product.id}`, { method: "DELETE" });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          toast.error(json.error ?? "Gagal menghapus produk.");
          return false;
        }
        toast.success(`"${product.name}" dihapus permanen.`);
        setSelected(null);
        await load();
        return true;
      } catch {
        toast.error("Gagal menghapus produk. Coba lagi.");
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
              {(() => {
                const key = s.key as "pending" | "published" | "revision" | "rejected";
                if (s.key === "all" || !counts) return null;
                return (
                  <span
                    className={cn(
                      "ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                      status === s.key ? "bg-white/20 text-white" : "bg-surface text-muted"
                    )}
                  >
                    {counts[key]}
                  </span>
                );
              })()}
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

      {/* Toolbar aksi massal - muncul saat ada produk dicentang */}
      {checked.size > 0 && (
        <div className="sticky top-16 z-20 flex flex-wrap items-center gap-3 rounded-2xl border border-navy/20 bg-navy px-4 py-3 text-white shadow-lg">
          <span className="text-sm font-bold">{checked.size} produk dipilih</span>
          <div className="ml-auto flex gap-2">
            <button
              onClick={() => void bulkAct("published")}
              disabled={bulkBusy}
              className="flex items-center gap-1.5 rounded-lg bg-green-500 px-3.5 py-2 text-xs font-bold transition hover:bg-green-600 disabled:opacity-50"
            >
              <Check className="h-3.5 w-3.5" aria-hidden="true" />
              {bulkBusy ? "Memproses…" : "Approve Terpilih"}
            </button>
            <button
              onClick={() => void bulkAct("rejected")}
              disabled={bulkBusy}
              className="flex items-center gap-1.5 rounded-lg bg-red-500 px-3.5 py-2 text-xs font-bold transition hover:bg-red-600 disabled:opacity-50"
            >
              <Ban className="h-3.5 w-3.5" aria-hidden="true" />
              Tolak Terpilih
            </button>
            <button
              onClick={() => setChecked(new Set())}
              className="rounded-lg border border-white/25 px-3 py-2 text-xs font-semibold transition hover:bg-white/10"
            >
              Batal
            </button>
          </div>
        </div>
      )}

      {/* Daftar produk gaya kartu */}
      <div className="overflow-hidden rounded-2xl border border-line bg-white">
        {/* Bar kepala: pilih semua + jumlah */}
        <div className="flex items-center justify-between border-b border-line bg-surface/60 px-4 py-2.5">
          <label className="flex cursor-pointer items-center gap-2.5 text-xs font-semibold text-muted">
            <input
              type="checkbox"
              aria-label="Pilih semua produk di halaman ini"
              checked={Boolean(list?.data.length) && checked.size === list?.data.length}
              onChange={(e) =>
                setChecked(e.target.checked ? new Set(list?.data.map((p) => p.id)) : new Set())
              }
              className="h-4 w-4 cursor-pointer accent-[#d32f2f]"
            />
            Pilih semua
          </label>
          {list && (
            <span className="text-xs font-semibold text-muted">{list.total} produk</span>
          )}
        </div>

        <ul className="divide-y divide-line/70">
          {loading &&
            [0, 1, 2, 3].map((i) => (
              <li key={i} className="flex items-center gap-4 px-4 py-4">
                <div className="h-14 w-14 shrink-0 animate-pulse rounded-xl bg-line" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-1/3 animate-pulse rounded bg-line" />
                  <div className="h-3 w-1/4 animate-pulse rounded bg-line" />
                </div>
                <div className="h-6 w-20 animate-pulse rounded-full bg-line" />
              </li>
            ))}

          {!loading && list?.data.length === 0 && (
            <li className="px-4 py-14 text-center">
              <Inbox className="mx-auto h-9 w-9 text-muted/40" aria-hidden="true" />
              <p className="mt-3 text-sm font-semibold text-navy">
                Tidak ada produk pada filter ini
              </p>
              <p className="mt-1 text-xs text-muted">
                Coba ubah kata kunci pencarian atau pilih status lain.
              </p>
            </li>
          )}

          {!loading &&
            list?.data.map((p) => {
              const age = daysSince(p.createdAt);
              const urgent = p.status === "pending" && age >= 3;
              return (
                <li
                  key={p.id}
                  onClick={() => setSelected(p)}
                  className={cn(
                    "flex cursor-pointer flex-wrap items-center gap-3 px-4 py-3.5 transition hover:bg-surface/60 sm:flex-nowrap",
                    selected?.id === p.id && "bg-blue-50/50"
                  )}
                >
                  <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      aria-label={`Pilih ${p.name}`}
                      checked={checked.has(p.id)}
                      onChange={() => toggleCheck(p.id)}
                      className="h-4 w-4 cursor-pointer accent-[#d32f2f]"
                    />
                  </div>

                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-line bg-surface">
                    <ProductImage
                      src={p.images?.[0] ?? null}
                      alt={p.name}
                      categorySlug={p.categorySlug}
                      fit="contain"
                      className="h-full w-full"
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-navy">{p.name}</p>
                    <p className="mt-0.5 truncate text-xs text-muted">
                      {p.ownerName} - {p.country}
                      {p.categoryName ? ` - ${p.categoryName}` : ""}
                    </p>
                    <p className="mt-1 text-[11px] text-muted">
                      {formatDate(p.createdAt)} - {""}
                      {urgent ? (
                        <span className="font-bold text-amber-600">{age} hari menunggu</span>
                      ) : (
                        timeAgo(p.createdAt)
                      )}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-2.5">
                    <StatusBadge status={p.status} />
                    <div className="flex gap-1.5">
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
                  </div>
                </li>
              );
            })}
        </ul>


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
        onDelete={remove}
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
