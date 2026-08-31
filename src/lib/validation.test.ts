import { describe, expect, it } from "vitest";
import { validateSubmissionPayload } from "./validation";
import type { SubmissionPayload } from "./types";

/** Payload valid sebagai dasar - tiap test mengubah satu field. */
const valid: SubmissionPayload = {
  name: "Batik Nusa",
  categoryId: "cat-1",
  stage: "Sudah Dijual",
  country: "Malaysia",
  backgroundTypes: ["UMKM"],
  shortDescription: "Batik premium karya diaspora.",
  longDescription: "Batik tulis premium yang dibuat oleh perajin diaspora di Malaysia.",
  images: ["https://example.com/a.jpg"],
  ownerName: "Iqbal",
  ownerEmail: "iqbal@example.com",
  ownerWhatsapp: "+60123456789",
  needs: ["Pembeli"],
};

describe("validateSubmissionPayload", () => {
  it("lolos untuk payload lengkap & valid", () => {
    expect(validateSubmissionPayload(valid)).toEqual([]);
  });

  it("tolak bila field wajib kosong/whitespace", () => {
    const errors = validateSubmissionPayload({
      ...valid,
      name: "   ",
      country: "",
      ownerWhatsapp: "",
    });
    expect(errors).toContain("Nama produk wajib diisi.");
    expect(errors).toContain("Negara/lokasi wajib diisi.");
    expect(errors).toContain("Nomor WhatsApp wajib diisi.");
  });

  it("tolak tahap di luar daftar yang valid", () => {
    const errors = validateSubmissionPayload({
      ...valid,
      stage: "Sudah IPO" as SubmissionPayload["stage"],
    });
    expect(errors).toContain("Tahap produk tidak valid.");
  });

  it("tolak tanpa foto", () => {
    const errors = validateSubmissionPayload({ ...valid, images: [] });
    expect(errors).toContain("Minimal 1 foto produk.");
  });

  it("tolak foto melebihi batas", () => {
    const images = Array.from({ length: 6 }, (_, i) => `f${i}.jpg`);
    const errors = validateSubmissionPayload({ ...valid, images });
    expect(errors.some((e) => e.includes("Maksimal"))).toBe(true);
  });
});
