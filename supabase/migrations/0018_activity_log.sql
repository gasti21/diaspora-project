-- Log aktivitas kurasi admin: siapa melakukan apa pada produk mana.
create table if not exists public.admin_activity_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null,
  actor_name text not null,
  action text not null check (action in ('approve','revision','reject','reopen','delete','bulk_approve','bulk_reject')),
  product_id uuid,
  product_name text not null,
  note text,
  created_at timestamptz not null default now()
);

alter table public.admin_activity_log enable row level security;

-- Baca hanya untuk admin; tulis via service role (server).
create policy "admin can read activity log"
  on public.admin_activity_log
  for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

create index if not exists idx_activity_log_created
  on public.admin_activity_log (created_at desc);
