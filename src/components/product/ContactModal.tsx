"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  ArrowUpRight,
  Check,
  ChevronDown,
  Copy,
  ExternalLink,
  Globe,
  Mail,
  MapPin,
  MessageCircle,
  User,
  X,
} from "lucide-react";
import type { OwnerContact, Product } from "@/lib/types";
import { waLink, formatLocation } from "@/lib/utils";
import { BRAND, BrandIcon } from "@/components/branding/BrandIcon";
import { MiniMap } from "@/components/product/MiniMap";

/** Warna resmi tiap brand - sama dengan ShareButtons (Bagikan Produk). */
const SOCIAL_ITEMS = [
  { key: "whatsapp", label: "WhatsApp", color: "bg-[#25D366]", path: BRAND.whatsapp },
  { key: "instagram", label: "Instagram", color: "bg-[#E4405F]", path: BRAND.instagram },
  { key: "linkedin", label: "LinkedIn", color: "bg-[#0A66C2]", path: BRAND.linkedin },
  { key: "twitter", label: "X (Twitter)", color: "bg-[#0f1419]", path: BRAND.x },
  { key: "facebook", label: "Facebook", color: "bg-[#1877F2]", path: BRAND.facebook },
] as const;


/**
 * Pop-up kartu kontak lengkap pemilik produk.
 * Kontak diambil on-demand oleh ContactOwnerButton dari endpoint rate-limited -
 * komponen ini hanya menampilkan hasilnya (loading / error / data).
 */
