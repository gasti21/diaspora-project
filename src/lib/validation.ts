import { MAX_IMAGES } from "@/lib/constants";
import type { Stage, SubmissionPayload } from "@/lib/types";

const STAGE_VALUES: Stage[] = ["Sudah Dijual", "Prototype", "Riset"];

/**
 * Validasi payload pengajuan/edisi produk.
 * Dipakai bersama oleh POST (submit baru), PATCH (edit member & admin) -
 * satu sumber kebenaran agar aturan tidak pernah berbeda antar endpoint.
 */
export function validateSubmissionPayload(body: SubmissionPayload): string[] {
  const errors: string[] = [];
  if (!body.name?.trim()) errors.push("Nama produk wajib diisi.");
  if (!body.categoryId) errors.push("Kategori wajib dipilih.");
  if (!body.stage || !STAGE_VALUES.includes(body.stage)) errors.push("Tahap produk tidak valid.");
  if (!body.country?.trim()) errors.push("Negara/lokasi wajib diisi.");
  if (!body.shortDescription?.trim()) errors.push("Deskripsi singkat wajib diisi.");
  if (!body.longDescription?.trim()) errors.push("Deskripsi lengkap wajib diisi.");
  if (!Array.isArray(body.images) || body.images.length === 0)
    errors.push("Minimal 1 foto produk.");
  if (Array.isArray(body.images) && body.images.length > MAX_IMAGES)
    errors.push(`Maksimal ${MAX_IMAGES} foto produk.`);
  if (!body.ownerName?.trim()) errors.push("Nama pemilik wajib diisi.");
  if (!body.ownerEmail?.trim()) errors.push("Email wajib diisi.");
  if (!body.ownerWhatsapp?.trim()) errors.push("Nomor WhatsApp wajib diisi.");
  return errors;
}
