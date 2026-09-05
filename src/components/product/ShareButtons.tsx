"use client";

import { useState } from "react";
import { Check, Link2 } from "lucide-react";
import { BRAND, BrandIcon } from "@/components/branding/BrandIcon";
import { shareUrls } from "@/lib/utils";

const ITEMS = [
  {
    key: "whatsapp",
    label: "WhatsApp",
    path: BRAND.whatsapp,
    tone: "bg-[#25D366]/10 text-[#128C4A] hover:bg-[#25D366] hover:text-white",
  },
  {
    key: "facebook",
    label: "Facebook",
    path: BRAND.facebook,
    tone: "bg-[#1877F2]/10 text-[#1877F2] hover:bg-[#1877F2] hover:text-white",
  },
  {
    key: "x",
    label: "X (Twitter)",
    path: BRAND.x,
    tone: "bg-[#0f1419]/10 text-[#0f1419] hover:bg-[#0f1419] hover:text-white",
  },
  {
    key: "linkedin",
    label: "LinkedIn",
    path: BRAND.linkedin,
    tone: "bg-[#0A66C2]/10 text-[#0A66C2] hover:bg-[#0A66C2] hover:text-white",
  },
] as const;

export function ShareButtons({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);
  const links = shareUrls(url, title);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard tidak tersedia (mis. http non-secure) - abaikan
    }
  }

  return (
    <div>
      {/* Baris ikon share - terbagi rata sepanjang kartu */}
      <div className="grid grid-cols-4 place-items-center">
        {ITEMS.map(({ key, label, tone, path }) => (
          <a
            key={key}
            href={links[key]}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Bagikan ke ${label}`}
            title={`Bagikan ke ${label}`}
            className={`flex h-10 w-10 items-center justify-center rounded-full transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${tone}`}
          >
            <BrandIcon path={path} className="h-4.5 w-4.5" />
          </a>
        ))}
      </div>

      {/* Bar salin tautan dengan preview URL */}
      <button
        onClick={copyLink}
        aria-label="Salin tautan produk"
        className={`mt-3 flex w-full items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-left transition ${
          copied
            ? "border-green-500/40 bg-green-50"
            : "border-line bg-surface/40 hover:border-navy/30 hover:bg-surface"
        }`}
      >
        {copied ? (
          <Check className="h-4 w-4 shrink-0 text-green-600" aria-hidden="true" />
        ) : (
          <Link2 className="h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
        )}
        <span
          className={`min-w-0 flex-1 truncate text-xs ${
            copied ? "font-medium text-green-700" : "text-muted"
          }`}
        >
          {copied ? "Tautan produk tersalin ke clipboard" : url}
        </span>
        <span
          className={`shrink-0 text-xs font-semibold transition ${
            copied ? "text-green-600" : "text-navy"
          }`}
        >
          {copied ? "Tersalin ✓" : "Salin"}
        </span>
      </button>
    </div>
  );
}
