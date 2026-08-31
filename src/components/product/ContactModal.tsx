"use client";

import { useEffect } from "react";
import { MessageCircle, X } from "lucide-react";
import type { OwnerContact, Product } from "@/lib/types";
import { waLink, formatLocation } from "@/lib/utils";

/**
 * Modal pop-up kontak pemilik produk (PRD: menggantikan tombol "Saya Tertarik").
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
  useEffect(() => {
    if (!open) return;
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

  const rows: { label: string; value: string; href?: string }[] = [
    { label: "Nama Pemilik", value: contact.ownerName },
    { label: "Email", value: contact.ownerEmail, href: `mailto:${contact.ownerEmail}` },
    { label: "Lokasi", value: formatLocation(product) },
  ];
  if (contact.website)
    rows.push({ label: "Website", value: contact.website, href: normalizeUrl(contact.website) });

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
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold">Hubungi Pemilik</h3>
            <p className="mt-0.5 text-sm text-muted">{product.name}</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface text-muted hover:bg-line"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <dl className="mt-5 space-y-3.5">
          {rows.map((r) => (
            <div key={r.label} className="flex items-start justify-between gap-4 text-sm">
              <dt className="shrink-0 font-medium text-muted">{r.label}</dt>
              <dd className="text-right font-semibold break-all">
                {r.href ? (
                  <a href={r.href} target="_blank" rel="noopener noreferrer" className="text-navy hover:text-brand">
                    {r.value}
                  </a>
                ) : (
                  r.value
                )}
              </dd>
            </div>
          ))}
        </dl>

        <a
          href={waLink(contact.ownerWhatsapp)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-brand py-3 text-sm font-semibold text-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-brand-dark hover:shadow-md active:translate-y-0 active:shadow-sm"
        >
          <MessageCircle className="h-4.5 w-4.5" aria-hidden="true" />
          Chat via WhatsApp
        </a>
        <p className="mt-3 text-center text-xs text-muted">
          Pemilik akan dihubungi melalui email Anda.
        </p>
      </div>
    </div>
  );
}

function normalizeUrl(url: string) {
  return url.startsWith("http") ? url : `https://${url}`;
}
