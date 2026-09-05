"use client";

import { useState } from "react";
import { Phone } from "lucide-react";
import type { OwnerContact, Product } from "@/lib/types";
import { ContactModal } from "./ContactModal";

/**
 * Tombol "Hubungi Pemilik" yang membuka modal pop-up (sesuai PRD MVP).
 * Kontak TIDAK dikirim dari server saat render halaman - diambil saat modal
 * dibuka via endpoint rate-limited, agar PII pemilik tidak bisa di-scrape.
 */
export function ContactOwnerButton({ product }: { product: Product }) {
  const [open, setOpen] = useState(false);
  const [contact, setContact] = useState<OwnerContact | null>(null);
  const [contactError, setContactError] = useState<string | null>(null);

  async function openModal() {
    setOpen(true);
    setContactError(null);
    try {
      const res = await fetch(`/api/products/${product.id}/contact`);
      if (!res.ok) throw new Error();
      setContact(await res.json());
    } catch {
      // Mode demo (tanpa Supabase): produk contoh membawa kontaknya sendiri.
      if (product.ownerEmail) {
        setContact({
          productName: product.name,
          ownerName: product.ownerName,
          ownerEmail: product.ownerEmail,
          ownerWhatsapp: product.ownerWhatsapp,
          website: product.website ?? null,
          socials: null,
        });
      } else {
        setContactError("Kontak sementara tidak tersedia. Coba lagi nanti.");
      }
    }
  }

  return (
    <>
      <button
        onClick={openModal}
        className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-brand px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-brand-dark hover:shadow-md active:translate-y-0 active:shadow-sm"
      >
        <Phone className="h-4.5 w-4.5" aria-hidden="true" />
        Hubungi Pemilik
      </button>
      <ContactModal
        product={product}
        contact={contact}
        contactError={contactError}
        open={open}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
