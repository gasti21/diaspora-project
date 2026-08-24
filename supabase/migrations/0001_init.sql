-- ============================================================
-- KaryaDiaspora MVP - Skema Database (Supabase / Postgres)
-- Jalankan di Supabase Dashboard > SQL Editor, atau via supabase CLI.
-- ============================================================

-- ---------- TABEL ----------
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  avatar_url text,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  category_id uuid references public.categories(id),
  stage text not null default 'Prototype'
    check (stage in ('Sudah Dijual', 'Prototype', 'Riset')),
  country text not null,
  city text,
  short_description text not null check (char_length(short_description) <= 220),
  long_description text not null,
  background_types text[] not null default '{}',
  additional_notes text,
  images text[] not null default '{}',
  video_url text,
  website text,
  year_founded int
    check (year_founded is null or (year_founded between 1900 and 2100)),
  needs text[] not null default '{}',
  needs_other text,
  owner_name text not null,
  owner_email text not null,
  owner_whatsapp text not null,
  status text not null default 'pending'
    check (status in ('pending', 'published', 'revision', 'rejected')),
  review_note text,
  submitted_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists products_status_idx on public.products (status);
create index if not exists products_category_idx on public.products (category_id);
create index if not exists products_created_at_idx on public.products (created_at desc);

-- ---------- ROW LEVEL SECURITY ----------
alter table public.categories enable row level security;
alter table public.profiles enable row level security;
alter table public.products enable row level security;

-- Kategori: semua orang boleh baca
create policy "categories_public_read" on public.categories
  for select using (true);

-- Profil: user melihat/mengubah profilnya sendiri, admin semua
create policy "profiles_read_own" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles_admin_read_all" on public.profiles
  for select using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );
create policy "profiles_upsert_own" on public.profiles
  for insert with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

-- Produk: publik hanya melihat published; pemilik menyimpan draft pending-nya;
-- admin mengelola semua status.
create policy "products_public_read_published" on public.products
  for select using (status = 'published');
create policy "products_owner_read_own" on public.products
  for select using (auth.uid() = submitted_by);
create policy "products_admin_read_all" on public.products
  for select using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );
create policy "products_owner_insert_pending" on public.products
  for insert with check (auth.uid() = submitted_by and status = 'pending');
create policy "products_admin_update" on public.products
  for update using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- ---------- STORAGE BUCKET FOTO PRODUK ----------
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

create policy "product_images_public_read" on storage.objects
  for select using (bucket_id = 'product-images');
create policy "product_images_auth_upload" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'product-images');

-- Sinkronkan profil baru otomatis setiap user login Google pertama kali.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
