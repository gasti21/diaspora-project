"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ReviewMediaItem } from "@/lib/types";

/**
 * Lightbox media ulasan (ala Tokopedia):
 * - Foto  : slider dengan efek zoom in-out otomatis (Ken Burns),
 *           tombol geser kiri/kanan, dots, dan counter "2 / 5".
 * - Video : popup modal dengan player bawaan browser.
 */
export function ReviewMediaLightbox({
  media,
  index,
  onClose,
  onNavigate,
}: {
  media: ReviewMediaItem[];
  /** Index media aktif; null = tertutup. */
  index: number | null;
  onClose: () => void;
  onNavigate: (index: number) => void;
}) {
  const open = index !== null && index >= 0 && index < media.length;
  const current = open ? media[index] : null;
  const count = media.length;

  const prev = useCallback(
    () => onNavigate(((index ?? 0) - 1 + count) % count),
    [index, count, onNavigate]
  );
  const next = useCallback(() => onNavigate(((index ?? 0) + 1) % count), [index, count, onNavigate]);

  // Navigasi keyboard + kunci scroll body saat lightbox terbuka.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose, prev, next]);

  if (!open || !current) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 animate-overlay-in"
      role="dialog"
      aria-modal="true"
      aria-label="Lihat media ulasan"
      onClick={onClose}
    >
      {/* Tombol tutup */}
      <button
        onClick={onClose}
        aria-label="Tutup"
        className="absolute top-4 right-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition hover:bg-white/25"
      >
        <X className="h-5 w-5" />
      </button>

      {/* Counter "2 / 5" */}
      {count > 1 && (
        <span className="absolute top-6 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
          {index! + 1} / {count}
        </span>
      )}

      <div
        className="relative mx-4 flex max-h-[90vh] w-full max-w-4xl items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        {count > 1 && (
          <button
            onClick={prev}
            aria-label="Sebelumnya"
            className="absolute left-2 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur transition hover:bg-white/30"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        )}

        {current.type === "video" ? (
          // Popup video: langsung diputar, bisa dikontrol user.
          <video
            key={current.url}
            src={current.url}
            controls
            autoPlay
            playsInline
            className="max-h-[80vh] w-full rounded-xl bg-black animate-modal-in"
          />
        ) : (
          <LightboxZoom key={current.url} src={current.url} />
        )}

        {count > 1 && (
          <button
            onClick={next}
            aria-label="Berikutnya"
            className="absolute right-2 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur transition hover:bg-white/30"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        )}
      </div>

      {/* Dots penggeser */}
      {count > 1 && (
        <div
          className="absolute bottom-6 left-1/2 flex -translate-x-1/2 gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          {media.map((m, i) => (
            <button
              key={m.url}
              onClick={() => onNavigate(i)}
              aria-label={`Media ${i + 1}`}
              className={cn(
                "h-2.5 w-2.5 rounded-full transition",
                i === index ? "scale-125 bg-white" : "bg-white/40 hover:bg-white/70"
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Zoom foto ala Tokopedia di dalam lightbox:
 * - Scroll mouse / tombol + - untuk mengatur level zoom (1x - 4x).
 * - Titik zoom mengikuti posisi kursor; saat ter-zoom bisa drag untuk menggeser.
 */
function LightboxZoom({ src }: { src: string }) {
  const [scale, setScale] = useState(1);
  const [origin, setOrigin] = useState("50% 50%");
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);

  const trackOrigin = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 100;
    const y = ((e.clientY - r.top) / r.height) * 100;
    setOrigin(`${x.toFixed(1)}% ${y.toFixed(1)}%`);
  };

  const onWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    trackOrigin(e);
    setScale((s) => Math.min(4, Math.max(1, s + (e.deltaY < 0 ? 0.4 : -0.4))));
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (scale <= 1) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = dragRef.current;
    if (!d) return;
    setOffset({ x: d.ox + (e.clientX - d.x), y: d.oy + (e.clientY - d.y) });
  };

  const release = () => {
    dragRef.current = null;
  };

  const zoomed = scale > 1;

  return (
    <div
      className={cn(
        "relative aspect-[4/3] max-h-[80vh] w-full select-none overflow-hidden rounded-xl bg-black animate-modal-in",
        zoomed ? "cursor-grab active:cursor-grabbing" : "cursor-zoom-in"
      )}
      onWheel={onWheel}
      onMouseMove={(e) => {
        if (!dragRef.current) trackOrigin(e);
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={release}
      onPointerCancel={release}
    >
      <img
        src={src}
        alt="Media ulasan"
        draggable={false}
        className="h-full w-full object-cover transition-transform duration-200 ease-out will-change-transform"
        style={{
          transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
          transformOrigin: origin,
        }}
      />

      {/* Kontrol zoom ala Tokopedia */}
      <div className="absolute right-3 bottom-3 z-10 flex items-center gap-1 rounded-full bg-black/60 px-2 py-1 text-white backdrop-blur">
        <button
          onClick={() => setScale((s) => Math.max(1, s - 0.5))}
          aria-label="Perkecil"
          className="flex h-7 w-7 items-center justify-center rounded-full text-lg leading-none transition hover:bg-white/20"
        >
          −
        </button>
        <span className="w-12 text-center text-xs font-semibold">{Math.round(scale * 100)}%</span>
        <button
          onClick={() => setScale((s) => Math.min(4, s + 0.5))}
          aria-label="Perbesar"
          className="flex h-7 w-7 items-center justify-center rounded-full text-lg leading-none transition hover:bg-white/20"
        >
          +
        </button>
      </div>

      {!zoomed && (
        <span className="absolute bottom-3 left-3 rounded-full bg-black/50 px-3 py-1 text-xs text-white/90 backdrop-blur">
          Scroll untuk zoom
        </span>
      )}
    </div>
  );
}