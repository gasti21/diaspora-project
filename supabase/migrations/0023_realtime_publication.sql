-- ============================================================
-- 0023: Aktifkan Supabase Realtime untuk auto-update UI.
--
-- Aplikasi mendaftarkan listener postgres_changes (client-side).
-- Perubahan di tabel-tabel ini memicu router.refresh() yang halus
-- (tanpa reload), sehingga semua peran - guest, member, admin -
-- melihat data terbaru tanpa pernah menekan reload.
-- Idempotent: tabel yang sudah terdaftar dilewati.
-- ============================================================

do $$
declare
  t text;
begin
  foreach t in array array['products', 'product_reviews', 'support_messages', 'profiles'] loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;
