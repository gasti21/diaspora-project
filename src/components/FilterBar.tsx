"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { RotateCcw } from "lucide-react";
import { CATEGORIES, STAGES, NEEDS } from "@/lib/constants";
import { cn } from "@/lib/utils";

const FILTERS = [
  { key: "kategori", label: "Kategori", options: CATEGORIES.map((c) => ({ value: c.slug, label: c.name })) },
  { key: "lokasi", label: "Lokasi", options: [] as { value: string; label: string }[] },
  { key: "status", label: "Status", options: STAGES.map((s) => ({ value: s, label: s })) },
  { key: "kebutuhan", label: "Kebutuhan", options: NEEDS.filter((n) => n !== "Lainnya").map((n) => ({ value: n, label: n })) },
];

/** Baris 4 filter dropdown + Reset - memperbarui query string halaman Explore. */
export function FilterBar({ countries }: { countries: string[] }) {
  const router = useRouter();
  const params = useSearchParams();
  const active = FILTERS.some((f) => params.get(f.key));

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete("halaman");
    router.push(next.size ? `/explore?${next}` : "/explore");
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      {FILTERS.map((f) => (
        <select
          key={f.key}
          value={params.get(f.key) ?? ""}
          onChange={(e) => setParam(f.key, e.target.value)}
          aria-label={`Filter ${f.label}`}
          className={cn(
            "h-11 cursor-pointer rounded-xl border bg-white px-4 pr-9 text-sm font-medium outline-none transition",
            params.get(f.key)
              ? "border-navy text-navy"
              : "border-line text-navy/80 hover:border-navy/40"
          )}
        >
          <option value="">{f.label}</option>
          {(f.key === "lokasi"
            ? countries.map((c) => ({ value: c, label: c }))
            : f.options
          ).map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      ))}

      {active && (
        <button
          onClick={() => {
            const q = params.get("q");
            router.push(q ? `/explore?q=${encodeURIComponent(q)}` : "/explore");
          }}
          className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium text-navy/70 transition hover:bg-surface hover:text-brand"
        >
          <RotateCcw className="h-4 w-4" />
          Reset Filter
        </button>
      )}
    </div>
  );
}
