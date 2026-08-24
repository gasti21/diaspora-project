"use client";

import { useState } from "react";
import { Check, Link2 } from "lucide-react";
import { BRAND, BrandIcon } from "./BrandIcon";
import { shareUrls } from "@/lib/utils";

const ITEMS = [
  { key: "whatsapp", label: "WhatsApp", color: "bg-[#25D366]", path: BRAND.whatsapp },
  { key: "facebook", label: "Facebook", color: "bg-[#1877F2]", path: BRAND.facebook },
  { key: "x", label: "X (Twitter)", color: "bg-[#0f1419]", path: BRAND.x },
  { key: "linkedin", label: "LinkedIn", color: "bg-[#0A66C2]", path: BRAND.linkedin },
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
    <div className="flex flex-wrap items-center gap-2">
      {ITEMS.map(({ key, label, color, path }) => (
        <a
          key={key}
          href={links[key]}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Bagikan ke ${label}`}
          className={`flex h-9 w-9 items-center justify-center rounded-full text-white transition hover:opacity-85 ${color}`}
        >
          <BrandIcon path={path} className="h-4 w-4" />
        </a>
      ))}
      <button
        onClick={copyLink}
        aria-label="Salin tautan"
        className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-surface text-navy transition hover:border-navy/40"
        title={copied ? "Tersalin!" : "Salin tautan"}
      >
        {copied ? <Check className="h-4 w-4 text-green-600" /> : <Link2 className="h-4 w-4" />}
      </button>
    </div>
  );
}
