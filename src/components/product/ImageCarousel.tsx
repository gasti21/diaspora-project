"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Play } from "lucide-react";
import { ProductImage } from "./ProductImage";
import { ReviewMediaLightbox } from "./reviews/ReviewMediaLightbox";
import { cn } from "@/lib/utils";
import type { ReviewMediaItem } from "@/lib/types";

/**
 * Galeri produk ala Tokopedia (desktop):
 * - Gambar utama: hover = zoom magnifier mengikuti kursor, klik = lightbox
 *   (zoom interaktif + penggeser).
 * - Strip thumbnail di bawah; panah < > HANYA muncul jika thumbnail melebihi
 *   kapasitas baris (perlu scroll). Kalau muat semua, panah disembunyikan.
 * - Video produk (bila ada) jadi slide pertama dengan badge play.
 */
export function ImageCarousel({
  images,
  alt,
  categorySlug,
  videoUrl,
}: {
  images: string[];
  alt: string;
  categorySlug?: string | null;
  /** URL video produk (opsional) - tampil sebagai slide pertama. */
  videoUrl?: string | null;
}) {
  const [index, setIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // Zoom magnifier ala Tokopedia: pusat zoom mengikuti posisi kursor.
  const [zooming, setZooming] = useState(false);
  const [origin, setOrigin] = useState("50% 50%");

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 100;
    const y = ((e.clientY - r.top) / r.height) * 100;
    setOrigin(`${x.toFixed(1)}% ${y.toFixed(1)}%`);
  };

  // Deteksi apakah strip thumbnail perlu scroll (panah hanya tampil bila perlu).
  const stripRef = useRef<HTMLDivElement>(null);
  const [strip, setStrip] = useState({ canL: false, canR: false });

  const updateStrip = useCallback(() => {
    const el = stripRef.current;
    if (!el) return;
    setStrip({
      canL: el.scrollLeft > 4,
      canR: el.scrollLeft + el.clientWidth < el.scrollWidth - 4,
    });
  }, []);

  useEffect(() => {
    updateStrip();
    const el = stripRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateStrip, { passive: true });
    const ro = new ResizeObserver(updateStrip);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", updateStrip);
      ro.disconnect();
    };
  }, [updateStrip]);

  // Pastikan thumbnail aktif selalu terlihat saat pindah slide.
  useEffect(() => {
    const el = stripRef.current?.children[index] as HTMLElement | undefined;
    el?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
  }, [index]);

  const scrollStrip = (dir: -1 | 1) =>
    stripRef.current?.scrollBy({ left: dir * 280, behavior: "smooth" });

  // Susun media: video produk dulu, lalu foto (ala Tokopedia).
  const media: ReviewMediaItem[] = [
    ...(videoUrl ? [{ type: "video" as const, url: videoUrl }] : []),
    ...images.filter(Boolean).map((url) => ({ type: "image" as const, url })),
  ];
  const count = media.length;
  const current = media[index];

  const prev = () => setIndex((i) => (i - 1 + count) % count);
  const next = () => setIndex((i) => (i + 1) % count);

  // Tidak ada media sama sekali: tampilkan placeholder seperti sebelumnya.
  if (count === 0) {
    return (
      <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-surface">
        <ProductImage src={null} alt={alt} categorySlug={categorySlug} className="h-full w-full" />
      </div>
    );
  }

  return (
    <div>
      {/* ===== Media utama ===== */}
      <div
        className="group relative aspect-[4/3] cursor-zoom-in overflow-hidden rounded-xl bg-surface"
        onMouseEnter={() => current?.type === "image" && setZooming(true)}
        onMouseLeave={() => setZooming(false)}
        onMouseMove={handleMove}
      >
        <button
          type="button"
          onClick={() => setLightboxOpen(true)}
          aria-label="Perbesar media"
          className="absolute inset-0 z-[1]"
        />
        {current?.type === "video" ? (
          <div className="relative h-full w-full">
            <video
              key={current.url}
              src={current.url}
              muted
              playsInline
              preload="metadata"
              className="h-full w-full bg-black object-cover"
            />
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 shadow-lg transition group-hover:scale-110">
                <Play className="h-8 w-8 fill-brand text-brand" />
              </span>
            </span>
          </div>
        ) : (
          /* Zoom magnifier ala Tokopedia: hover = gambar membesar mengikuti kursor. */
          <div
            className="h-full w-full transition-transform duration-300 ease-out will-change-transform"
            style={{
              transformOrigin: origin,
              transform: zooming ? "scale(2)" : "scale(1)",
            }}
          >
            <ProductImage
              key={current.url}
              src={current.url}
              alt={`${alt} - foto ${index + 1}`}
              categorySlug={categorySlug}
              className="h-full w-full"
            />
          </div>
        )}

        {/* Badge counter ala Tokopedia */}
        <span className="absolute right-3 top-3 z-[2] rounded-full bg-black/60 px-2.5 py-1 text-xs font-semibold text-white">
          {index + 1}/{count}
        </span>

        {/* Panah: muncul saat hover (ala Tokopedia) */}
        {count > 1 && (
          <>
            <CarouselArrow side="left" onClick={prev} />
            <CarouselArrow side="right" onClick={next} />
          </>
        )}
      </div>

      {/* ===== Strip thumbnail di bawah (ala Tokopedia) ===== */}
      {count > 1 && (
        <div className="mt-3 flex items-center gap-2">
          {/* Panah hanya tampil bila thumbnail melebihi kapasitas baris */}
          {strip.canL && (
            <button
              onClick={() => scrollStrip(-1)}
              aria-label="Geser thumbnail ke kiri"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line bg-white text-navy transition hover:border-navy/40"
            >
              <ChevronLeft className="h-4.5 w-4.5" />
            </button>
          )}
          <div
            ref={stripRef}
            className="flex flex-1 gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {media.map((m, i) => (
              <button
                key={m.url}
                onClick={() => setIndex(i)}
                aria-label={`Media ${i + 1}`}
                className={cn(
                  "relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition sm:h-[72px] sm:w-[72px]",
                  i === index ? "border-brand" : "border-transparent opacity-70 hover:opacity-100"
                )}
              >
                {m.type === "image" ? (
                  <ProductImage
                    src={m.url}
                    alt={`${alt} - thumbnail ${i + 1}`}
                    categorySlug={categorySlug}
                    className="h-full w-full"
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center bg-navy/90">
                    <Play className="h-5 w-5 fill-white text-white" />
                  </span>
                )}
              </button>
            ))}
          </div>
          {strip.canR && (
            <button
              onClick={() => scrollStrip(1)}
              aria-label="Geser thumbnail ke kanan"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line bg-white text-navy transition hover:border-navy/40"
            >
              <ChevronRight className="h-4.5 w-4.5" />
            </button>
          )}
        </div>
      )}

      {/* ===== Lightbox: klik gambar utama = auto zoom in-out + penggeser ===== */}
      <ReviewMediaLightbox
        media={media}
        index={lightboxOpen ? index : null}
        onClose={() => setLightboxOpen(false)}
        onNavigate={setIndex}
      />
    </div>
  );
}

function CarouselArrow({ side, onClick }: { side: "left" | "right"; onClick: () => void }) {
  const Icon = side === "left" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      aria-label={side === "left" ? "Sebelumnya" : "Berikutnya"}
      className={cn(
        "absolute top-1/2 z-[2] flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-navy opacity-0 shadow transition hover:bg-white group-hover:opacity-100",
        side === "left" ? "left-3" : "right-3"
      )}
    >
      <Icon className="h-5 w-5" />
    </button>
  );
}
