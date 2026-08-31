-- ============================================================
-- 0007: Perketat policy Storage bucket product-images (HIGH).
--
-- Kerentanan: policy lama product_images_auth_upload hanya cek
-- bucket_id - user login mana pun bisa upload file APA SAJA
-- (ekstensi/isi bebas) SEBANYAK APA PUN langsung via Storage REST,
-- bypass kuota 25 file & magic-byte check di API aplikasi.
-- Bucket public => file arbitrer bisa diakses siapa saja
-- (potensi hosting malware/phishing di domain Supabase).
--
-- Fix:
--   1. Upload hanya ke folder milik sendiri (prefix = uid user).
--   2. Hanya file .jpg/.jpeg/.png.
--   3. Tambah UPDATE/DELETE ke folder sendiri - sebelumnya user
--      tidak bisa menghapus foto tak terpakai (kuota macet).
-- ============================================================

drop policy if exists "product_images_auth_upload" on storage.objects;
drop policy if exists "product_images_owner_update" on storage.objects;
drop policy if exists "product_images_owner_delete" on storage.objects;

-- Upload: hanya ke folder sendiri, hanya gambar.
create policy "product_images_auth_upload" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'product-images'
    and (storage.foldername(name))[1] = auth.uid()::text
    and name ~* '\.(jpg|jpeg|png)$'
  );

-- Ganti nama / timpa foto milik sendiri (untuk manajemen foto tak terpakai).
create policy "product_images_owner_update" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'product-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'product-images'
    and (storage.foldername(name))[1] = auth.uid()::text
    and name ~* '\.(jpg|jpeg|png)$'
  );

-- Hapus foto milik sendiri (bersih-bersih foto tak terpakai).
create policy "product_images_owner_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'product-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );