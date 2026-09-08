-- ============================================================
-- 0020: Izinkan pemilik mengelola pengajuannya sendiri (edit & tarik).
--
-- Kebocoran sebaliknya (sebelum 0005) sudah ditutup: kontak pemilik
-- tidak bisa dibaca publik. Namun sisi tulis juga perlu kebijakan:
-- sampai 0020 ini, member tidak bisa menyimpan editan maupun
-- menarik pengajuannya (permission denied for table products).
--
-- Pengaman yang dipertahankan:
--   * update: with check status = 'pending' -> pemilik TIDAK BISA
--     mem-publish/mengubah status via REST langsung; alur wajib
--     lewat antrian review admin.
--   * delete: hanya baris milik sendiri (submitted_by = auth.uid()).
-- ============================================================

drop policy if exists "products_owner_update_own" on public.products;
create policy "products_owner_update_own" on public.products
  for update using (submitted_by = auth.uid())
  with check (submitted_by = auth.uid() and status = 'pending');

drop policy if exists "products_owner_delete_own" on public.products;
create policy "products_owner_delete_own" on public.products
  for delete using (submitted_by = auth.uid());
