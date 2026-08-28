import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/** Pagination berbasis query-string (dipakai Explore & dashboard admin). */
export function Pagination({
  page,
  totalPages,
  basePath,
  query = {},
}: {
  page: number;
  totalPages: number;
  basePath: string;
  query?: Record<string, string | undefined>;
}) {
  if (totalPages <= 1) return null;

  const href = (p: number) => {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(query)) {
      if (v) params.set(k, v);
    }
    if (p > 1) params.set("halaman", String(p));
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  const pages = pageNumbers(page, totalPages);

  return (
    <nav className="flex items-center justify-center gap-1.5" aria-label="Pagination">
      <PageLink href={href(Math.max(1, page - 1))} disabled={page === 1} icon={ChevronLeft} label="Sebelumnya" />
      {pages.map((p, i) =>
        p === "…" ? (
          <span key={`gap-${i}`} className="px-2 text-muted">
            …
          </span>
        ) : (
          <Link
            key={p}
            href={href(p as number)}
            aria-current={p === page ? "page" : undefined}
            aria-label={`Halaman ${p}`}
            className={cn(
              "flex h-9 min-w-9 items-center justify-center rounded-lg px-2.5 text-sm font-medium transition-all duration-200 active:scale-95",
              p === page
                ? "bg-navy text-white shadow-sm"
                : "border border-line bg-white text-navy hover:-translate-y-0.5 hover:border-navy/40 hover:bg-surface hover:shadow-sm"
            )}
          >
            {p}
          </Link>
        )
      )}
      <PageLink href={href(Math.min(totalPages, page + 1))} disabled={page === totalPages} icon={ChevronRight} label="Berikutnya" />
    </nav>
  );
}

function PageLink({
  href,
  disabled,
  icon: Icon,
  label,
}: {
  href: string;
  disabled: boolean;
  icon: typeof ChevronLeft;
  label: string;
}) {
  if (disabled) {
    return (
      <span
        aria-hidden="true"
        className="flex h-9 min-w-9 items-center justify-center rounded-lg border border-line text-muted opacity-50"
      >
        <Icon className="h-4 w-4" />
      </span>
    );
  }
  return (
    <Link
      href={href}
      aria-label={label}
      className="flex h-9 min-w-9 items-center justify-center rounded-lg border border-line bg-white text-navy transition-all duration-200 hover:-translate-y-0.5 hover:border-navy/40 hover:bg-surface hover:shadow-sm active:translate-y-0"
    >
      <Icon className="h-4 w-4" />
    </Link>
  );
}

function pageNumbers(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | "…")[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  if (start > 2) pages.push("…");
  for (let p = start; p <= end; p++) pages.push(p);
  if (end < total - 1) pages.push("…");
  pages.push(total);
  return pages;
}
