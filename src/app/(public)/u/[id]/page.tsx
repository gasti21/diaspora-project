import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CalendarDays, Eye, Package, ShieldCheck } from "lucide-react";
import { CircleUserRound } from "lucide-react";
import { getPublicMember, listMemberPublishedProducts, getProductViewCounts, listMyFavoriteProductIds } from "@/lib/data";
import { getSessionUser } from "@/lib/auth";
import type { ProfileSocials } from "@/lib/data";
import { ProductCard } from "@/components/product/ProductCard";
import { formatDate } from "@/lib/utils";
import {
  FacebookIcon,
  InstagramIcon,
  LinkedInIcon,
  WhatsAppIcon,
  XIcon,
} from "@/components/member/SocialIcons";

/** Baris ikon sosmed pemilik (hanya yang terisi) - link sungguhan ke platform. */
const SOCIAL_META: { key: keyof ProfileSocials; label: string; icon: typeof InstagramIcon }[] = [
  { key: "instagram", label: "Instagram", icon: InstagramIcon },
  { key: "whatsapp", label: "WhatsApp", icon: WhatsAppIcon },
  { key: "linkedin", label: "LinkedIn", icon: LinkedInIcon },
  { key: "twitter", label: "X / Twitter", icon: XIcon },
  { key: "facebook", label: "Facebook", icon: FacebookIcon },
];

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const member = await getPublicMember(id);
  if (!member) return {};
  return {
    title: `${member.name} — Portofolio`,
    description: `Portofolio ${member.name}: ${member.productCount} produk karya diaspora di KaryaDiaspora.`,
  };
}

/** Halaman publik portofolio member: semua produk tayang miliknya. */
export default async function MemberProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const member = await getPublicMember(id);
  // Profil tanpa satu pun produk tayang tidak diindeks/diakses publik.
  if (!member || member.productCount === 0) notFound();

  const user = await getSessionUser();
  const favoriteIds = user ? await listMyFavoriteProductIds(user.id) : new Set<string>();
  const products = await listMemberPublishedProducts(id);
  const viewCounts = await getProductViewCounts(products.map((p) => p.id));
  const totalViews = Object.values(viewCounts).reduce((a, b) => a + b, 0);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      {/* Header profil */}
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-line bg-white p-8 text-center shadow-sm sm:flex-row sm:items-center sm:gap-6 sm:text-left">
        <span className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border border-line bg-surface text-navy">
          {member.avatarUrl ? (
            <img
              src={member.avatarUrl}
              alt={`Foto profil ${member.name}`}
              className="h-full w-full object-cover"
            />
          ) : (
            <CircleUserRound className="h-10 w-10" aria-hidden="true" />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-extrabold text-navy">{member.name}</h1>
          <p className="mt-1 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm text-muted sm:justify-start">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="h-4 w-4" aria-hidden="true" />
              Bergabung {formatDate(member.joinedAt)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Package className="h-4 w-4" aria-hidden="true" />
              {member.productCount} produk tayang
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Eye className="h-4 w-4" aria-hidden="true" />
              {totalViews} total dilihat
            </span>
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-green-600" aria-hidden="true" />
              Member terverifikasi
            </span>
          </p>
          {member.bio && (
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">{member.bio}</p>
          )}
          {/* Ikon sosmed pemilik - hanya yang diisi member */}
          {SOCIAL_META.some((s) => member.socials[s.key]) && (
            <div className="mt-3 flex items-center justify-center gap-1.5 sm:justify-start">
              {SOCIAL_META.map(({ key, label, icon: Icon }) =>
                member.socials[key] ? (
                  <a
                    key={key}
                    href={member.socials[key]!}
                    target="_blank"
                    rel="noopener noreferrer me"
                    aria-label={label}
                    title={label}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-line text-muted transition hover:border-brand/40 hover:text-brand"
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                ) : null
              )}
            </div>
          )}
        </div>
      </div>

      {/* Portofolio */}
      <h2 className="mt-10 text-lg font-extrabold text-navy">Karya &amp; Produk</h2>
      {products.length > 0 ? (
        <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} favoriteIds={favoriteIds} />
          ))}
        </div>
      ) : (
        <div className="mt-4 rounded-2xl border border-dashed border-line bg-white px-6 py-14 text-center">
          <Package className="mx-auto h-9 w-9 text-muted/40" aria-hidden="true" />
          <p className="mt-3 text-sm font-semibold text-navy">Belum ada produk tayang</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted">
            Produk yang sudah disetujui admin akan tampil di sini.
          </p>
        </div>
      )}
    </div>
  );
}
