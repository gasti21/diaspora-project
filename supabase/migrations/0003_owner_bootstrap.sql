-- ============================================================
-- 0003: Bootstrap otomatis admin pemilik (owner) saat login pertama.
--
-- Saat karyadiaspora@gmail.com login Google pertama kali, profile-nya
-- otomatis dibuat dengan role = 'admin' - tidak perlu set manual.
-- User lain tetap dibuat dengan role default 'user'.
--
-- Jalankan di Supabase Dashboard > SQL Editor.
-- ============================================================

-- Ganti isi fungsi (trigger on_auth_user_created tetap menempel -
-- ia memanggil fungsi berdasarkan nama).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url',
    case when lower(new.email) = 'karyadiaspora@gmail.com' then 'admin' else 'user' end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
