"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

/** Kotak pencarian yang menulis ke query `q` di halaman Explore. */
export function SearchBar({
  initial = "",
  placeholder = "Cari produk, kategori, atau lokasi...",
  size = "lg",
}: {
  initial?: string;
  placeholder?: string;
  size?: "lg" | "md";
}) {
  const [value, setValue] = useState(initial);
  const router = useRouter();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (value.trim()) params.set("q", value.trim());
    router.push(params.size ? `/explore?${params}` : "/explore");
  }

  return (
    <form
      onSubmit={submit}
      className={`flex w-full items-center overflow-hidden rounded-md border border-slate-200 bg-white transition-colors focus-within:border-brand ${
        size === "lg" ? "h-12" : "h-10"
      }`}
      role="search"
    >
      <span className="flex items-center pl-3.5 text-slate-400">
        <Search className={size === "lg" ? "h-4 w-4" : "h-3.5 w-3.5"} aria-hidden="true" />
      </span>
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        aria-label="Cari produk"
        className="h-full min-w-0 flex-1 bg-transparent px-3 text-sm text-slate-900 outline-none placeholder:text-slate-400"
      />
      <button
        type="submit"
        aria-label="Cari"
        className="flex h-full items-center justify-center bg-brand px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-dark"
      >
        Cari
      </button>
    </form>
  );
}
