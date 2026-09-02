-- ============================================================
-- 0010: Kolom link sosmed di profiles.
-- Disimpan sebagai URL utuh (sudah dinormalisasi aplikasi):
-- instagram_url, whatsapp_url (wa.me), linkedin_url,
-- twitter_url (x.com), facebook_url.
-- ============================================================

alter table public.profiles add column if not exists instagram_url text;
alter table public.profiles add column if not exists whatsapp_url text;
alter table public.profiles add column if not exists linkedin_url text;
alter table public.profiles add column if not exists twitter_url text;
alter table public.profiles add column if not exists facebook_url text;
