"use client";

/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  Check,
  CircleCheck,
  CircleX,
  FileText,
  Inbox,
  LayoutDashboard,
  LogOut,
  Package,
  PenLine,
  Settings,
  SquarePen,
  Users,
  X,
} from "lucide-react";
import { LogoMark } from "@/components/branding/Logo";
import { CategoryBadge, StageBadge, StatusBadge } from "@/components/product/Badges";
import { ProductImage } from "@/components/product/ProductImage";
import { PER_PAGE } from "@/lib/constants";
import { cn, formatDate } from "@/lib/utils";
import type { AdminStats, Paginated, Product, ProductStatus } from "@/lib/types";

type Tab = ProductStatus | "all";

const TABS: { key: Exclude<Tab, "all">; label: string; icon: typeof Inbox }[] = [
  { key: "pending", label: "Produk Pending", icon: Inbox },
  { key: "published", label: "Produk Published", icon: Package },
  { key: "revision", label: "Produk Revisi", icon: SquarePen },
  { key: "rejected", label: "Produk Rejected", icon: CircleX },
];

const STAT_CARDS: {
  key: keyof AdminStats;
  label: string;
  icon: typeof FileText;
  iconBg: string;
  color: string;
}[] = [
  { key: "pending", label: "Pending Review", icon: FileText, iconBg: "bg-blue-50 text-blue-600", color: "text-blue-600" },
  { key: "published", label: "Published", icon: CircleCheck, iconBg: "bg-green-50 text-green-600", color: "text-green-600" },
  { key: "revision", label: "Need Revision", icon: PenLine, iconBg: "bg-orange-50 text-orange-500", color: "text-orange-500" },
  { key: "rejected", label: "Rejected", icon: CircleX, iconBg: "bg-red-50 text-red-600", color: "text-red-600" },
];

