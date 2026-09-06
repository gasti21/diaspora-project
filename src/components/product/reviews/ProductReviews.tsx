"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Loader2, Pencil, Play, Star, Trash2, X } from "lucide-react";
import { useToast } from "@/components/toast/ToastProvider";
import { cn } from "@/lib/utils";
import type { ProductReview, ReviewMediaItem } from "@/lib/types";
import {
  REVIEW_MAX_LENGTH,
  MAX_REVIEW_MEDIA,
  REVIEW_IMAGE_MAX_MB,
  REVIEW_VIDEO_MAX_MB,
} from "@/lib/constants";
import { ReviewMediaLightbox } from "./ReviewMediaLightbox";

type Viewer = { id: string; name: string; avatarUrl?: string } | null;

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * Waktu relatif ala Google Maps: "3 hari lalu", "2 bulan lalu", dst.
 * Menampilkan waktu edit terakhir, tanpa label "diedit".
 */
function formatRelative(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  const units: [string, number][] = [
    ["tahun", 31_536_000],
    ["bulan", 2_592_000],
    ["minggu", 604_800],
    ["hari", 86_400],
    ["jam", 3_600],
    ["menit", 60],
  ];
  for (const [label, secs] of units) {
    if (diff >= secs) {
      return `${Math.floor(diff / secs)} ${label} lalu`;
    }
  }
  return "Baru saja";
}

function Stars({ value, className }: { value: number; className?: string }) {
  return (
    <span
      className={cn("flex items-center gap-0.5", className)}
      aria-label={`${value} dari 5 bintang`}
    >
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={cn(
            "h-4 w-4",
            i <= value ? "fill-amber-400 text-amber-400" : "fill-line text-line"
          )}
          aria-hidden="true"
        />
      ))}
    </span>
  );
}

