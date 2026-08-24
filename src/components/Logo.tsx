import Link from "next/link";

export function LogoMark({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <g transform="rotate(45 24 24)">
        <rect x="20" y="2" width="8" height="44" rx="3" fill="#d32f2f" />
        <rect x="2" y="20" width="44" height="8" rx="3" fill="#16274e" />
      </g>
      <circle cx="24" cy="24" r="6" fill="#fff" />
      <circle cx="24" cy="24" r="3.2" fill="#d32f2f" />
    </svg>
  );
}

export function Logo({ dark = false }: { dark?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2.5">
      <LogoMark />
      <span className={`text-xl font-extrabold tracking-tight ${dark ? "text-white" : "text-navy"}`}>
        Karya<span className="text-brand">Diaspora</span>
      </span>
    </Link>
  );
}
