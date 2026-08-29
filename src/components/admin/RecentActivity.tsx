"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, LoaderCircle, SquarePen } from "lucide-react";
import { STATS_EVENT } from "./admin-nav";
import { useToast } from "@/components/toast/ToastProvider";
import { StatusBadge } from "@/components/product/Badges";
import { ProductImage } from "@/components/product/ProductImage";
import { timeAgo } from "@/lib/utils";
import type { Product } from "@/lib/types";

/**
 * Daftar pengajuan terbaru di Overview admin. Baris berstatus Pending
 * mendapat aksi cepat: Approve sekali klik (PATCH status published) atau
 * Review lengkap lewat drawer Manajemen Produk.
 */
export function RecentActivity({ recent }: { recent: Product[] }) {
  const router = useRouter();
  const toast = useToast();
  const [busyId, setBusyId] = useState<string | null>(null);

  async function approve(product: Product) {
    setBusyId(product.id);
    try {
      const res = await fetch(`/api/admin/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "published" }),
      });
      const json = await res.json();
      if (res.ok) {
        toast.success(`"${product.name}" sudah tayang di katalog publik.`, {
          title: "Pengajuan disetujui",
        });
        window.dispatchEvent(new Event(STATS_EVENT));
        router.refresh();
      } else {
        toast.error(json.error ?? "Gagal menyetujui pengajuan.");
      }
    } catch {
      toast.error("Kesalahan jaringan. Coba lagi.");
    }
    setBusyId(null);
  }

  if (recent.length === 0) {
    return (
      <p className="px-5 py-10 text-center text-sm text-muted">
        Belum ada pengajuan produk masuk.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-line/70">
      {recent.map((p) => (
        <li key={p.id} className="flex items-center gap-3 px-5 py-3.5">
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
              {p.ownerName} · {p.country}
              {p.categoryName ? ` · ${p.categoryName}` : ""}
            </p>
          </div>

          <div className="hidden shrink-0 sm:block">
            <StatusBadge status={p.status} />
          </div>

          <p className="hidden w-20 shrink-0 text-right text-xs text-muted md:block">
            {timeAgo(p.createdAt)}
          </p>

          {p.status === "pending" && (
            <div className="flex shrink-0 items-center gap-1.5">
              <button
                onClick={() => approve(p)}
                disabled={busyId === p.id}
                title="Setujui & tayangkan"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-green-600 transition hover:bg-green-200 disabled:opacity-40"
              >
                {busyId === p.id ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Check className="h-4 w-4" aria-hidden="true" />
                )}
              </button>
              <Link
                href="/admin/produk?status=pending"
                title="Review lengkap (catatan, tolak, revisi)"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 text-orange-600 transition hover:bg-orange-200"
              >
                <SquarePen className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          )}
        </li>
      ))}

      <li className="border-t border-line">
        <Link
          href="/admin/produk"
          className="flex items-center justify-center gap-1 bg-surface/50 py-3 text-xs font-semibold text-navy transition hover:bg-surface"
        >
          Kelola semua produk <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </li>
    </ul>
  );
}
