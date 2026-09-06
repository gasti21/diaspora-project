-- ============================================================
-- 0015: Koordinat lokasi produk (dari GPS saat pengajuan).
-- Disimpan saat submit via LocationPicker (deteksi otomatis).
-- Dipakai modal kontak untuk link Google Maps koordinat persis.
-- ============================================================

alter table public.products
  add column if not exists latitude double precision,
  add column if not exists longitude double precision;

-- Kolom baru harus di-grant eksplisit karena 0005 memakai grant per-kolom.
grant select (latitude, longitude) on public.products to anon, authenticated;