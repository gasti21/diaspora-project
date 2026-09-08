-- ============================================================
-- 0022: short_description boleh NULL.
--
-- Sejak fitur deskripsi singkat dihapus dari form, kode tidak lagi
-- mengisi kolom ini - tapi kolom masih NOT NULL sehingga submit/edit
-- gagal dengan "null value in column short_description".
-- ============================================================

alter table public.products alter column short_description drop not null;
