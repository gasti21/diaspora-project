-- 0016: Bio pelaku pindah ke profil akun (satu akun satu jawaban).
-- Tahun berdiri & jenis pelaku sebelumnya per-produk (products), sekarang
-- tinggal di profil dan tampil otomatis di semua produk si pemilik.
alter table public.profiles
  add column if not exists year_founded int
    check (year_founded is null or year_founded between 1900 and 2100),
  add column if not exists background_types text[] not null default '{}'
    check (background_types <@ array['Produsen','UMKM','Startup','Komunitas']::text[]);