"use client";


import { useState } from "react";
import { FileText } from "lucide-react";
import type { Product } from "@/lib/types";
import { ProductImage } from "./ProductImage";
import { BACKGROUND_TYPES } from "@/lib/constants";
import { cn, formatLocation } from "@/lib/utils";

const TABS = ["Deskripsi", "Tentang Pemilik", "Galeri", "Dokumen"] as const;

export function ProductTabs({ product }: { product: Product }) {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Deskripsi");

  return (
    <section className="mt-10">
      <div className="flex gap-6 overflow-x-auto border-b border-line">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "whitespace-nowrap border-b-2 pb-3 text-sm font-semibold transition",
              tab === t
                ? "border-brand text-navy"
                : "border-transparent text-muted hover:text-navy"
            )}
          >
            {t}
          </button>
        ))}
      </div>

      <div key={tab} className="animate-fade-in pt-6">
        {tab === "Deskripsi" && (
          <div className="rounded-xl border border-line bg-white p-6">
            <div className="space-y-4 whitespace-pre-line text-justify text-sm leading-relaxed text-navy/90">
              {product.longDescription}
            </div>
          </div>
        )}

        {tab === "Tentang Pemilik" && (
          <div className="rounded-xl border border-line bg-white p-6">
            <h3 className="font-bold">{product.ownerName}</h3>
            {product.backgroundTypes.length > 0 && (
              <p className="mt-1 text-sm text-muted">
                {product.backgroundTypes.join(" · ")} -{" "}
                {BACKGROUND_TYPES.includes(
                  product.backgroundTypes[0] as never
                )
                  ? "bagian dari ekosistem diaspora Indonesia"
                  : ""}
              </p>
            )}
            <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
              <Detail label="Lokasi" value={formatLocation(product)} />
              {product.yearFounded && (
                <Detail label="Tahun Berdiri" value={String(product.yearFounded)} />
              )}
              {product.website && (
                <Detail
                  label="Website"
                  value={product.website}
                  href={product.website.startsWith("http") ? product.website : `https://${product.website}`}
                />
              )}
              {product.videoUrl && (
                <Detail label="Video" value={product.videoUrl} href={product.videoUrl} />
              )}
            </dl>
            {product.additionalNotes && (
              <p className="mt-5 rounded-lg bg-surface p-4 text-sm text-navy/80">
                {product.additionalNotes}
              </p>
            )}
          </div>
        )}

        {tab === "Galeri" && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {(product.images.length > 0
              ? product.images
              : [null, null, null]
            ).map((img, i) => (
              <div key={i} className="aspect-[4/3] overflow-hidden rounded-xl bg-surface">
                <ProductImage
                  src={img}
                  alt={`${product.name} - galeri ${i + 1}`}
                  categorySlug={product.categorySlug}
                  className="h-full w-full"
                />
              </div>
            ))}
          </div>
        )}

        {tab === "Dokumen" && (
          <div className="rounded-xl border border-dashed border-line bg-surface/60 py-14 text-center">
            <FileText className="mx-auto h-8 w-8 text-muted" aria-hidden="true" />
            <p className="mt-3 text-sm text-muted">
              Dokumen produk belum tersedia.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

function Detail({ label, value, href }: { label: string; value: string; href?: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-muted">{label}</dt>
      <dd className="mt-0.5 font-semibold break-all">
        {href ? (
          <a href={href} target="_blank" rel="noopener noreferrer" className="text-navy hover:text-brand">
            {value}
          </a>
        ) : (
          value
        )}
      </dd>
    </div>
  );
}
