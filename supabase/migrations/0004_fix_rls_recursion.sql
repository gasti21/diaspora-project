-- ============================================================
-- 0004: Perbaiki infinite recursion pada RLS policy.
--
-- Policy admin (profiles_admin_read_all, products_admin_read_*)
-- men-query public.profiles dari DALAM policy tabel profiles itu
-- sendiri -> Postgres mendeteksi infinite recursion.
--
-- Solusi standar Supabase: fungsi helper security definer
-- public.is_admin() yang membaca profiles TANPA memicu RLS.
--
-- Jalankan di Supabase Dashboard > SQL Editor.
-- ============================================================

-- ---------- Fungsi helper (bypass RLS via security definer) ----------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
$$;

-- ---------- Ganti policy profiles ----------
drop policy if exists "profiles_read_own" on public.profiles;
drop policy if exists "profiles_admin_read_all" on public.profiles;
drop policy if exists "profiles_upsert_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;

create policy "profiles_read_own" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles_admin_read_all" on public.profiles
  for select using (public.is_admin());
create policy "profiles_upsert_own" on public.profiles
  for insert with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

-- ---------- Ganti policy products ----------
drop policy if exists "products_admin_read_all" on public.products;
drop policy if exists "products_admin_update" on public.products;

create policy "products_admin_read_all" on public.products
  for select using (public.is_admin());
create policy "products_admin_update" on public.products
  for update using (public.is_admin());
