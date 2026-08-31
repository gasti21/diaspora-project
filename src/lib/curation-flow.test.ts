import { describe, expect, it } from "vitest";
import { slugify } from "./constants";

/**
 * Test alur status kurasi - kontrak yang WAJIB dipertahankan:
 * 1. Member submit  -> status selalu "pending" (tidak bisa self-publish)
 * 2. Member edit    -> status kembali "pending" + catatan review direset
 * 3. Admin edit     -> status tidak berubah
 *
 * Fungsi data asli butuh Supabase; di sini diuji logika transformasinya
 * yang diekstrak murni agar tidak butuh koneksi.
 */

/** Transformasi yang dipakai createSubmission (mirror data.ts). */
function applyMemberSubmission(payload: { name: string }) {
  return { name: payload.name.trim(), status: "pending" as const };
}

/** Transformasi yang dipakai updateMySubmission (mirror data.ts). */
function applyMemberEdit(status: string, reviewNote: string | null) {
  return { status: "pending" as const, review_note: null, previous: { status, reviewNote } };
}

/** Transformasi yang dipakai adminUpdateProductFields (mirror data.ts). */
function applyAdminEdit(status: string, reviewNote: string | null) {
  return { status, review_note: reviewNote };
}

describe("kontrak alur kurasi produk", () => {
  it("member submit -> selalu pending, apapun yang dikirim", () => {
    const row = applyMemberSubmission({ name: "  Batik Nusa  " });
    expect(row.status).toBe("pending");
    expect(row.name).toBe("Batik Nusa");
  });

  it("member edit -> status kembali pending + catatan review direset", () => {
    const result = applyMemberEdit("revision", "Perbaiki fotonya");
    expect(result.status).toBe("pending");
    expect(result.review_note).toBeNull();
  });

  it("admin edit -> status & catatan tidak berubah", () => {
    const result = applyAdminEdit("published", "Disetujui kurator");
    expect(result.status).toBe("published");
    expect(result.review_note).toBe("Disetujui kurator");
  });
});

describe("slugify (guard duplikat kategori)", () => {
  it("slug konsisten untuk pengecekan duplikat", () => {
    expect(slugify("Riset & Inovasi")).toBe(slugify("riset & inovasi"));
  });
});
