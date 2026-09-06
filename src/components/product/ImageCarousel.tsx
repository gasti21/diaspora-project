"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Play } from "lucide-react";
import { ProductImage } from "./ProductImage";
import { cn } from "@/lib/utils";

type Player =
  | { kind: "youtube"; src: string }
  | { kind: "vimeo"; src: string }
  | { kind: "dailymotion"; src: string }
  | { kind: "tiktok"; src: string }
  | { kind: "instagram"; src: string }
  | { kind: "file" }
  | { kind: "external" };

/** Deteksi jenis & URL pemutar dari sebuah link video. */
function resolvePlayer(url: string): Player {
  let m = url.match(
    /(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/
  );
  if (m) return { kind: "youtube", src: `https://www.youtube.com/embed/${m[1]}?autoplay=1` };

  m = url.match(/vimeo\.com\/(?:video\/)?(\d{6,})/);
  if (m) return { kind: "vimeo", src: `https://player.vimeo.com/video/${m[1]}?autoplay=1` };

  m = url.match(/dailymotion\.com\/video\/([A-Za-z0-9]+)/);
  if (m)
    return {
      kind: "dailymotion",
      src: `https://geo.dailymotion.com/player.html?video=${m[1]}&autoplay=1`,
    };

  m = url.match(/tiktok\.com\/@[^/]+\/video\/(\d+)/);
  if (m) return { kind: "tiktok", src: `https://www.tiktok.com/embed/v2/${m[1]}` };

  m = url.match(/instagram\.com\/(?:p|reel|reels|tv)\/([A-Za-z0-9_-]+)/);
  if (m) return { kind: "instagram", src: `https://www.instagram.com/p/${m[1]}/embed` };

  if (/\.(mp4|webm|ogg|mov)(\?|$)/i.test(url) || !url.includes("/"))
    return { kind: "file" };
  if (url.endsWith(".mp4") || url.endsWith(".webm") || url.includes("supabase"))
    return { kind: "file" };
  return { kind: "external" };
}

/** Judul platform untuk kartu fallback. */
function platformLabel(url: string): string {
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return url;
  }
}

/**
 * Galeri produk (desktop):
 * - Gambar utama besar + strip thumbnail di bawah; panah < > HANYA tampil
 *   bila thumbnail melebihi kapasitas baris (perlu scroll).
 * - Video produk jadi slide pertama; klik play = diputar inline di tempat
 *   (YouTube via embed, file video via <video>) - tanpa popup/lightbox.
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
  const [playing, setPlaying] = useState(false);
  // Zoom hover ala Tokopedia: skala 2x dengan titik fokus mengikuti kursor.
  // Dipicu lewat onMouseMove (bukan enter/leave) + reset tuntas di mouseleave,
  // pindah slide, dan pergantian media - agar tidak pernah "nyangkut".
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);
  // Thumbnail untuk link platform yang tidak bisa di-embed (og:image via proxy).
  const [extThumb, setExtThumb] = useState<{ image: string | null; host: string } | null>(null);

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

  // Susun media: video produk dulu, lalu foto.
  const media: { type: "video" | "image"; url: string }[] = [
    ...(videoUrl ? [{ type: "video" as const, url: videoUrl }] : []),
    ...images.filter(Boolean).map((url) => ({ type: "image" as const, url })),
  ];
  const count = media.length;
  const current = media[index];

  const goTo = (i: number) => {
    setIndex(i);
    setPlaying(false);
    setZoom(null);
    setExtThumb(null);
  };
  const prev = () => goTo((index - 1 + count) % count);
  const next = () => goTo((index + 1) % count);

  // Link eksternal (platform tanpa embed publik): ambil og:image untuk thumbnail.
  useEffect(() => {
    if (!player || player.kind !== "external") {
      setExtThumb(null);
      return;
    }
    let alive = true;
    fetch(`/api/link-preview?url=${encodeURIComponent(current.url)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (alive && d) setExtThumb({ image: d.image ?? null, host: d.host ?? platformLabel(current.url) });
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  // Tidak ada media sama sekali: tampilkan placeholder.
  if (count === 0) {
    return (
      <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-surface">
        <ProductImage src={null} alt={alt} categorySlug={categorySlug} className="h-full w-full" />
      </div>
    );
  }

  const isVideo = current?.type === "video";
  const player = current && isVideo ? resolvePlayer(current.url) : null;
  const embedSrc =
    player && player.kind !== "file" && player.kind !== "external" ? player.src : null;

  return (
    <div>
      {/* ===== Media utama ===== */}
      <div
        className="group relative aspect-[4/3] overflow-hidden rounded-xl bg-surface"
        onMouseMove={(e) => {
          if (isVideo) return;
          const r = e.currentTarget.getBoundingClientRect();
          setZoom({
            x: ((e.clientX - r.left) / r.width) * 100,
            y: ((e.clientY - r.top) / r.height) * 100,
          });
        }}
        onMouseLeave={() => setZoom(null)}
      >
        {isVideo && playing && embedSrc ? (
          <iframe
            key={current.url}
            src={embedSrc}
            title={alt}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="h-full w-full"
          />
        ) : isVideo && player?.kind === "file" && playing ? (
          <video
            key={current.url}
            src={current.url}
            controls
            autoPlay
            playsInline
            className="h-full w-full bg-black"
          />
        ) : isVideo && player?.kind === "external" ? (
          /* Platform tanpa embed publik: thumbnail + tombol buka di tab baru. */
          <a
            href={current.url}
            target="_blank"
            rel="noreferrer"
            className="group/play relative block h-full w-full bg-black"
          >
            {extThumb?.image ? (
                <img
                src={`/api/link-preview/image?url=${encodeURIComponent(extThumb.image)}`}
                alt={alt}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="flex h-full w-full items-center justify-center bg-navy text-xs text-white/80">
                {extThumb?.host ?? platformLabel(current.url)}
              </span>
            )}
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 shadow-lg transition group-hover/play:scale-110">
                <Play className="h-8 w-8 fill-brand text-brand" />
              </span>
            </span>
            <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3 pt-8 text-center text-xs font-semibold text-white">
              Buka di {platformLabel(current.url)}
            </span>
          </a>
        ) : isVideo ? (
          <button
            type="button"
            onClick={() => setPlaying(true)}
            aria-label="Putar video"
            className="group/play relative block h-full w-full"
          >
            <video
              key={current.url}
              src={current.url}
              muted
              playsInline
              preload="metadata"
              className="h-full w-full bg-black object-cover"
            />
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 shadow-lg transition group-hover/play:scale-110">
                <Play className="h-8 w-8 fill-brand text-brand" />
              </span>
            </span>
          </button>
        ) : (
          <div
            key={current.url}
            className="h-full w-full bg-white transition-transform duration-200 ease-out"
            style={
              zoom
                ? {
                    transform: "scale(2)",
                    transformOrigin: `${zoom.x}% ${zoom.y}%`,
                  }
                : undefined
            }
          >
            <ProductImage
              src={current.url}
              alt={`${alt} - foto ${index + 1}`}
              categorySlug={categorySlug}
              fit="contain"
              className="h-full w-full"
            />
          </div>
        )}

        {/* Badge counter dihapus */}

        {/* Panah: muncul saat hover */}
        {count > 1 && (
          <>
            <CarouselArrow side="left" onClick={prev} />
            <CarouselArrow side="right" onClick={next} />
          </>
        )}
      </div>

      {/* ===== Strip thumbnail di bawah ===== */}
      {count > 1 && (
        <div className="mt-3 flex items-center gap-2">
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
                onClick={() => goTo(i)}
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
                    fit="contain"
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
