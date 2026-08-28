"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Link navigasi navbar.
 * Link milik halaman yang sedang dibuka disembunyikan (permintaan desain:
 * pengunjung tidak perlu melihat menu yang sedang aktif dua kali).
 */
export function NavLinks({
  links,
  className,
}: {
  links: { href: string; label: string }[];
  className?: string;
}) {
  const pathname = usePathname();
  const visible = links.filter((l) => l.href !== pathname);

  return (
    <nav className={className}>
      {visible.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className="whitespace-nowrap text-sm font-medium text-navy/80 transition hover:text-brand"
        >
          {l.label}
        </Link>
      ))}
    </nav>
  );
}