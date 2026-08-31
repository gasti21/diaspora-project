"use client";


import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ProductImage } from "./ProductImage";
import { cn } from "@/lib/utils";

/** Galeri foto produk: gambar utama + deretan thumbnail. */
export function ImageCarousel({
  images,
  alt,
  categorySlug,
}: {
  images: string[];
  alt: string;
  categorySlug?: string | null;
}) {
  const [index, setIndex] = useState(0);
  const count = Math.max(images.length, 1);
  const current = images[index];

  return (
    <div>
      <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-surface">
        <ProductImage
          key={current ?? index}
          src={current}
          alt={alt}
          categorySlug={categorySlug}
          className="h-full w-full"
        />
        {count > 1 && (
          <>
            <CarouselButton
              side="left"
              onClick={() => setIndex((i) => (i - 1 + count) % count)}
            />
            <CarouselButton
              side="right"
              onClick={() => setIndex((i) => (i + 1) % count)}
            />
            <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
              {images.map((_, i) => (
                <span
                  key={i}
                  className={cn(
                    "h-2 w-2 rounded-full transition",
                    i === index ? "bg-white" : "bg-white/50"
                  )}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {count > 1 && (
        <div className="mt-3 flex items-center gap-2">
          <button
            onClick={() => setIndex((i) => (i - 1 + count) % count)}
            aria-label="Foto sebelumnya"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line bg-white text-navy hover:border-navy/40"
          >
            <ChevronLeft className="h-4.5 w-4.5" />
          </button>
          <div className="flex flex-1 gap-2 overflow-x-auto pb-1">
            {images.map((img, i) => (
              <button
                key={i}
                onClick={() => setIndex(i)}
                aria-label={`Foto ${i + 1}`}
                className={cn(
                  "h-16 w-20 shrink-0 overflow-hidden rounded-lg border-2 transition",
                  i === index ? "border-brand" : "border-transparent opacity-80 hover:opacity-100"
                )}
              >
                <ProductImage
                  src={img}
                  alt={`${alt} - foto ${i + 1}`}
                  categorySlug={categorySlug}
                  className="h-full w-full"
                />
              </button>
            ))}
          </div>
          <button
            onClick={() => setIndex((i) => (i + 1) % count)}
            aria-label="Foto berikutnya"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line bg-white text-navy hover:border-navy/40"
          >
            <ChevronRight className="h-4.5 w-4.5" />
          </button>
        </div>
      )}
    </div>
  );
}

function CarouselButton({ side, onClick }: { side: "left" | "right"; onClick: () => void }) {
  const Icon = side === "left" ? ChevronLeft : ChevronRight;
  return (
    <button
      onClick={onClick}
      aria-label={side === "left" ? "Foto sebelumnya" : "Foto berikutnya"}
      className={cn(
        "absolute top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-navy shadow hover:bg-white",
        side === "left" ? "left-3" : "right-3"
      )}
    >
      <Icon className="h-5 w-5" />
    </button>
  );
}
