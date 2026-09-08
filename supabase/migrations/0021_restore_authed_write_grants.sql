-- ============================================================
-- 0021: Kembalikan hak tulis untuk role authenticated.
--
-- 0019 menjalankan "revoke all ... from authenticated" (niatnya
-- menutup SELECT kolom kontak), tapi efeknya semua hak tulis
-- member ikut hilang -> member gagal submit/edit/tarik dengan
-- "permission denied for table products".
--
-- Perbaikan: authenticated mendapat INSERT, UPDATE, DELETE penuh
-- (keamanan tetap dijaga oleh RLS policies: hanya baris milik
-- sendiri, update wajib status=pending, insert wajib pending).
-- SELECT tetap per-kolom tanpa owner_email/owner_whatsapp
-- (proteksi kontak dari 0005/0019 tidak diubah).
-- ============================================================

grant insert, update, delete on public.products to authenticated;
