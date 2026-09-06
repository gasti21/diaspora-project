-- ============================================================
-- 0013 - Ulasan produk (ala Tokopedia): rating, teks, media foto/video.
-- Semua orang (login / non-login) bisa MEMBACA ulasan,
-- hanya user login yang bisa MENULIS (1 ulasan per user per produk).
-- ============================================================

create table if not exists public.product_reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  content text not null check (char_length(content) between 1 and 1000),
  media jsonb not null default '[]',
  author_name text not null,
  author_avatar text,
  created_at timestamptz not null default now(),
  unique (product_id, user_id)
);

create index if not exists product_reviews_product_idx
  on public.product_reviews (product_id, created_at desc);

-- ---------- ROW LEVEL SECURITY ----------
alter table public.product_reviews enable row level security;

-- Semua orang (termasuk anonim) boleh melihat ulasan.
create policy "reviews_public_read" on public.product_reviews
  for select using (true);

-- Hanya user login yang bisa menulis, dan hanya atas nama dirinya sendiri.
create policy "reviews_insert_own" on public.product_reviews
  for insert with check (auth.uid() = user_id);

-- Penulis boleh menghapus ulasannya sendiri.
create policy "reviews_delete_own" on public.product_reviews
  for delete using (auth.uid() = user_id);

-- ---------- STORAGE BUCKET MEDIA ULASAN ----------
insert into storage.buckets (id, name, public)
values ('review-media', 'review-media', true)
on conflict (id) do nothing;

create policy "review_media_public_read" on storage.objects
  for select using (bucket_id = 'review-media');

create policy "review_media_insert_own" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'review-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "review_media_delete_own" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'review-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );