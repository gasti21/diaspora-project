"use client";


import { useState } from "react";
import { FileText } from "lucide-react";
import type { Product, ProductReview } from "@/lib/types";
import { ProductReviews } from "./reviews/ProductReviews";
import { cn, formatLocation } from "@/lib/utils";

const TABS = ["Deskripsi", "Tentang Produk", "Ulasan", "Dokumen"] as const;

export function ProductTabs({
  product,
  viewer,
  reviews,
}: {
  product: Product;
  /** User login saat ini (null = tamu) - dipakai tab Ulasan. */
  viewer: { id: string; name: string; avatarUrl?: string } | null;
  reviews: ProductReview[];
}) {
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

        {tab === "Tentang Produk" && (
          <div className="space-y-5">
            {/* Satu kartu spesifikasi gabungan (tanpa duplikasi tahun/lokasi) */}
            <dl className="divide-y divide-line rounded-xl border border-line bg-white px-5">
              {[
                { label: "Jenis Produk", value: product.categoryName ?? "-" },
                { label: "Tahap Produk", value: product.stage },
                ...(product.yearFounded
                  ? [{ label: "Tahun Berdiri", value: String(product.yearFounded) }]
                  : []),
                { label: "Lokasi", value: formatLocation(product) },
                ...(product.website
                  ? [
                      {
                        label: "Website",
                        value: product.website,
                        href: product.website.startsWith("http")
                          ? product.website
                          : `https://${product.website}`,
                      },
                    ]
                  : []),
                ...(product.videoUrl
                  ? [{ label: "Video", value: product.videoUrl, href: product.videoUrl }]
                  : []),
              ].map((s) => (
                <div key={s.label} className="flex justify-between gap-4 py-3.5 text-sm">
                  <dt className="shrink-0 text-muted">{s.label}</dt>
                  <dd className="text-right font-semibold">
                    {s.href ? (
                      <a
                        href={s.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="break-all transition hover:text-brand"
                      >
                        {s.value}
                      </a>
                    ) : (
                      s.value
                    )}
                  </dd>
                </div>
              ))}
            </dl>

            {/* Catatan tambahan pemilik (kalau ada) */}
            {product.additionalNotes && (
              <div className="rounded-xl border border-line bg-white p-6">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                  Catatan Pemilik
                </p>
                <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-navy/90">
                  {product.additionalNotes}
                </p>
              </div>
            )}
          </div>
        )}

        {tab === "Ulasan" && (
          <ProductReviews productId={product.id} viewer={viewer} initialReviews={reviews} />
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
