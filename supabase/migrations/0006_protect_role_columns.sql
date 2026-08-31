-- ============================================================
-- 0006: Tutup eskalasi privilege role (CRITICAL).
--
-- Kerentanan terkonfirmasi (audit round-2, verifikasi live):
--   - authenticated punya grant UPDATE di kolom profiles.role
--   - policy profiles_update_own = using (auth.uid() = id)
--     tanpa pembatasan kolom
-- => User login mana pun bisa self-promote jadi admin via
--    PATCH REST langsung ke Supabase.
--
-- Fix (2 lapis):
--   1. revoke UPDATE, lalu grant per-kolom HANYA full_name,
--      avatar_url, bio (kolom profil yang memang diedit user).
--      role/email/id hanya diubah lewat service-role oleh aplikasi.
--   2. Trigger guard: tolak perubahan role/email/id oleh
--      non-service-role (defense-in-depth di level DB).
-- ============================================================

-- ---------- Lapis 1: pembatasan kolom ----------
revoke update on public.profiles from anon, authenticated;

grant update (full_name, avatar_url, bio)
  on public.profiles to authenticated;

-- ---------- Lapis 2: trigger guard ----------
create or replace function public.block_profile_escalation()
returns trigger
language plpgsql
as $$
begin
  -- service_role (aplikasi), postgres, dan supabase_admin dibolehkan.
  if coalesce(current_setting('role', true), current_user)
     in ('service_role', 'postgres', 'supabase_admin') then
    return new;
  end if;

  if tg_op = 'UPDATE' then
    if new.role is distinct from old.role then
      raise exception 'Role tidak dapat diubah langsung oleh user.';
    end if;
    if new.email is distinct from old.email then
      raise exception 'Email profil tidak dapat diubah langsung oleh user.';
    end if;
    if new.id is distinct from old.id then
      raise exception 'ID profil tidak dapat diubah.';
    end if;
  end if;

  if tg_op = 'INSERT' and new.role = 'admin' then
    raise exception 'Role admin hanya dapat diberikan oleh platform.';
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_block_escalation on public.profiles;
create trigger profiles_block_escalation
  before insert or update on public.profiles
  for each row execute function public.block_profile_escalation();