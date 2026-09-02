-- ============================================================
-- 0012: Preferensi notifikasi email member/admin.
-- notify_email default TRUE - opt-out, bukan opt-in (rencana C4).
-- ============================================================

alter table public.profiles
  add column if not exists notify_email boolean not null default true;