export function AdminDashboard({ adminName }: { adminName: string }) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("pending");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [list, setList] = useState<Paginated<Product> | null>(null);
  const [selected, setSelected] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, listRes] = await Promise.all([
        fetch("/api/admin/stats"),
        fetch(
          `/api/admin/products?${new URLSearchParams({
            ...(tab !== "all" ? { status: tab } : {}),
            ...(q.trim() ? { q: q.trim() } : {}),
            halaman: String(page),
          })}`
        ),
      ]);
      if (statsRes.ok) setStats(await statsRes.json());
      if (listRes.ok) {
        const data: Paginated<Product> = await listRes.json();
        setList(data);
        setSelected((prev) =>
          prev && !data.data.some((p) => p.id === prev.id)
            ? data.data[0] ?? null
            : prev ?? data.data[0] ?? null
        );
      }
    } catch {
      setActionError("Gagal memuat data dashboard.");
    }
    setLoading(false);
  }, [tab, q, page]);

  useEffect(() => {
    load();
  }, [load]);

  async function act(product: Product, status: ProductStatus, reviewNote?: string) {
    setActionError(null);
    setNotice(null);
    const res = await fetch(`/api/admin/products/${product.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, reviewNote }),
    });
    const json = await res.json();
    if (!res.ok) {
      setActionError(json.error ?? "Gagal memperbarui status.");
      return false;
    }
    setNotice(
      status === "published"
        ? `“${product.name}” disetujui dan langsung tayang di Homepage.`
        : `“${product.name}” dipindah ke status ${status}.`
    );
    await load();
    return true;
  }

  async function signOut() {
    await fetch("/auth/signout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  const total = stats
    ? stats.pending + stats.published + stats.revision + stats.rejected
    : 0;

  return (
    <div className="flex min-h-screen bg-surface">
      {/* ===== Sidebar ===== */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col bg-navy-deep p-5 text-white lg:flex">
        <Link href="/" className="flex items-center gap-2.5">
          <LogoMark className="h-8 w-8" />
          <span className="text-lg font-extrabold">
            Karya<span className="text-red-400">Diaspora</span>
          </span>
        </Link>

        <nav className="mt-8 flex-1 space-y-1 text-sm">
          <button
            onClick={() => setTab("all")}
            className={cn(
              "flex w-full items-center gap-3 rounded-lg px-3.5 py-2.5 font-medium transition",
              tab === "all" ? "bg-white/10" : "text-white/75 hover:bg-white/5"
            )}
          >
            <LayoutDashboard className="h-4.5 w-4.5" aria-hidden="true" /> Dashboard Semua
          </button>
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                "flex w-full items-center justify-between gap-3 rounded-lg px-3.5 py-2.5 font-medium transition",
                tab === t.key ? "bg-white/10" : "text-white/75 hover:bg-white/5"
              )}
            >
              <span className="flex items-center gap-3">
                <t.icon className="h-4.5 w-4.5" aria-hidden="true" />
                {t.label}
              </span>
              {stats && (
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-xs font-bold",
                    t.key === "pending"
                      ? "bg-red-500 text-white"
                      : t.key === "published"
                        ? "bg-green-500 text-white"
                        : t.key === "revision"
                          ? "bg-orange-400 text-white"
                          : "bg-white/20 text-white"
                  )}
                >
                  {stats[t.key]}
                </span>
              )}
            </button>
          ))}

          <div className="!mt-6 border-t border-white/10 pt-4 text-white/40">
            <span className="flex items-center gap-3 rounded-lg px-3.5 py-2.5" title="Rencana Fase 2">
              <Users className="h-4.5 w-4.5" aria-hidden="true" /> Users - Fase 2
            </span>
            <span className="flex items-center gap-3 rounded-lg px-3.5 py-2.5" title="Rencana Fase 2">
              <Settings className="h-4.5 w-4.5" aria-hidden="true" /> Pengaturan - Fase 2
            </span>
          </div>
        </nav>

        <div className="border-t border-white/10 pt-4">
          <p className="truncate px-2 text-xs text-white/50">Admin: {adminName}</p>
          <button
            onClick={signOut}
            className="mt-2 flex w-full items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-medium text-white/75 transition hover:bg-white/5"
          >
            <LogOut className="h-4.5 w-4.5" aria-hidden="true" /> Logout
          </button>
        </div>
      </aside>

      {/* ===== Konten utama ===== */}
      <div className="min-w-0 flex-1 p-5 sm:p-8">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold">
              {TABS.find((t) => t.key === tab)?.label ?? "Semua Produk"}
            </h1>
            <p className="mt-1 text-sm text-muted">
              Satu database, dikendalikan filter status - sesuai alur MVP.
            </p>
          </div>
          <div className="flex gap-2 lg:hidden">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => { setTab(t.key); setPage(1); }}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-semibold",
                  tab === t.key ? "bg-navy text-white" : "bg-white text-navy border border-line"
                )}
              >
                {t.label.replace("Produk ", "")}
              </button>
            ))}
          </div>
        </header>

        {/* Stat cards */}
        <div className="mt-6 grid grid-cols-2 gap-4 xl:grid-cols-4">
          {STAT_CARDS.map((c) => (
            <button
              key={c.key}
              onClick={() => { setTab(c.key as Tab); setPage(1); }}
              className={cn(
                "rounded-2xl border bg-white p-5 text-left transition hover:shadow-md",
                tab === c.key ? "border-navy" : "border-line"
              )}
            >
              <span className={cn("flex h-10 w-10 items-center justify-center rounded-full", c.iconBg)}>
                <c.icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <p className={cn("mt-2 text-3xl font-extrabold", c.color)}>
                {stats ? stats[c.key] : "-"}
              </p>
              <p className="mt-1 text-sm text-muted">{c.label}</p>
            </button>
          ))}
        </div>

        {notice && (
          <p className="mt-4 rounded-lg bg-green-50 p-3 text-sm font-medium text-green-700">
            {notice}
          </p>
        )}
        {actionError && (
          <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm font-medium text-brand">
            {actionError}
          </p>
        )}
        {!list && loading && <p className="mt-6 text-sm text-muted">Memuat data…</p>}

        {list && (
          <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_340px]">
            {/* Tabel */}
            <div className="min-w-0 overflow-hidden rounded-2xl border border-line bg-white">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-4">
                <input
                  value={q}
                  onChange={(e) => { setQ(e.target.value); setPage(1); }}
                  placeholder="Cari nama produk atau pemilik…"
                  className="h-10 w-full max-w-xs rounded-lg border border-line px-3.5 text-sm outline-none focus:border-navy"
                />
                <p className="text-xs text-muted">
                  Menampilkan {list.data.length} dari {list.total} data
                  {tab === "all" ? " (semua status)" : ""}
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-line bg-surface/60 text-xs uppercase tracking-wide text-muted">
                      <th className="px-4 py-3 font-semibold">No</th>
                      <th className="px-4 py-3 font-semibold">Nama Produk</th>
                      <th className="px-4 py-3 font-semibold">Pemilik</th>
                      <th className="px-4 py-3 font-semibold">Kategori</th>
                      <th className="px-4 py-3 font-semibold">Tanggal Submit</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                      <th className="px-4 py-3 text-right font-semibold">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {list.data.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-4 py-12 text-center text-muted">
                          Tidak ada produk pada filter ini.
                        </td>
                      </tr>
                    )}
                    {list.data.map((p, i) => (
                      <tr
                        key={p.id}
                        onClick={() => setSelected(p)}
                        className={cn(
                          "cursor-pointer border-b border-line/70 transition last:border-0 hover:bg-surface/60",
                          selected?.id === p.id && "bg-blue-50/60"
                        )}
                      >
                        <td className="px-4 py-3.5 text-muted">
                          {(list.page - 1) * list.perPage + i + 1}
                        </td>
                        <td className="px-4 py-3.5 font-semibold">{p.name}</td>
                        <td className="px-4 py-3.5">{p.ownerName}</td>
                        <td className="px-4 py-3.5">
                          <CategoryBadge name={p.categoryName} slug={p.categorySlug} />
                        </td>
                        <td className="px-4 py-3.5 text-muted">{formatDate(p.createdAt)}</td>
                        <td className="px-4 py-3.5">
                          <StatusBadge status={p.status} />
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex justify-end gap-1.5">
                            <ActionIcon title="Approve" className="bg-green-100 text-green-600 hover:bg-green-200"
                              onClick={() => act(p, "published")}>
                              <Check className="h-4 w-4" />
                            </ActionIcon>
                            <ActionIcon title="Need Revision" className="bg-orange-100 text-orange-600 hover:bg-orange-200"
                              onClick={() => act(p, "revision")}>
                              <SquarePen className="h-4 w-4" />
                            </ActionIcon>
                            <ActionIcon title="Reject" className="bg-red-100 text-red-600 hover:bg-red-200"
                              onClick={() => act(p, "rejected")}>
                              <X className="h-4 w-4" />
                            </ActionIcon>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {list.totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-line p-4">
                  <p className="text-xs text-muted">
                    Halaman {list.page} dari {list.totalPages}
                  </p>
                  <div className="flex gap-2">
                    <button
                      disabled={list.page <= 1}
                      onClick={() => setPage((p) => p - 1)}
                      className="rounded-lg border border-line px-3 py-1.5 text-sm disabled:opacity-40"
                    >
                      ‹ Sebelumnya
                    </button>
                    <button
                      disabled={list.page >= list.totalPages}
                      onClick={() => setPage((p) => p + 1)}
                      className="rounded-lg border border-line px-3 py-1.5 text-sm disabled:opacity-40"
                    >
                      Berikutnya ›
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Panel detail */}
            <DetailPanel
              product={selected}
              onAct={act}
              totalProducts={total}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function ActionIcon({
  title,
  className,
  onClick,
  children,
}: {
  title: string;
  className?: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      title={title}
      aria-label={title}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-full text-sm transition",
        className
      )}
    >
      {children}
    </button>
  );
}

function DetailPanel({
  product,
  onAct,
  totalProducts,
}: {
  product: Product | null;
  onAct: (p: Product, status: ProductStatus, note?: string) => Promise<boolean>;
  totalProducts: number;
}) {
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [showNote, setShowNote] = useState(false);

  useEffect(() => {
    setNote("");
    setShowNote(false);
  }, [product?.id]);

  async function run(status: ProductStatus) {
    if (!product) return;
    setBusy(true);
    const ok = await onAct(product, status, note.trim() || undefined);
    if (ok) {
      setNote("");
      setShowNote(false);
    }
    setBusy(false);
  }

  if (!product) {
    return (
      <aside className="hidden h-fit rounded-2xl border border-line bg-white p-6 xl:block">
        <h2 className="font-extrabold">Detail Produk</h2>
        <p className="mt-3 text-sm text-muted">
          Pilih baris di tabel untuk melihat detail produk.
        </p>
      </aside>
    );
  }

  return (
    <aside className="h-fit rounded-2xl border border-line bg-white p-6">
      <h2 className="font-extrabold">Detail Produk</h2>

      <div className="mt-4 aspect-[4/3] overflow-hidden rounded-xl bg-surface">
        <ProductImage
          src={product.images[0]}
          alt={product.name}
          categorySlug={product.categorySlug}
          className="h-full w-full"
        />
      </div>

      <h3 className="mt-4 text-lg font-bold">{product.name}</h3>
      <div className="mt-2 flex flex-wrap gap-2">
        <CategoryBadge name={product.categoryName} slug={product.categorySlug} />
        <StageBadge stage={product.stage} />
      </div>

      <dl className="mt-4 space-y-3 text-sm">
        <Row label="Pemilik" value={product.ownerName} />
        <Row label="Email" value={product.ownerEmail} />
        <Row label="Lokasi" value={[product.city, product.country].filter(Boolean).join(", ")} />
        <Row label="Tanggal Submit" value={formatDate(product.createdAt)} />
        <Row label="Status Saat Ini" value="" badge={<StatusBadge status={product.status} />} />
      </dl>

      <div className="mt-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">
          Deskripsi Singkat
        </p>
        <p className="mt-1.5 text-sm leading-relaxed text-navy/85">
          {product.shortDescription}
        </p>
      </div>

      {product.reviewNote && (
        <div className="mt-4 rounded-lg bg-amber-50 p-3 text-xs leading-relaxed text-amber-800">
          <span className="font-bold">Catatan review: </span>
          {product.reviewNote}
        </div>
      )}

      {showNote && (
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          placeholder="Tulis catatan revisi / alasan penolakan untuk pemilik produk…"
          className="mt-4 w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-navy"
        />
      )}

      <div className="mt-5 grid grid-cols-3 gap-2">
        <button
          disabled={busy}
          onClick={() => run("published")}
          className="flex items-center justify-center gap-1 rounded-lg bg-green-600 py-2.5 text-xs font-bold text-white transition hover:bg-green-700 disabled:opacity-60"
        >
          <Check className="h-3.5 w-3.5" aria-hidden="true" /> Approve
        </button>
        <button
          disabled={busy}
          onClick={() => (showNote || note ? run("revision") : setShowNote(true))}
          className="flex items-center justify-center gap-1 rounded-lg bg-orange-500 py-2.5 text-xs font-bold text-white transition hover:bg-orange-600 disabled:opacity-60"
        >
          <SquarePen className="h-3.5 w-3.5" aria-hidden="true" /> Revision
        </button>
        <button
          disabled={busy}
          onClick={() => (showNote || note ? run("rejected") : setShowNote(true))}
          className="flex items-center justify-center gap-1 rounded-lg bg-brand py-2.5 text-xs font-bold text-white transition hover:bg-brand-dark disabled:opacity-60"
        >
          <X className="h-3.5 w-3.5" aria-hidden="true" /> Reject
        </button>
      </div>

      <Link
        href={`/produk/${product.slug}`}
        target="_blank"
        className="mt-4 flex items-center justify-center gap-1 text-center text-xs font-medium text-muted hover:text-brand"
      >
        Lihat halaman publik <ArrowUpRight className="h-3.5 w-3.5" /> · Total {totalProducts} produk terdata
      </Link>
    </aside>
  );
}

function Row({
  label,
  value,
  badge,
}: {
  label: string;
  value: string;
  badge?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="shrink-0 text-muted">{label}</dt>
      <dd className="text-right font-semibold break-all">
        {badge ?? value}
      </dd>
    </div>
  );
}