export function ContactModal({
  product,
  contact,
  contactError,
  open,
  onClose,
}: {
  product: Product;
  contact: OwnerContact | null;
  contactError: string | null;
  open: boolean;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    setCopied(false);
    setProfileOpen(false);
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  if (contactError) {
    return createPortal(
      <div
        className="animate-overlay-in fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-navy-deep/60 p-4"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-label={`Kontak pemilik ${product.name}`}
      >
        <div
          className="animate-modal-in w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <h3 className="text-lg font-bold">Hubungi Pemilik</h3>
          <p className="mt-2 text-sm text-muted">{contactError}</p>
          <button
            onClick={onClose}
            className="mt-4 w-full rounded-lg bg-surface py-2.5 text-sm font-semibold text-navy hover:bg-line"
          >
            Tutup
          </button>
        </div>
      </div>,
      document.body,
    );
  }

  // Kontak belum termuat (fetch sedang berjalan).
  if (!contact) {
    return createPortal(
      <div
        className="animate-overlay-in fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-navy-deep/60 p-4"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-label={`Kontak pemilik ${product.name}`}
      >
        <div
          className="animate-modal-in w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <h3 className="text-lg font-bold">Hubungi Pemilik</h3>
          <div className="mt-5 space-y-2.5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-16 animate-pulse rounded-xl border border-line/70 bg-surface/40"
              />
            ))}
          </div>
          <div className="mt-5 h-12 animate-pulse rounded-xl bg-surface" />
        </div>
      </div>,
      document.body,
    );
  }

  const initial = contact.ownerName.trim().charAt(0).toUpperCase() || "?";
  // Expand profil hanya kalau pemilik benar-benar melengkapi profilnya.
  const hasProfileInfo = Boolean(
    contact.profile?.avatarUrl || contact.profile?.fullName || contact.profile?.memberSince,
  );
  const socials = contact.socials
    ? SOCIAL_ITEMS.filter((s) => contact.socials?.[s.key])
    : [];

  async function copyEmail() {
    if (!contact) return;
    try {
      await navigator.clipboard.writeText(contact.ownerEmail);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard tidak tersedia - biarkan tombol diam */
    }
  }

  // Peta real-time: pakai koordinat GPS persis saat pengajuan bila tersedia,
  // fallback ke nama kota/negara untuk produk lama tanpa koordinat.
  const hasCoords = product.latitude != null && product.longitude != null;
  const coordsQuery = hasCoords
    ? `${product.latitude},${product.longitude}`
    : encodeURIComponent(formatLocation(product));
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${coordsQuery}`;

  const rows: {
    icon: typeof User;
    label: string;
    value: string;
    href?: string;
    hint?: string;
  }[] = [
    {
      icon: Mail,
      label: "Email",
      value: contact.ownerEmail,
      href: `mailto:${contact.ownerEmail}`,
    },
  ];
  if (contact.website)
    rows.push({
      icon: Globe,
      label: "Website",
      value: contact.website,
      href: normalizeUrl(contact.website),
    });

  return createPortal(
    <div
      className="animate-overlay-in fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-navy-deep/60 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Kontak pemilik ${product.name}`}
    >
      <div
        className="animate-modal-in w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header: avatar inisial + identitas pemilik */}
        <div className="relative bg-gradient-to-br from-navy-deep to-navy px-6 pb-5 pt-6 text-white">
          <button
            onClick={onClose}
            aria-label="Tutup"
            className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/80 transition hover:bg-white/20 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setProfileOpen((v) => !v)}
            aria-expanded={profileOpen}
            className="flex w-full items-center gap-4 text-left"
          >
            <div
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand text-xl font-bold text-white ring-2 ring-white/20"
              aria-hidden="true"
            >
              {contact.profile?.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={contact.profile.avatarUrl}
                  alt=""
                  className="h-full w-full rounded-full object-cover"
                />
              ) : (
                initial
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-white/60">
                Hubungi Pemilik
              </p>
              <h3 className="mt-0.5 truncate text-lg font-bold leading-tight">
                {contact.ownerName}
              </h3>
              <p className="truncate text-sm text-white/70">
                Pemilik {product.name}
              </p>
            </div>
            {hasProfileInfo && (
              <>
                <ChevronDown
                  className={`h-5 w-5 shrink-0 text-white/70 transition-transform duration-300 ${profileOpen ? "rotate-180" : ""}`}
                  aria-hidden="true"
                />
              </>
            )}
          </button>
          {/* Panel detail profil - hanya muncul bila pemilik melengkapi profilnya */}
          {hasProfileInfo && (
            <div
              className={`grid transition-all duration-300 ease-out ${profileOpen ? "mt-4 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
            >
              <div className="overflow-hidden">
                <div className="flex items-center gap-3 rounded-xl bg-white/10 p-4 ring-1 ring-white/15">
                  <div
                    className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/15 text-base font-bold text-white"
                    aria-hidden="true"
                  >
                    {contact.profile?.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={contact.profile.avatarUrl}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      initial
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-white">
                      {contact.profile?.fullName ?? contact.ownerName}
                    </p>
                    {contact.profile?.memberSince && (
                      <p className="text-xs text-white/70">
                        Bergabung sejak{" "}
                        {new Date(contact.profile.memberSince).toLocaleDateString("id-ID", {
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        {/* Garis aksen brand di bawah header */}
        <div
          className="h-1 bg-gradient-to-r from-brand via-brand/50 to-transparent"
          aria-hidden="true"
        />

        {/* Detail kontak - kartu lembut per baris */}
        <dl className="space-y-2.5 px-5 pt-5">
          {rows.map((r) => (
            <div
              key={r.label}
              className="group flex items-center gap-3.5 rounded-xl border border-line/70 bg-surface/40 px-4 py-3 transition hover:border-navy/25 hover:bg-surface"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-brand shadow-sm ring-1 ring-line/60 transition group-hover:bg-brand-soft group-hover:ring-brand/20">
                <r.icon className="h-4 w-4" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <dt className="text-[11px] font-medium uppercase tracking-wide text-muted">
                  {r.label}
                </dt>
                <dd className="truncate text-sm font-semibold text-navy">
                  {r.href ? (
                    <a
                      href={r.href}
                      target={r.href.startsWith("mailto:") ? undefined : "_blank"}
                      rel="noopener noreferrer"
                      className="transition hover:text-brand"
                    >
                      {r.value}
                    </a>
                  ) : (
                    r.value
                  )}
                  {r.hint && (
                    <span className="block truncate text-[11px] font-normal text-muted">
                      {r.hint}
                    </span>
                  )}
                </dd>
              </div>
              {/* Aksi cepat: salin email langsung di barisnya */}
              {r.label === "Email" && (
                <button
                  onClick={copyEmail}
                  aria-label="Salin email pemilik"
                  title="Salin email"
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition ${
                    copied
                      ? "border-green-500/40 bg-green-50 text-green-600"
                      : "border-line bg-white text-muted hover:border-navy/40 hover:text-navy"
                  }`}
                >
                  {copied ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </button>
              )}
              {r.href && r.label !== "Email" && (
                <span className="shrink-0 text-muted transition group-hover:text-brand">
                  <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                </span>
              )}
            </div>
          ))}
          {copied && (
            <p
              className="pt-0.5 text-center text-xs font-medium text-green-600"
              role="status"
            >
              Email tersalin ke clipboard
            </p>
          )}
        </dl>

        {/* Peta lokasi real - embed interaktif, pin persis di koordinat GPS saat pengajuan */}
        <div className="mx-5 mt-5 overflow-hidden rounded-xl border border-line/70 shadow-sm">
          <div className="flex items-center justify-between gap-2 bg-surface/60 px-4 py-2.5">
            <p className="flex min-w-0 items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-muted">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-brand" aria-hidden="true" />
              <span className="truncate">
                Lokasi Seller{hasCoords ? " - Koordinat GPS" : ""}
              </span>
            </p>
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex shrink-0 items-center gap-1 text-[11px] font-semibold text-brand transition hover:text-brand-dark"
            >
              Google Maps
              <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
            </a>
          </div>
          {hasCoords ? (
            <MiniMap
              latitude={product.latitude!}
              longitude={product.longitude!}
              label={`Lokasi ${product.name}`}
            />
          ) : (
            <p className="flex h-48 items-center justify-center bg-surface px-4 text-center text-xs text-muted">
              Koordinat GPS belum tersedia untuk produk ini - lokasi tercatat:{" "}
              {formatLocation(product)}
            </p>
          )}
          {hasCoords && (
            <p className="bg-white px-4 py-2 text-[11px] text-muted">
              Titik persis: {product.latitude!.toFixed(5)}, {product.longitude!.toFixed(5)} ·{" "}
              {formatLocation(product)}
            </p>
          )}
        </div>

        {/* Sosmed publik pemilik (kalau dia mengisinya di profil) */}
        {socials.length > 0 && (
          <div className="mx-5 mt-5 border-t border-line pt-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">
              Media Sosial Pemilik
            </p>
            <div className="mt-3 flex flex-wrap gap-2.5">
              {socials.map(({ key, label, color, path }) => (
                <a
                  key={key}
                  href={contact.socials?.[key] ?? "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  title={label}
                  className={`flex h-10 w-10 items-center justify-center rounded-full text-white transition hover:-translate-y-0.5 hover:opacity-90 ${color}`}
                >
                  <BrandIcon path={path} className="h-4.5 w-4.5" />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* CTA utama */}
        <div className="px-5 pb-6 pt-5">
          <a
            href={waLink(contact.ownerWhatsapp)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-3.5 text-sm font-semibold text-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-brand-dark hover:shadow-md active:translate-y-0 active:shadow-sm"
          >
            <MessageCircle className="h-4.5 w-4.5" aria-hidden="true" />
            Chat via WhatsApp
          </a>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function normalizeUrl(url: string) {
  return url.startsWith("http") ? url : `https://${url}`;
}
