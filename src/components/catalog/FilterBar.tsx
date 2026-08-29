"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ArrowUpDown, RotateCcw } from "lucide-react";
import { CATEGORIES, STAGES, NEEDS } from "@/lib/constants";
import { cn } from "@/lib/utils";

const FILTERS = [
  { key: "kategori", label: "Kategori", options: CATEGORIES.map((c) => ({ value: c.slug, label: c.name })) },
  { key: "lokasi", label: "Lokasi", options: [] as { value: string; label: string }[] },
  { key: "status", label: "Status", options: STAGES.map((s) => ({ value: s, label: s })) },
  { key: "kebutuhan", label: "Kebutuhan", options: NEEDS.filter((n) => n !== "Lainnya").map((n) => ({ value: n, label: n })) },
];

const SORTS = [
  { value: "", label: "Terbaru" },
  { value: "terlama", label: "Terlama" },
  { value: "nama", label: "Nama (A-Z)" },
];

/**
 * Baris 4 filter dropdown + urutan + Reset - memperbarui query string
 * halaman Explore. Sorting dipisah dari filter supaya "Reset Filter"
 * hanya membersihkan filter kategori/lokasi/status/kebutuhan.
 */
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

  const selectCls = (filled: boolean) =>
    cn(
      "h-11 cursor-pointer rounded-xl border bg-white px-4 pr-9 text-sm font-medium outline-none transition",
      filled ? "border-navy text-navy" : "border-line text-navy/80 hover:border-navy/40"
    );

  return (
    <div className="flex flex-wrap items-center gap-3">
      {FILTERS.map((f) => (
        <select
          key={f.key}
          value={params.get(f.key) ?? ""}
          onChange={(e) => setParam(f.key, e.target.value)}
          aria-label={`Filter ${f.label}`}
          className={selectCls(Boolean(params.get(f.key)))}
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

      {/* Urutan hasil */}
      <div className="relative">
        <ArrowUpDown
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
          aria-hidden="true"
        />
        <select
          value={params.get("urutkan") ?? ""}
          onChange={(e) => setParam("urutkan", e.target.value)}
          aria-label="Urutkan produk"
          className={cn(selectCls(Boolean(params.get("urutkan"))), "pl-10")}
        >
          {SORTS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      {active && (
        <button
          onClick={() => {
            const next = new URLSearchParams(params.toString());
            FILTERS.forEach((f) => next.delete(f.key));
            next.delete("halaman");
            const qs = next.toString();
            router.push(qs ? `/explore?${qs}` : "/explore");
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
