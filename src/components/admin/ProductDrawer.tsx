"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Check,
  Globe,
  LoaderCircle,
  SquarePen,
  Trash2,
  Video,
  X,
} from "lucide-react";
import { CategoryBadge, NeedTag, StageBadge, StatusBadge } from "@/components/product/Badges";
import { ProductImage } from "@/components/product/ProductImage";
import { cn, formatDate, formatLocation } from "@/lib/utils";
import type { Product, ProductStatus } from "@/lib/types";

interface Props {
  product: Product | null;
  busy: boolean;
  onClose: () => void;
  onAct: (product: Product, status: ProductStatus, reviewNote?: string) => Promise<boolean>;
  /** Hapus produk permanen (admin). */
  onDelete?: (product: Product) => Promise<boolean>;
}

/** Slide-over detail produk dari kanan - pusat aksi review admin. */
export function ProductDrawer({ product, busy, onClose, onAct, onDelete }: Props) {
  const [note, setNote] = useState("");
  const [noteError, setNoteError] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const noteRef = useRef<HTMLTextAreaElement>(null);

  // reset catatan setiap ganti produk terpilih
  useEffect(() => {
    setNote("");
    setNoteError(false);
    setConfirmDelete(false);
  }, [product?.id]);

  // tutup dengan tombol Escape + kunci scroll body
  useEffect(() => {
    if (!product) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [product, onClose]);

  if (!product) return null;

  // tangkap agar narrowing tetap berlaku di dalam closure async
  const current = product;

  async function run(status: ProductStatus) {
    // revisi & tolak wajib disertai catatan untuk pemilik produk
    if ((status === "revision" || status === "rejected") && !note.trim()) {
      setNoteError(true);
      noteRef.current?.focus();
      return;
    }
    const ok = await onAct(current, status, note.trim() || undefined);
    if (ok) {
      setNote("");
      setNoteError(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="animate-overlay-in absolute inset-0 bg-navy-deep/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        role="dialog"
        aria-label={`Detail produk ${product.name}`}
        className="animate-drawer-in absolute inset-y-0 right-0 flex w-full max-w-xl flex-col overflow-y-auto bg-white shadow-2xl"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-line bg-white/95 px-5 py-4 backdrop-blur">
          <div className="min-w-0">
            <h2 className="truncate text-base font-extrabold text-navy">{product.name}</h2>
            <p className="mt-0.5 truncate text-xs text-muted">
              Diajukan {formatDate(product.createdAt)} oleh {product.ownerName}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup detail"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line text-muted transition hover:bg-surface hover:text-navy"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="space-y-5 px-5 py-5">
          {/* Galeri media: semua foto + indikator video */}
          <div>
            <div className="grid grid-cols-4 gap-2">
              {product.videoUrl && (
                <a
                  href={product.videoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="relative col-span-2 row-span-2 flex aspect-[4/3] items-center justify-center overflow-hidden rounded-xl bg-navy/90 text-white transition hover:bg-navy"
                  title="Buka video di tab baru"
                >
                  <Video className="h-7 w-7" aria-hidden="true" />
                  <span className="absolute inset-x-0 bottom-0 bg-black/40 py-1 text-center text-[10px] font-bold">
                    LIHAT VIDEO
                  </span>
                </a>
              )}
              {(product.images ?? []).slice(0, product.videoUrl ? 6 : 8).map((img, i) => (
                <div
                  key={img}
                  className={cn(
                    "overflow-hidden rounded-xl bg-surface",
                    product.videoUrl ? "aspect-square" : "aspect-[4/3]"
                  )}
                >
                  <ProductImage
                    src={img}
                    alt={`${product.name} - foto ${i + 1}`}
                    categorySlug={product.categorySlug}
                    fit="contain"
                    width={640}
                    className="h-full w-full"
                  />
                </div>
              ))}
            </div>
            {product.videoUrl && (
              <p className="mt-1.5 truncate text-[11px] text-muted">{product.videoUrl}</p>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <StatusBadge status={product.status} />
            {product.categoryName && (
              <CategoryBadge name={product.categoryName} slug={product.categorySlug} />
            )}
            <StageBadge stage={product.stage} />
          </div>

          {/* Info pemilik */}
          <dl className="space-y-2.5 rounded-xl bg-surface/70 p-4 text-sm">
            <Row label="Pemilik" value={product.ownerName} />
            <Row label="Email" value={product.ownerEmail} />
            <Row label="WhatsApp" value={product.ownerWhatsapp} />
            <Row label="Lokasi" value={formatLocation(product)} />
            {product.yearFounded && <Row label="Tahun Berdiri" value={String(product.yearFounded)} />}
          </dl>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wide text-muted">Deskripsi</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-navy/85">{product.longDescription}</p>
          </div>

          {product.needs.length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wide text-muted">Kebutuhan</h3>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {product.needs.map((n) => (
                  <NeedTag key={n} need={n} />
                ))}
                {product.needsOther && <NeedTag need={`Lainnya: ${product.needsOther}`} />}
              </div>
            </div>
          )}

          {(product.website || product.videoUrl) && (
            <div className="flex flex-wrap gap-2">
              {product.website && (
                <a
                  href={product.website}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-2 text-xs font-semibold text-navy transition hover:bg-surface"
                >
                  <Globe className="h-3.5 w-3.5" aria-hidden="true" /> Website
                </a>
              )}
              {product.videoUrl && (
                <a
                  href={product.videoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-2 text-xs font-semibold text-navy transition hover:bg-surface"
                >
                  <Video className="h-3.5 w-3.5" aria-hidden="true" /> Video
                </a>
              )}
            </div>
          )}

          {product.additionalNotes && (
            <div className="rounded-xl bg-blue-50/60 p-3 text-xs leading-relaxed text-blue-900">
              <span className="font-bold">Catatan pemilik: </span>
              {product.additionalNotes}
            </div>
          )}

          {product.reviewNote && (
            <div className="rounded-xl bg-amber-50 p-3 text-xs leading-relaxed text-amber-800">
              <span className="font-bold">Catatan review terakhir: </span>
              {product.reviewNote}
            </div>
          )}

          {/* Aksi kelola data */}
          <div className="border-t border-line pt-4">
            <h3 className="text-xs font-bold uppercase tracking-wide text-muted">Kelola Data</h3>
            <div className="mt-2 flex gap-2">
              <Link
                href={`/admin/produk/${product.id}/edit`}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-line py-2.5 text-xs font-bold text-navy transition hover:bg-surface"
              >
                <SquarePen className="h-4 w-4" aria-hidden="true" /> Edit Data
              </Link>
              {confirmDelete ? (
                <>
                  <span className="flex items-center text-xs font-semibold text-brand">
                    Hapus permanen?
                  </span>
                  <button
                    disabled={busy || !onDelete}
                    onClick={async () => {
                      if (onDelete && (await onDelete(current))) onClose();
                    }}
                    className="rounded-lg bg-brand px-3 py-2.5 text-xs font-bold text-white transition hover:bg-brand-dark disabled:opacity-60"
                  >
                    Ya, Hapus
                  </button>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="rounded-lg border border-line px-3 py-2.5 text-xs font-bold text-navy transition hover:bg-surface"
                  >
                    Batal
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2.5 text-xs font-bold text-red-600 transition hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" /> Hapus
                </button>
              )}
            </div>
            <p className="mt-1.5 text-[11px] leading-relaxed text-muted">
              Edit memperbaiki isi data tanpa mengubah status review. Hapus bersifat
              permanen dan tidak bisa dibatalkan.
            </p>
          </div>

          {/* Aksi review */}
          <div className="border-t border-line pt-4">
            <h3 className="text-xs font-bold uppercase tracking-wide text-muted">Keputusan Review</h3>
            <textarea
              ref={noteRef}
              value={note}
              onChange={(e) => {
                setNote(e.target.value);
                setNoteError(false);
              }}
              rows={3}
              placeholder="Catatan untuk pemilik produk (wajib untuk revisi / tolak)…"
              className={
                "mt-2 w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition focus:border-navy " +
                (noteError ? "border-red-400 bg-red-50/40" : "border-line")
              }
            />
            {noteError && (
              <p className="mt-1 text-xs font-semibold text-brand">
                Revisi dan penolakan wajib disertai catatan agar pemilik tahu apa yang harus diperbaiki.
              </p>
            )}

            <div className="mt-3 grid grid-cols-3 gap-2">
              <button
                disabled={busy}
                onClick={() => run("published")}
                className="flex items-center justify-center gap-1.5 rounded-lg bg-green-600 py-2.5 text-xs font-bold text-white transition hover:bg-green-700 disabled:opacity-60"
              >
                {busy ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Check className="h-4 w-4" aria-hidden="true" />}
                Approve
              </button>
              <button
                disabled={busy}
                onClick={() => run("revision")}
                className="flex items-center justify-center gap-1.5 rounded-lg bg-orange-500 py-2.5 text-xs font-bold text-white transition hover:bg-orange-600 disabled:opacity-60"
              >
                <SquarePen className="h-4 w-4" aria-hidden="true" /> Revisi
              </button>
              <button
                disabled={busy}
                onClick={() => run("rejected")}
                className="flex items-center justify-center gap-1.5 rounded-lg bg-brand py-2.5 text-xs font-bold text-white transition hover:bg-brand-dark disabled:opacity-60"
              >
                <X className="h-4 w-4" aria-hidden="true" /> Tolak
              </button>
            </div>

            {product.status === "published" && (
              <Link
                href={`/produk/${product.slug}`}
                target="_blank"
                className="mt-4 flex items-center justify-center gap-1 text-xs font-semibold text-muted transition hover:text-brand"
              >
                Lihat halaman publik <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="shrink-0 text-muted">{label}</dt>
      <dd className="text-right font-semibold break-all text-navy">{value}</dd>
    </div>
  );
}
