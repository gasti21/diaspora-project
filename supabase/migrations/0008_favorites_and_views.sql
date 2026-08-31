-- ============================================================
-- 0008: Rekonstruksi objek yang sebelumnya dibuat di luar file
-- migration (dibuat manual di dashboard), didump dari database
-- live pada audit round-2. Semua statement idempotent.
--
-- Objek: tabel favorites, tabel product_views, kolom profiles.bio,
-- RPC record_product_view (penghitung view untuk pengunjung anonim)
-- dan RPC get_view_counts (agregasi view untuk halaman admin).
-- ============================================================

-- ---------- Kolom bio di profiles (dipakai halaman Profil) ----------
alter table public.profiles add column if not exists bio text;

-- ---------- Tabel favorites ----------
create table if not exists public.favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint favorites_pkey primary key (user_id, product_id)
);

alter table public.favorites enable row level security;

drop policy if exists "favorites_select_own" on public.favorites;
drop policy if exists "favorites_insert_own" on public.favorites;
drop policy if exists "favorites_delete_own" on public.favorites;

create policy "favorites_select_own" on public.favorites
  for select to authenticated
  using (user_id = auth.uid());
create policy "favorites_insert_own" on public.favorites
  for insert to authenticated
  with check (user_id = auth.uid());
create policy "favorites_delete_own" on public.favorites
  for delete to authenticated
  using (user_id = auth.uid());

-- ---------- Tabel product_views ----------
-- Tidak ada policy: view hanya direkam via RPC security definer
-- di bawah (pengunjung anonim pun bisa), akses langsung ditutup.
create table if not exists public.product_views (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  viewed_at timestamptz not null default now()
);

create index if not exists idx_product_views_product
  on public.product_views (product_id);

alter table public.product_views enable row level security;

-- ---------- RPC: rekam view (dipanggil ViewTracker, tanpa login) ----------
create or replace function public.record_product_view(p_product_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into product_views(product_id) values (p_product_id);
end;
$$;

-- ---------- RPC: agregasi jumlah view (dipakai halaman admin) ----------
create or replace function public.get_view_counts(p_ids uuid[])
returns table (product_id uuid, view_count bigint)
language sql
stable
security definer
set search_path = public
as $$
  select product_id, count(*)::bigint
  from product_views
  where product_id = any(p_ids)
  group by product_id
$$;