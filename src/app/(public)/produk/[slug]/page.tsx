import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  ChevronLeft,
  Globe,
  Mail,
  MapPin,
  MessageCircle,
  ShieldCheck,
  User,
  type LucideIcon,
} from "lucide-react";
import { ImageCarousel } from "@/components/product/ImageCarousel";
import { CategoryBadge, StageBadge, NeedTag } from "@/components/product/Badges";
import { ContactOwnerButton } from "@/components/product/ContactOwnerButton";
import { ProductTabs } from "@/components/product/ProductTabs";
import { ProductCard } from "@/components/product/ProductCard";
import { ShareButtons } from "@/components/product/ShareButtons";
import { FavoriteButton } from "@/components/product/FavoriteButton";
import { getProductBySlug, getRelatedProducts } from "@/lib/data";
import { ViewTracker } from "@/components/product/ViewTracker";
import { SITE_URL } from "@/lib/supabase/config";
import { countryFlag, formatLocation, waLink } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return {};

  const title = product.name;
  const description = product.shortDescription;
  const image = product.images?.[0];

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      images: image ? [{ url: image, alt: product.name }] : undefined,
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const related = await getRelatedProducts(product);
  const specs: { label: string; value: string }[] = [
    { label: "Jenis Produk", value: product.categoryName ?? "-" },
    { label: "Tahap Produk", value: product.stage },
    ...(product.yearFounded
      ? [{ label: "Tahun Berdiri", value: String(product.yearFounded) }]
      : []),
    { label: "Negara", value: product.country },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <ViewTracker productId={product.id} />
      <Link
        href="/explore"
        className="inline-flex items-center gap-1 text-sm font-medium text-muted transition hover:text-brand"
      >
        <ChevronLeft className="h-4 w-4" aria-hidden="true" /> Kembali ke Explore
      </Link>

      <div className="mt-5 grid gap-10 lg:grid-cols-[1fr_420px]">
        {/* ===== Kolom kiri: galeri + tabs ===== */}
        <div>
          <ImageCarousel
            images={product.images}
            alt={product.name}
            categorySlug={product.categorySlug}
          />

          <div className="hidden lg:block">
            <ProductTabs product={product} />
          </div>
        </div>

        {/* ===== Kolom kanan: info + kontak ===== */}
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">{product.name}</h1>
          <div className="mt-3 flex flex-wrap gap-2">
            <CategoryBadge name={product.categoryName} slug={product.categorySlug} />
            <StageBadge stage={product.stage} />
          </div>
          <p className="mt-3 flex items-center gap-1.5 text-sm text-muted">
            <span>{countryFlag(product.country)}</span>
            {formatLocation(product)}
          </p>
          <p className="mt-3 text-justify text-sm leading-relaxed text-navy/85">
            {product.shortDescription}
          </p>

          {product.needs.length > 0 && (
            <div className="mt-5 rounded-xl border border-line bg-white p-4">
              <h2 className="text-sm font-bold">Kebutuhan</h2>
              <div className="mt-2.5 flex flex-wrap gap-2">
                {product.needs.map((n) => (
                  <NeedTag key={n} need={n} />
                ))}
                {product.needsOther && <NeedTag need={product.needsOther} />}
              </div>
            </div>
          )}

          <dl className="mt-5 divide-y divide-line rounded-xl border border-line bg-white px-4">
            {specs.map((s) => (
              <div key={s.label} className="flex justify-between gap-4 py-3 text-sm">
                <dt className="text-muted">{s.label}</dt>
                <dd className="font-semibold">{s.value}</dd>
              </div>
            ))}
          </dl>

          {/* PRD MVP: "Hubungi Pemilik" + simpan ke favorit */}
          <div className="mt-5 flex gap-3">
            <ContactOwnerButton product={product} />
            <FavoriteButton product={product} variant="detail" />
          </div>
          <p className="mt-2.5 flex items-center gap-1.5 text-xs text-muted">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
            Pemilik akan dihubungi melalui email Anda.
          </p>

          {/* Sidebar informasi kontak */}
          <div className="mt-6 rounded-xl border border-line bg-white p-5">
            <h2 className="font-bold">Informasi Kontak</h2>
            <dl className="mt-4 space-y-3.5 text-sm">
              <Row
                icon={User}
                label="Nama Pemilik"
                value={product.ownerName}
                href={product.submittedBy ? `/u/${product.submittedBy}` : undefined}
              />
              <Row icon={MapPin} label="Lokasi" value={formatLocation(product)} />
              {product.website && (
                <Row
                  icon={Globe}
                  label="Website"
                  value={product.website}
                  href={product.website.startsWith("http") ? product.website : `https://${product.website}`}
                />
              )}
              {/* Email & WhatsApp pemilik tidak dirender di sini: kontak diambil
                  on-demand via tombol "Hubungi Pemilik" (anti-scraping, migration 0005). */}
            </dl>

            <div className="mt-5 border-t border-line pt-4">
              <h3 className="text-sm font-bold">Bagikan Produk</h3>
              <div className="mt-3">
                <ShareButtons url={`${SITE_URL}/produk/${product.slug}`} title={product.name} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs tampil di bawah pada layar kecil */}
      <div className="lg:hidden">
        <ProductTabs product={product} />
      </div>

      {/* ===== Produk Terkait ===== */}
      {related.length > 0 && (
        <section className="mt-14">
          <h2 className="text-2xl font-extrabold">Produk Terkait</h2>
          <div className="mt-6 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-5">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function Row({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  href?: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex h-5 w-5 shrink-0 items-center justify-center text-muted" aria-hidden="true">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <dt className="text-xs text-muted">{label}</dt>
        <dd className="font-semibold break-all">
          {href ? (
            href.startsWith("/") ? (
              <Link href={href} className="hover:text-brand">
                {value}
              </Link>
            ) : (
              <a href={href} target="_blank" rel="noopener noreferrer" className="hover:text-brand">
                {value}
              </a>
            )
          ) : (
            value
          )}
        </dd>
      </div>
    </div>
  );
}
