"use client";

import { useState } from "react";
import { Check, Link2 } from "lucide-react";
import { BRAND, BrandIcon } from "@/components/branding/BrandIcon";
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
    <div>
      <div className="flex flex-wrap items-center gap-2.5">
        {ITEMS.map(({ key, label, color, path }) => (
          <a
            key={key}
            href={links[key]}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Bagikan ke ${label}`}
            title={`Bagikan ke ${label}`}
            className={`flex h-10 w-10 items-center justify-center rounded-full text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:opacity-90 ${color}`}
          >
            <BrandIcon path={path} className="h-4.5 w-4.5" />
          </a>
        ))}
        <button
          onClick={copyLink}
          aria-label="Salin tautan produk"
          className={`flex h-10 items-center gap-1.5 rounded-full border px-3.5 text-xs font-semibold transition ${
            copied
              ? "border-green-500/40 bg-green-50 text-green-600"
              : "border-line bg-surface text-navy hover:border-navy/40 hover:bg-white"
          }`}
          title={copied ? "Tautan tersalin" : "Salin tautan"}
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5" /> Tersalin!
            </>
          ) : (
            <>
              <Link2 className="h-3.5 w-3.5" /> Salin Tautan
            </>
          )}
        </button>
      </div>
      {copied && (
        <p
          className="mt-2.5 text-xs font-medium text-green-600"
          role="status"
        >
          Tautan produk tersalin ke clipboard
        </p>
      )}
    </div>
  );
}
