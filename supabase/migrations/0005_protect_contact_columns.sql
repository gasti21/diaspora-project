-- ---------- Ganti policy products ----------
drop policy if exists "products_admin_read_all" on public.products;
drop policy if exists "products_admin_update" on public.products;

create policy "products_admin_read_all" on public.products
  for select using (public.is_admin());
create policy "products_admin_update" on public.products
  for update using (public.is_admin());

-- ============================================================
-- 0005: Lindungi kolom kontak pemilik dari akses massal.
--
-- Kebocoran: policy products_public_read_published (using true)
-- memperbolehkan SELECT semua kolom - termasuk owner_email &
-- owner_whatsapp - via REST Supabase langsung dengan anon key,
-- sehingga kontak pemilik bisa di-scrape massal oleh bot.
--
-- Solusi: revoke SELECT lalu grant per-kolom TANPA owner_email
-- dan owner_whatsapp. Kontak hanya diakses lewat aplikasi
-- (endpoint rate-limited /api/products/[id]/contact yang memakai
-- service-role) atau oleh admin (service-role). Insert/update
-- tidak terpengaruh.
-- ============================================================

revoke select on public.products from anon, authenticated;

grant select (
  id, slug, name, category_id, stage, country, city,
  short_description, long_description, background_types,
  additional_notes, images, video_url, website, year_founded,
  needs, needs_other, owner_name, status, review_note,
  submitted_by, created_at, updated_at
) on public.products to anon, authenticated;