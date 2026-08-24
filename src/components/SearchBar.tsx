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

  const iconSize = size === "lg" ? "h-5 w-5" : "h-4 w-4";

  return (
    <form
      onSubmit={submit}
      className={`flex w-full overflow-hidden rounded-xl border border-line bg-white shadow-sm ${
        size === "lg" ? "h-13" : "h-11"
      }`}
      role="search"
    >
      <span className="flex items-center pl-4 text-muted">
        <Search className={size === "lg" ? "h-4.5 w-4.5" : "h-4 w-4"} />
      </span>
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        aria-label="Cari produk"
        className="h-full min-w-0 flex-1 bg-transparent px-3 text-sm outline-none placeholder:text-muted"
      />
      <button
        type="submit"
        aria-label="Cari"
        className="flex items-center justify-center bg-navy px-5 text-white transition hover:bg-navy-dark"
      >
        <Search className={iconSize} />
      </button>
    </form>
  );
}
