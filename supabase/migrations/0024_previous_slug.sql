-- Slug lama disimpan agar tautan lama tetap hidup (redirect otomatis)
alter table public.products add column if not exists previous_slug text;
