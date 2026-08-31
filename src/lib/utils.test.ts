import { describe, expect, it } from "vitest";
import { slugify } from "./constants";
import {
  categoryStyle,
  countryFlag,
  formatLocation,
  shareUrls,
  waLink,
} from "./utils";

describe("slugify", () => {
  it("mengubah nama menjadi slug kecil berhubung tanda hubung", () => {
    expect(slugify("Makanan & Minuman")).toBe("makanan-minuman");
    expect(slugify("Kopi Toraja Premium")).toBe("kopi-toraja-premium");
  });

  it("membuang aksara & karakter khusus", () => {
    expect(slugify("Café Résumé!")).toBe("cafe-resume");
    expect(slugify("A***B###C")).toBe("a-b-c");
  });

  it("menghapus tanda hubung di awal/akhir dan membatasi 80 karakter", () => {
    expect(slugify("--Halo--")).toBe("halo");
    expect(slugify("a".repeat(100)).length).toBeLessThanOrEqual(80);
  });
});

describe("categoryStyle", () => {
  it("memakai preset untuk kategori yang dikenal", () => {
    expect(categoryStyle("makanan-minuman")).toBe("bg-amber-50 text-amber-700");
  });

  it("deterministik untuk kategori baru (slug sama = warna sama)", () => {
    const a = categoryStyle("kategori-baru-2026");
    const b = categoryStyle("kategori-baru-2026");
    expect(a).toBe(b);
    expect(a).toMatch(/^bg-\S+ text-\S+$/);
  });

  it("beri fallback abu-abu bila slug kosong", () => {
    expect(categoryStyle(null)).toBe("bg-gray-100 text-gray-700");
    expect(categoryStyle(undefined)).toBe("bg-gray-100 text-gray-700");
  });
});

describe("formatLocation", () => {
  it("gabung kota + negara bila kota ada", () => {
    expect(formatLocation({ city: "Kuala Lumpur", country: "Malaysia" })).toBe(
      "Kuala Lumpur, Malaysia"
    );
  });

  it("hanya negara bila kota kosong/null", () => {
    expect(formatLocation({ city: null, country: "Malaysia" })).toBe("Malaysia");
    expect(formatLocation({ country: "Malaysia" })).toBe("Malaysia");
  });
});

describe("countryFlag", () => {
  it("memetakan negara yang dikenal (case-insensitive)", () => {
    expect(countryFlag("malaysia")).toBe("🇲🇾");
    expect(countryFlag("JEPANG")).toBe("🇯🇵");
  });

  it("fallback bumi 🌍 untuk negara tak dikenal", () => {
    expect(countryFlag("Wakanda")).toBe("🌍");
  });
});

describe("waLink", () => {
  it("membuang semua karakter non-digit", () => {
    expect(waLink("+62 812-3456-7890")).toBe("https://wa.me/6281234567890");
    expect(waLink("0812 (3456) 7890")).toBe("https://wa.me/081234567890");
  });
});

describe("shareUrls", () => {
  it("menghasilkan URL share lengkap untuk 4 platform + hasil ter-encode", () => {
    const links = shareUrls("https://kd.id/produk/a", "Produk Bagus");
    expect(links.whatsapp).toBe("https://wa.me/?text=Produk%20Bagus%20https%3A%2F%2Fkd.id%2Fproduk%2Fa");
    expect(links.facebook).toContain("facebook.com/sharer/sharer.php?u=");
    expect(links.x).toContain("twitter.com/intent/tweet");
    expect(links.linkedin).toContain("linkedin.com/sharing/share-offsite");
  });
});
