-- 0017: Tahap produk 4 level ala Indiegogo + rename 2 kategori
-- Tahap: Ide -> Prototipe -> Produksi -> Sudah Dipasarkan (chronologis,
-- dipakai sebagai badge kepercayaan bagi pembeli/investor).
alter table public.products drop constraint products_stage_check;

update public.products set stage = 'Ide' where stage = 'Riset';
update public.products set stage = 'Prototipe' where stage = 'Prototype';
update public.products set stage = 'Sudah Dipasarkan' where stage = 'Sudah Dijual';

alter table public.products
  add constraint products_stage_check
  check (stage in ('Ide', 'Prototipe', 'Produksi', 'Sudah Dipasarkan'));

-- Kategori: hilangkan tumpang tindih makna dengan tahap & tipe pelaku
update public.categories set slug = 'kriya-kerajinan', name = 'Kriya & Kerajinan'
  where slug = 'umkm-kerajinan';
update public.categories set slug = 'teknologi-inovasi', name = 'Teknologi & Inovasi'
  where slug = 'riset-inovasi';