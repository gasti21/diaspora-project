-- 0019: Pulihkan proteksi kolom kontak (melengkapi 0005 yang ter-reset).
-- Tambahan: sertakan kolom baru (latitude, longitude, owner fields lain)
-- dan revoke sekali lagi karena grant penuh terdeteksi kembali.

revoke select on public.products from anon, authenticated;
revoke all on public.products from anon, authenticated;

grant select (
  id, slug, name, category_id, stage, country, city,
  latitude, longitude,
  short_description, long_description, background_types,
  additional_notes, images, video_url, website, year_founded,
  needs, needs_other, owner_name, status, review_note,
  submitted_by, created_at, updated_at
) on public.products to anon, authenticated;
