-- ============================================================
-- 0011: Chat Support realtime (user <-> admin, sesi ala Shopee).
--
-- Desain (disepakati di docs/RENCANA-KERJA.md):
-- - 1 user bisa banyak sesi; MAKS 1 sesi aktif (partial unique index).
-- - Auto-close 48 jam: lazy-eval di server (tidak ada cron).
-- - Sesi closed = read-only permanen (enforcement di API).
-- - Unread dilacak via user_last_read_at / admin_last_read_at
--   (bukan flag per pesan).
-- - Judul sesi = potongan pesan pertama (kolom subject, bukan input).
-- - RLS: user hanya sesi miliknya; admin semua via is_admin().
--
-- Jalankan di Supabase Dashboard > SQL Editor.
-- ============================================================

-- ---------- Tabel sesi ----------
create table if not exists public.support_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  status text not null default 'open' check (status in ('open', 'closed')),
  -- Judul sesi: potongan pesan pertama (bukan input pengguna).
  subject text not null default '',
  last_message_at timestamptz not null default now(),
  -- Penanda baca per pihak: pesan lebih baru dari timestamp ini = unread.
  user_last_read_at timestamptz not null default now(),
  admin_last_read_at timestamptz,
  -- 'user' | 'admin' | 'auto' (auto = lazy-eval 48 jam tanpa aktivitas)
  closed_by text check (closed_by in ('user', 'admin', 'auto')),
  closed_at timestamptz,
  created_at timestamptz not null default now()
);

-- Maksimal 1 sesi aktif (open) per user pada satu waktu.
create unique index if not exists support_sessions_one_open_per_user
  on public.support_sessions (user_id)
  where status = 'open';

create index if not exists support_sessions_user_idx
  on public.support_sessions (user_id, last_message_at desc);
create index if not exists support_sessions_admin_inbox_idx
  on public.support_sessions (status, last_message_at desc);

-- ---------- Tabel pesan ----------
create table if not exists public.support_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.support_sessions (id) on delete cascade,
  sender_id uuid not null references auth.users (id) on delete cascade,
  body text not null check (char_length(btrim(body)) between 1 and 2000),
  created_at timestamptz not null default now()
);

create index if not exists support_messages_session_idx
  on public.support_messages (session_id, created_at);

-- ---------- RLS ----------
alter table public.support_sessions enable row level security;
alter table public.support_messages enable row level security;

-- Sesi: pemilik membaca sesinya sendiri; admin membaca semua.
create policy "support_sessions_select_own" on public.support_sessions
  for select using (auth.uid() = user_id);
create policy "support_sessions_admin_all" on public.support_sessions
  for select using (public.is_admin());
-- Insert hanya untuk diri sendiri (update/close lewat API service-role).
create policy "support_sessions_insert_own" on public.support_sessions
  for insert with check (auth.uid() = user_id);
-- Pemilik boleh update penanda bacanya sendiri (kolom lain dijaga API).
create policy "support_sessions_update_own_read" on public.support_sessions
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Pesan: peserta sesi (pemilik) & admin bisa baca.
create policy "support_messages_select_participant" on public.support_messages
  for select using (
    public.is_admin()
    or exists (
      select 1 from public.support_sessions s
      where s.id = session_id and s.user_id = auth.uid()
    )
  );
-- Kirim pesan: hanya pemilik sesi (admin membalas lewat API service-role).
create policy "support_messages_insert_own" on public.support_messages
  for insert with check (
    auth.uid() = sender_id
    and exists (
      select 1 from public.support_sessions s
      where s.id = session_id and s.user_id = auth.uid() and s.status = 'open'
    )
  );

-- ---------- Realtime ----------
-- Pesan masuk ke publication realtime; RLS otomatis memfilter event
-- (user hanya menerima event sesi miliknya).
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and tablename = 'support_messages'
    ) then
      alter publication supabase_realtime add table public.support_messages;
    end if;
  end if;
end $$;