/** Section ulasan produk (ala Tokopedia): ringkasan rating, filter, form, daftar. */
export function ProductReviews({
  productId,
  viewer,
  initialReviews,
}: {
  productId: string;
  /** User yang sedang login (null = tamu, hanya bisa melihat). */
  viewer: Viewer;
  initialReviews: ProductReview[];
}) {
  const toast = useToast();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [reviews, setReviews] = useState(initialReviews);
  const [filter, setFilter] = useState<"semua" | "media">("semua");
  const [lightbox, setLightbox] = useState<{ media: ReviewMediaItem[]; index: number } | null>(null);

  // ----- Form ulasan -----
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [content, setContent] = useState("");
  const [media, setMedia] = useState<ReviewMediaItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** Ulasan milik sendiri yang sedang diedit (null = mode tulis baru). */
  const [editing, setEditing] = useState<ProductReview | null>(null);

  const summary = useMemo(() => {
    const total = reviews.length;
    const distribution: [number, number, number, number, number] = [0, 0, 0, 0, 0];
    let sum = 0;
    let withMedia = 0;
    for (const r of reviews) {
      distribution[r.rating - 1] += 1;
      sum += r.rating;
      if (r.media.length > 0) withMedia += 1;
    }
    return { total, average: total ? sum / total : 0, withMedia, distribution };
  }, [reviews]);

  const visible = filter === "media" ? reviews.filter((r) => r.media.length > 0) : reviews;
  const hasReviewed = Boolean(viewer && reviews.some((r) => r.userId === viewer.id));

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    setError(null);
    const remaining = MAX_REVIEW_MEDIA - media.length;
    if (remaining <= 0) {
      setError(`Maksimal ${MAX_REVIEW_MEDIA} foto/video per ulasan.`);
      return;
    }
    setUploading(true);
    const added: ReviewMediaItem[] = [];
    for (const file of Array.from(files).slice(0, remaining)) {
      const isImage = file.type.startsWith("image/");
      const isVideo = file.type.startsWith("video/");
      if (!isImage && !isVideo) {
        setError("Hanya file foto atau video yang diizinkan.");
        continue;
      }
      const maxMb = isImage ? REVIEW_IMAGE_MAX_MB : REVIEW_VIDEO_MAX_MB;
      if (file.size > maxMb * 1024 * 1024) {
        setError(isImage ? `Ukuran foto maksimal ${maxMb}MB.` : `Ukuran video maksimal ${maxMb}MB.`);
        continue;
      }
      const body = new FormData();
      body.append("file", file);
      try {
        const res = await fetch("/api/reviews/upload", { method: "POST", body });
        const json = await res.json();
        if (!res.ok) {
          setError(json.error ?? "Gagal mengunggah media.");
          continue;
        }
        added.push({ type: json.type, url: json.url });
      } catch {
        setError("Gagal mengunggah media. Coba lagi.");
      }
    }
    if (added.length) setMedia((m) => [...m, ...added].slice(0, MAX_REVIEW_MEDIA));
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (rating < 1) {
      setError("Pilih rating bintang dulu ya.");
      return;
    }
    if (!content.trim()) {
      setError("Tulis ulasannya dulu ya.");
      return;
    }
    setSubmitting(true);
    try {
      // Mode edit: PUT untuk mengubah ulasan milik sendiri.
      const res = await fetch(
        `/api/products/${productId}/reviews`,
        editing
          ? {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ rating, content: content.trim(), media }),
            }
          : {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ rating, content: content.trim(), media }),
            }
      );
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Gagal menyimpan ulasan.");
        return;
      }
      const saved = json.review as ProductReview;
      setReviews((r) =>
        editing ? r.map((x) => (x.id === saved.id ? saved : x)) : [saved, ...r]
      );
      setRating(0);
      setContent("");
      setMedia([]);
      setEditing(null);
      toast.success(editing ? "Ulasanmu berhasil diperbarui." : "Terima kasih, ulasanmu sudah tayang!", {
        title: editing ? "Ulasan diperbarui" : "Ulasan terkirim",
      });
    } catch {
      setError("Gagal menyimpan ulasan. Coba lagi.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(review: ProductReview) {
    if (!confirm("Hapus ulasanmu?")) return;
    try {
      const res = await fetch(`/api/products/${productId}/reviews`, { method: "DELETE" });
      if (!res.ok) {
        const json = await res.json();
        toast.error(json.error ?? "Gagal menghapus ulasan.");
        return;
      }
      setReviews((r) => r.filter((x) => x.id !== review.id));
      if (editing?.id === review.id) cancelEdit();
      toast.success("Ulasanmu dihapus.");
    } catch {
      toast.error("Gagal menghapus ulasan. Coba lagi.");
    }
  }

  function openMedia(review: ProductReview, index: number) {
    setLightbox({ media: review.media, index });
  }

  /** Masuk mode edit: isi form dengan nilai ulasan yang ada. */
  function startEdit(review: ProductReview) {
    setEditing(review);
    setRating(review.rating);
    setContent(review.content);
    setMedia(review.media);
    setError(null);
    // Gulir ke form ulasan.
    document.getElementById("review-form")?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  /** Batal edit: kosongkan form kembali ke mode tulis baru. */
  function cancelEdit() {
    setEditing(null);
    setRating(0);
    setContent("");
    setMedia([]);
    setError(null);
  }

  return (
    <div className="space-y-6">
      {/* ===== Ringkasan rating (ala Tokopedia) ===== */}
      <div className="rounded-xl border border-line bg-white p-6">
        {summary.total === 0 ? (
          <div className="text-center">
            <div className="flex items-center justify-center gap-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star key={i} className="h-7 w-7 fill-line text-line" aria-hidden="true" />
              ))}
            </div>
            <p className="mt-3 text-sm font-semibold">Belum ada ulasan</p>
            <p className="mt-1 text-xs text-muted">
              Jadilah yang pertama memberi ulasan untuk produk ini.
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
            <div className="shrink-0 text-center">
              <p className="text-5xl font-extrabold tracking-tight">{summary.average.toFixed(1)}</p>
              <Stars value={Math.round(summary.average)} className="mt-1.5 justify-center" />
              <p className="mt-1.5 text-xs text-muted">{summary.total} ulasan</p>
            </div>
            <div className="w-full max-w-xs flex-1 space-y-1.5">
              {[5, 4, 3, 2, 1].map((star) => {
                const n = summary.distribution[star - 1];
                const pct = summary.total ? (n / summary.total) * 100 : 0;
                return (
                  <div key={star} className="flex items-center gap-2 text-xs">
                    <span className="w-8 shrink-0 text-muted">{star} ★</span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface">
                      <div className="h-full rounded-full bg-amber-400" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="w-6 shrink-0 text-right text-muted">{n}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Filter chips */}
        {summary.total > 0 && (
          <div className="mt-5 flex flex-wrap gap-2 border-t border-line pt-4">
            <FilterChip active={filter === "semua"} onClick={() => setFilter("semua")}>
              Semua ({summary.total})
            </FilterChip>
            <FilterChip active={filter === "media"} onClick={() => setFilter("media")}>
              Dengan Foto/Video ({summary.withMedia})
            </FilterChip>
          </div>
        )}
      </div>

      {/* ===== Form tulis / edit ulasan (hanya login) ===== */}
      {viewer ? (
        hasReviewed && !editing ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-line bg-surface/60 p-6 text-center sm:flex-row sm:justify-center">
            <p className="text-sm text-muted">
              Kamu sudah memberi ulasan untuk produk ini. Terima kasih! 🎉
            </p>
            <button
              onClick={() => startEdit(reviews.find((r) => r.userId === viewer.id)!)}
              className="flex items-center gap-1.5 rounded-xl border border-brand px-4 py-2 text-xs font-bold text-brand transition hover:bg-brand-soft"
            >
              <Pencil className="h-3.5 w-3.5" /> Edit Ulasanmu
            </button>
          </div>
        ) : (
          <form
            id="review-form"
            onSubmit={handleSubmit}
            className="rounded-xl border border-line bg-white p-6"
          >
            <h3 className="text-sm font-bold">
              {editing ? "Edit Ulasanmu" : "Tulis Ulasan"}
              {editing && <span className="ml-2 text-xs font-normal text-muted">— ubah lalu simpan kembali</span>}
            </h3>
            <div className="mt-3 flex items-center gap-1" role="radiogroup" aria-label="Rating">
              {[1, 2, 3, 4, 5].map((i) => (
                <button
                  key={i}
                  type="button"
                  role="radio"
                  aria-checked={rating === i}
                  aria-label={`${i} bintang`}
                  onMouseEnter={() => setHoverRating(i)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(i)}
                  className="transition hover:scale-110"
                >
                  <Star
                    className={cn(
                      "h-7 w-7 transition",
                      i <= (hoverRating || rating)
                        ? "fill-amber-400 text-amber-400"
                        : "fill-line text-line"
                    )}
                  />
                </button>
              ))}
            </div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value.slice(0, REVIEW_MAX_LENGTH))}
              rows={4}
              placeholder="Bagaimana pengalamanmu dengan produk ini?"
              className="mt-3 w-full resize-none rounded-xl border border-line bg-surface/50 p-3.5 text-sm outline-none transition placeholder:text-muted/70 focus:border-brand focus:bg-white"
            />
            <p className="mt-1 text-right text-xs text-muted">
              {content.length}/{REVIEW_MAX_LENGTH}
            </p>

            {/* Upload foto/video */}
            <div className="mt-3">
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime"
                multiple
                hidden
                onChange={(e) => handleFiles(e.target.files)}
              />
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={media.length >= MAX_REVIEW_MEDIA || uploading}
                  className="flex items-center gap-2 rounded-lg border border-line px-3.5 py-2 text-xs font-semibold transition hover:border-brand hover:text-brand disabled:opacity-50"
                >
                  {uploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ImagePlus className="h-4 w-4" />
                  )}
                  {uploading ? "Mengunggah..." : `Foto/Video (${media.length}/${MAX_REVIEW_MEDIA})`}
                </button>
                {submitting && <Loader2 className="h-4 w-4 animate-spin text-muted" />}
              </div>

              {media.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {media.map((m, i) => (
                    <div
                      key={m.url}
                      className="group relative h-16 w-16 overflow-hidden rounded-lg border border-line"
                    >
                      {m.type === "image" ? (
                        <img
                          src={m.url}
                          alt={`Media ${i + 1}`}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-navy/90">
                          <Play className="h-5 w-5 fill-white text-white" />
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => setMedia((arr) => arr.filter((_, j) => j !== i))}
                        aria-label="Hapus media"
                        className="absolute inset-0 flex items-center justify-center bg-black/60 text-white opacity-0 transition group-hover:opacity-100"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {error && <p className="mt-3 text-xs font-medium text-red-600">{error}</p>}

            <div className="mt-4 flex items-center gap-3">
              <button
                type="submit"
                disabled={submitting || uploading}
                className="flex h-11 items-center justify-center gap-2 rounded-xl bg-brand px-6 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-50"
              >
                {submitting ? "Menyimpan..." : editing ? "Simpan Perubahan" : "Kirim Ulasan"}
              </button>
              {editing && (
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="h-11 rounded-xl border border-line px-5 text-sm font-semibold text-muted transition hover:text-navy"
                >
                  Batal
                </button>
              )}
            </div>
          </form>
        )
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-line bg-surface/60 p-6 text-center">
          <p className="text-sm text-muted">
            <span className="font-semibold text-navy">Masuk</span> untuk menulis ulasan — semua orang
            bisa membaca ulasannya.
          </p>
          <button
            onClick={() => router.push("/login")}
            className="rounded-xl bg-brand px-6 py-2.5 text-sm font-bold text-white transition hover:opacity-90"
          >
            Masuk untuk Menulis Ulasan
          </button>
        </div>
      )}
      {/* ===== Daftar ulasan ===== */}
      {visible.length > 0 ? (
        <div className="space-y-4">
          {visible.map((r) => (
            <article key={r.id} className="rounded-xl border border-line bg-white p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  {r.authorAvatar ? (
                    <img
                      src={r.authorAvatar}
                      alt={r.authorName}
                      className="h-10 w-10 rounded-full border border-line object-cover"
                    />
                  ) : (
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-soft text-sm font-bold text-brand">
                      {r.authorName.charAt(0).toUpperCase()}
                    </span>
                  )}
                  <div>
                    <p className="text-sm font-bold">{r.authorName}</p>
                    <div className="mt-0.5 flex items-center gap-2">
                      <Stars value={r.rating} />
                      {/* Ala Google Maps: tanggal edit terakhir, tanpa label "diedit". */}
                      <span className="text-xs text-muted" title={formatDate(r.updatedAt)}>
                        {formatRelative(r.updatedAt)}
                      </span>
                    </div>
                  </div>
                </div>
                {viewer?.id === r.userId && (
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      onClick={() => startEdit(r)}
                      aria-label="Edit ulasan"
                      className="flex h-8 w-8 items-center justify-center rounded-full text-muted transition hover:bg-brand-soft hover:text-brand"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(r)}
                      aria-label="Hapus ulasan"
                      className="flex h-8 w-8 items-center justify-center rounded-full text-muted transition hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>

              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-navy/90">
                {r.content}
              </p>

              {/* Strip media di bawah teks (ala Tokopedia) */}
              {r.media.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {r.media.map((m, i) =>
                    m.type === "image" ? (
                      <button
                        key={m.url}
                        onClick={() => openMedia(r, i)}
                        aria-label={`Lihat foto ${i + 1}`}
                        className="h-20 w-20 overflow-hidden rounded-lg border border-line transition hover:opacity-90"
                      >
                        <img
                          src={m.url}
                          alt={`Foto ulasan ${i + 1}`}
                          className="h-full w-full object-cover"
                        />
                      </button>
                    ) : (
                      <button
                        key={m.url}
                        onClick={() => openMedia(r, i)}
                        aria-label={`Lihat video ${i + 1}`}
                        className="group relative h-20 w-20 overflow-hidden rounded-lg border border-line"
                      >
                        <video
                          src={m.url}
                          muted
                          playsInline
                          preload="metadata"
                          className="h-full w-full object-cover"
                        />
                        <span className="absolute inset-0 flex items-center justify-center bg-black/40 transition group-hover:bg-black/25">
                          <Play className="h-6 w-6 fill-white text-white" />
                        </span>
                      </button>
                    )
                  )}
                </div>
              )}
            </article>
          ))}
        </div>
      ) : (
        filter === "media" &&
        summary.withMedia === 0 && (
          <div className="rounded-xl border border-dashed border-line bg-surface/60 py-10 text-center text-sm text-muted">
            Belum ada ulasan dengan foto/video.
          </div>
        )
      )}

      {/* Lightbox: foto = zoom otomatis + penggeser, video = popup player */}
      <ReviewMediaLightbox
        media={lightbox?.media ?? []}
        index={lightbox?.index ?? null}
        onClose={() => setLightbox(null)}
        onNavigate={(i) => setLightbox((lb) => (lb ? { ...lb, index: i } : lb))}
      />
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-full border px-3.5 py-1.5 text-xs font-semibold transition",
        active
          ? "border-brand bg-brand-soft text-brand"
          : "border-line bg-white text-muted hover:text-navy"
      )}
    >
      {children}
    </button>
  );
}
