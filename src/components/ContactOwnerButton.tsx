"use client";

import { useState } from "react";
import { Phone } from "lucide-react";
import type { Product } from "@/lib/types";
import { ContactModal } from "./ContactModal";

/** Tombol "Hubungi Pemilik" yang membuka modal pop-up (sesuai PRD MVP). */
export function ContactOwnerButton({ product }: { product: Product }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-brand px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark"
      >
        <Phone className="h-4.5 w-4.5" aria-hidden="true" />
        Hubungi Pemilik
      </button>
      <ContactModal product={product} open={open} onClose={() => setOpen(false)} />
    </>
  );
}
