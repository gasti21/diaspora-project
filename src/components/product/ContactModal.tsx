"use client";

import { useEffect, useState } from "react";
import {
  Check,
  Copy,
  Globe,
  Mail,
  MapPin,
  MessageCircle,
  User,
  X,
} from "lucide-react";
import type { OwnerContact, Product } from "@/lib/types";
import { waLink, formatLocation } from "@/lib/utils";
import {
  InstagramIcon,
  WhatsAppIcon,
  LinkedInIcon,
  XIcon,
  FacebookIcon,
} from "@/components/member/SocialIcons";

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

  useEffect(() => {
    if (!open) return;
    setCopied(false);
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

  if (!open) return null;

  if (contactError) {
    return (
      <div
        className="animate-overlay-in fixed inset-0 z-50 flex items-center justify-center bg-navy-deep/60 p-4"
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
      </div>
    );
  }

  // Kontak belum termuat (fetch sedang berjalan).
  if (!contact) {
    return (
      <div
        className="animate-overlay-in fixed inset-0 z-50 flex items-center justify-center bg-navy-deep/60 p-4"
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
          <div className="mt-5 space-y-3.5">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-4 animate-pulse rounded bg-surface" />
            ))}
          </div>
          <div className="mt-6 h-11 animate-pulse rounded-lg bg-surface" />
        </div>
      </div>
    );
  }

  const initial = contact.ownerName.trim().charAt(0).toUpperCase() || "?";
  const socials = contact.socials
    ? ([
        { key: "whatsapp", url: contact.socials.whatsapp, label: "WhatsApp" },
        { key: "instagram", url: contact.socials.instagram, label: "Instagram" },
        { key: "linkedin", url: contact.socials.linkedin, label: "LinkedIn" },
        { key: "twitter", url: contact.socials.twitter, label: "X (Twitter)" },
        { key: "facebook", url: contact.socials.facebook, label: "Facebook" },
      ] as const).filter((s) => s.url)
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

  const rows: {
    icon: typeof User;
    label: string;
    value: string;
    href?: string;
  }[] = [
    { icon: User, label: "Nama Pemilik", value: contact.ownerName },
    {
      icon: Mail,
      label: "Email",
      value: contact.ownerEmail,
      href: `mailto:${contact.ownerEmail}`,
    },
    { icon: MapPin, label: "Lokasi", value: formatLocation(product) },
  ];
  if (contact.website)
    rows.push({
      icon: Globe,
      label: "Website",
      value: contact.website,
      href: normalizeUrl(contact.website),
    });

  return (
    <div
      className="animate-overlay-in fixed inset-0 z-50 flex items-center justify-center bg-navy-deep/60 p-4"
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
          <div className="flex items-center gap-3.5">
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand text-lg font-bold text-white shadow-inner"
              aria-hidden="true"
            >
              {initial}
            </div>
            <div className="min-w-0">
              <h3 className="truncate text-lg font-bold leading-tight">
                {contact.ownerName}
              </h3>
              <p className="truncate text-sm text-white/70">
                Pemilik {product.name}
              </p>
            </div>
          </div>
        </div>

        {/* Detail kontak */}
        <dl className="space-y-3 px-6 pt-5">
          {rows.map((r) => (
            <div
              key={r.label}
              className="flex items-center justify-between gap-4 text-sm"
            >
              <dt className="flex shrink-0 items-center gap-2.5 font-medium text-muted">
                <r.icon className="h-4 w-4 text-brand/70" aria-hidden="true" />
                {r.label}
              </dt>
              <dd className="min-w-0 text-right font-semibold break-all text-navy">
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
              </dd>
            </div>
          ))}
          {/* Salin email cepat */}
          <div className="flex items-center justify-between gap-4 pt-1">
            <span className="text-xs text-muted">Klik untuk menyalin email</span>
            <button
              onClick={copyEmail}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                copied
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-line bg-surface text-navy hover:border-brand/40 hover:text-brand"
              }`}
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5" /> Tersalin!
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" /> Salin Email
                </>
              )}
            </button>
          </div>
        </dl>

        {/* Sosmed publik pemilik (kalau dia mengisinya di profil) */}
        {socials.length > 0 && (
          <div className="mx-6 mt-5 border-t border-line pt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              Media Sosial Pemilik
            </p>
            <div className="mt-3 flex flex-wrap gap-2.5">
              {socials.map((s) => (
                <a
                  key={s.key}
                  href={s.url ?? "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  title={s.label}
                  className={`flex h-10 w-10 items-center justify-center rounded-full border transition-all duration-200 hover:-translate-y-0.5 hover:text-white ${socialHoverClass(s.key)}`}
                >
                  {s.key === "whatsapp" && <WhatsAppIcon className="h-4.5 w-4.5" />}
                  {s.key === "instagram" && <InstagramIcon className="h-4.5 w-4.5" />}
                  {s.key === "linkedin" && <LinkedInIcon className="h-4.5 w-4.5" />}
                  {s.key === "twitter" && <XIcon className="h-4 w-4" />}
                  {s.key === "facebook" && <FacebookIcon className="h-4.5 w-4.5" />}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* CTA utama */}
        <div className="px-6 pb-6 pt-5">
          <a
            href={waLink(contact.ownerWhatsapp)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand py-3 text-sm font-semibold text-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-brand-dark hover:shadow-md active:translate-y-0 active:shadow-sm"
          >
            <MessageCircle className="h-4.5 w-4.5" aria-hidden="true" />
            Chat via WhatsApp
          </a>
          <p className="mt-3 text-center text-xs text-muted">
            Email &amp; nomor WhatsApp resmi pemilik — balasan langsung dari
            pemilik produk.
          </p>
        </div>
      </div>
    </div>
  );
}

/** Warna hover brand untuk tiap ikon sosmed. */
function socialHoverClass(key: string) {
  switch (key) {
    case "whatsapp":
      return "border-emerald-200 bg-emerald-50 text-emerald-600 hover:border-emerald-500 hover:bg-emerald-500";
    case "instagram":
      return "border-pink-200 bg-pink-50 text-pink-600 hover:border-pink-500 hover:bg-pink-500";
    case "linkedin":
      return "border-sky-200 bg-sky-50 text-sky-700 hover:border-sky-600 hover:bg-sky-600";
    case "twitter":
      return "border-line bg-surface text-navy hover:border-navy hover:bg-navy";
    case "facebook":
      return "border-blue-200 bg-blue-50 text-blue-700 hover:border-blue-600 hover:bg-blue-600";
    default:
      return "border-line bg-surface text-navy hover:border-brand hover:bg-brand";
  }
}

function normalizeUrl(url: string) {
  return url.startsWith("http") ? url : `https://${url}`;
}
