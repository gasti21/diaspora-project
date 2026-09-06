-- ============================================================
-- 0014 - Ulasan ala Google Maps: catat waktu edit terakhir.
-- Tanggal yang ditampilkan di kartu ulasan = updated_at
-- (bukan tanggal posting awal), tanpa label "diedit".
-- ============================================================

alter table public.product_reviews
  add column if not exists updated_at timestamptz not null default now();