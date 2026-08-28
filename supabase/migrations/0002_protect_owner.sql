-- ============================================================
-- 0002: Perlindungan permanen admin pemilik (owner) platform.
--
-- Email karyadiaspora@gmail.com TIDAK BISA (bahkan lewat SQL langsung
-- atau dashboard Supabase):
--   1. role-nya diturunkan dari 'admin' menjadi 'user'
--   2. email-nya diganti
--   3. baris profilnya dihapus (termasuk lewat cascade hapus akun
--      di auth.users - akun Google pemilik ikut terkunci)
--
-- Jalankan di Supabase Dashboard > SQL Editor.
-- ============================================================

-- ---------- GUARD 1: role & email owner tidak bisa diubah ----------
create or replace function public.protect_owner_admin()
returns trigger
language plpgsql
as $$
begin
  if lower(old.email) = 'karyadiaspora@gmail.com' then
    if new.role is distinct from 'admin' then
      raise exception 'Admin pemilik platform (%) tidak dapat diturunkan role-nya.', old.email;
    end if;
    if new.email is distinct from old.email then
      raise exception 'Email admin pemilik platform (%) tidak dapat diganti.', old.email;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_protect_owner on public.profiles;
create trigger profiles_protect_owner
  before update on public.profiles
  for each row execute function public.protect_owner_admin();

-- ---------- GUARD 2: baris profil owner tidak bisa dihapus ----------
create or replace function public.block_owner_delete()
returns trigger
language plpgsql
as $$
begin
  if lower(old.email) = 'karyadiaspora@gmail.com' then
    raise exception 'Admin pemilik platform (%) tidak dapat dihapus.', old.email;
  end if;
  return old;
end;
$$;

drop trigger if exists profiles_block_owner_delete on public.profiles;
create trigger profiles_block_owner_delete
  before delete on public.profiles
  for each row execute function public.block_owner_delete();
