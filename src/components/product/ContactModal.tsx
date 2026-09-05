"use client";

import { useEffect, useState } from "react";
import { Lock, MessageCircle, Send, X } from "lucide-react";
import { useToast } from "@/components/toast/ToastProvider";
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

  // ---- Email relay: kirim pesan ke pemilik tanpa membuka email pemilik ----
  const toast = useToast();
  const [msg, setMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  async function sendMessage() {
    const text = msg.trim();
    if (!text || sending) return;
    setSending(true);
    try {
      const res = await fetch(`/api/products/${product.id}/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, company: "" }), // company = honeypot
      });
      const json = (await res.json()) as { error?: string };
      if (res.status === 401) {
        toast.info("Masuk untuk mengirim pesan langsung ke pemilik.", { title: "Masuk dulu ya" });
        return;
      }
      if (!res.ok) {
        toast.error(json.error ?? "Gagal mengirim pesan.");
        return;
      }
      setSent(true);
      setMsg("");
      toast.success("Pesan terkirim ke pemilik produk.");
    } catch {
      toast.error("Koneksi bermasalah. Coba lagi.");
    } finally {
      setSending(false);
    }
  }

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

        {/* Sosmed publik pemilik (kalau dia mengisinya di profil) */}
        {contact.socials && (
          <div className="mt-4 border-t border-line pt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              Media Sosial Pemilik
            </p>
            <div className="mt-2.5 flex flex-wrap gap-2">
              {(
                [
                  { key: "whatsapp", url: contact.socials.whatsapp, label: "WhatsApp" },
                  { key: "instagram", url: contact.socials.instagram, label: "Instagram" },
                  { key: "linkedin", url: contact.socials.linkedin, label: "LinkedIn" },
                  { key: "twitter", url: contact.socials.twitter, label: "X (Twitter)" },
                  { key: "facebook", url: contact.socials.facebook, label: "Facebook" },
                ] as const
              )
                .filter((s) => s.url)
                .map((s) => (
                  <a
                    key={s.key}
                    href={s.url ?? "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.label}
                    title={s.label}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-surface text-navy transition hover:bg-brand hover:text-white"
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

        {/* Kirim pesan via platform (email relay) */}
        <div className="mt-5 rounded-xl border border-line bg-surface/60 p-4">
          {sent ? (
            <p className="flex items-center gap-2 text-sm font-medium text-green-700">
              <Send className="h-4 w-4" aria-hidden="true" />
              Pesan terkirim! Pemilik akan membalas ke email Anda.
            </p>
          ) : (
            <>
              <p className="text-xs font-semibold text-navy">
                Kirim pesan langsung - email pemilik tetap terlindungi
              </p>
              <textarea
                value={msg}
                onChange={(e) => setMsg(e.target.value)}
                rows={3}
                maxLength={2000}
                placeholder="Contoh: Halo, saya tertarik dengan produk Anda. Bisa info harga & pengiriman?"
                className="mt-2 w-full resize-none rounded-lg border border-line bg-white px-3 py-2 text-sm text-navy outline-none transition placeholder:text-muted/60 focus:border-brand/50"
              />
              <div className="mt-2 flex items-center justify-between">
                <span className="text-[11px] text-muted/70">{msg.length}/2000</span>
                <button
                  onClick={() => void sendMessage()}
                  disabled={sending || !msg.trim()}
                  className="flex items-center gap-1.5 rounded-lg bg-navy px-3.5 py-2 text-xs font-bold text-white transition hover:bg-navy-dark disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Send className="h-3.5 w-3.5" aria-hidden="true" />
                  {sending ? "Mengirim…" : "Kirim Pesan"}
                </button>
              </div>
              <p className="mt-2 flex items-center gap-1 text-[11px] text-muted/70">
                <Lock className="h-3 w-3" aria-hidden="true" />
                Perlu masuk. Maks 3 pesan/jam untuk mencegah spam.
              </p>
            </>
          )}
        </div>

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
