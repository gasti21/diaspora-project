"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

/**
 * Link navigasi navbar desktop.
 * Halaman yang sedang dibuka di-highlight (garis bawah merah brand di bawah
 * label) - bukan disembunyikan - supaya posisi menu selalu stabil dan
 * pengunjung tahu di mana mereka berada.
 */
export function NavLinks({
  links,
  className,
}: {
  links: { href: string; label: string }[];
  className?: string;
}) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <nav className={className}>
      {links.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          aria-current={isActive(l.href) ? "page" : undefined}
          className={cn(
            "relative whitespace-nowrap text-sm font-medium transition-colors duration-200",
            isActive(l.href) ? "text-navy" : "text-navy/70 hover:text-navy"
          )}
        >
          {l.label}
          <span
            aria-hidden="true"
            className={cn(
              "absolute inset-x-0 -bottom-1 h-0.5 rounded-full bg-brand transition-transform duration-300",
              isActive(l.href) ? "scale-x-100" : "scale-x-0"
            )}
          />
        </Link>
      ))}
    </nav>
  );
}
