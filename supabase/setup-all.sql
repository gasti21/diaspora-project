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
-- ============================================================
-- KaryaDiaspora - Seed Data (jalankan setelah 0001_init.sql)
-- ============================================================

insert into public.categories (slug, name) values
  ('makanan-minuman', 'Makanan & Minuman'),
  ('aplikasi-software', 'Aplikasi & Software'),
  ('umkm-kerajinan', 'UMKM & Kerajinan'),
  ('fashion-accessories', 'Fashion & Accessories'),
  ('riset-inovasi', 'Riset & Inovasi'),
  ('pendidikan-edukasi', 'Pendidikan & Edukasi')
on conflict (slug) do nothing;

-- Produk contoh (published) - nama & isi mengikuti mockup desain.
insert into public.products
  (slug, name, category_id, stage, country, city, short_description, long_description,
   background_types, year_founded, needs, owner_name, owner_email, owner_whatsapp,
   website, status, created_at)
values
  ('cemilan-sehat-nusantara', 'Cemilan Sehat Nusantara',
   (select id from public.categories where slug = 'makanan-minuman'),
   'Sudah Dijual', 'Malaysia', 'Kuala Lumpur',
   'Cemilan sehat terbuat dari bahan alami khas Indonesia tanpa pengawet.',
   'Cemilan Sehat Nusantara adalah camilan yang dibuat dari bahan-bahan alami pilihan khas Indonesia. Diproses secara higienis tanpa bahan pengawet sehingga aman dan sehat untuk dikonsumsi setiap hari.

Kami memiliki beberapa varian rasa dan terus berinovasi untuk menghadirkan camilan sehat yang lezat dan bergizi.',
   '{UMKM}', 2021, '{Partner,Pembeli}', 'Devi Lestari', 'owner@cemilansehat.com',
   '+60 12-345-6789', 'www.cemilansehat.com', 'published', now() - interval '2 days'),

  ('eduplaner-app', 'EduPlaner App',
   (select id from public.categories where slug = 'aplikasi-software'),
   'Prototype', 'Jerman', 'Berlin',
   'Aplikasi perencanaan belajar untuk mahasiswa dan pelajar.',
   'EduPlaner adalah aplikasi perencanaan belajar yang membantu mahasiswa dan pelajar mengatur jadwal, tugas, dan target akademik mereka.

Fitur unggulan: pengingat tenggat, statistik kebiasaan belajar, mode fokus, serta komunitas belajar antar diaspora Indonesia.',
   '{Startup}', 2023, '{Investor,Partner}', 'Rizky Maulana', 'hello@eduplaner.app',
   '+49 151-2345-6789', 'www.eduplaner.app', 'published', now() - interval '3 days'),

  ('batik-nusa-collection', 'Batik Nusa Collection',
   (select id from public.categories where slug = 'fashion-accessories'),
   'Sudah Dijual', 'Australia', 'Sydney',
   'Koleksi batik modern dengan sentuhan desain kontemporer.',
   'Batik Nusa Collection menghadirkan batik asli Indonesia dengan desain modern yang cocok untuk gaya profesional maupun kasual di pasar internasional.

Setiap piece dibuat oleh perajin batik dari Yogyakarta dan Solo dengan pewarna alami.',
   '{UMKM,Komunitas}', 2020, '{Partner,Pembeli}', 'Intan Permata', 'info@batiknusa.com.au',
   '+61 412-345-678', 'www.batiknusa.com.au', 'published', now() - interval '4 days'),

  ('ecostraw-indonesia', 'EcoStraw Indonesia',
   (select id from public.categories where slug = 'umkm-kerajinan'),
   'Prototype', 'Belanda', 'Amsterdam',
   'Sedotan ramah lingkungan berbahan dasar bambu.',
   'EcoStraw Indonesia memproduksi sedotan minuman dari bambu pilihan yang ramah lingkungan dan dapat digunakan berulang kali.

Misi kami adalah mengurangi sampah plastik sambil memberdayakan petani bambu lokal di Indonesia.',
   '{UMKM}', 2022, '{Partner,Investor}', 'Bagas Prakoso', 'bagas@ecostraw.nl',
   '+31 6-1234-5678', null, 'published', now() - interval '5 days'),

  ('smart-hydroponic-system', 'Smart Hydroponic System',
   (select id from public.categories where slug = 'riset-inovasi'),
   'Riset', 'Singapura', null,
   'Sistem hidroponik pintar untuk pertanian urban.',
   'Smart Hydroponic System adalah riset teknologi pertanian urban yang menggabungkan IoT dan AI untuk mengoptimalkan pertumbuhan tanaman dalam ruangan dengan efisiensi air hingga 90%.

Saat ini kami mencari mentor dan investor untuk melanjutkan pengembangan prototipe komersial.',
   '{Komunitas,Startup}', 2024, '{Investor,Mentor}', 'Dr. Amara Wijaya', 'amara@hydroponic.sg',
   '+65 8123-4567', null, 'published', now() - interval '6 days'),

  ('buku-anak-dwibahasa', 'Buku Anak Dwibahasa',
   (select id from public.categories where slug = 'pendidikan-edukasi'),
   'Sudah Dijual', 'Amerika Serikat', 'New York',
   'Buku cerita anak dwibahasa Indonesia–Inggris.',
   'Buku Anak Dwibahasa membantu anak-anak diaspora Indonesia mengenal bahasa dan budaya Indonesia melalui cerita bergambar yang menghibur.

Tersedia dalam format cetak dan digital, dengan seri budaya nusantara, adab, dan kearifan lokal.',
   '{Produsen}', 2019, '{Partner,Pembeli}', 'Sari Wulandari', 'sari@bilingualkids.us',
   '+1 917-345-6789', 'www.bilingualkids.us', 'published', now() - interval '7 days'),

  ('kopi-rempah-nusantara', 'Kopi Rempah Nusantara',
   (select id from public.categories where slug = 'makanan-minuman'),
   'Sudah Dijual', 'Singapura', null,
   'Kopi arabika single origin dengan sentuhan rempah Indonesia.',
   'Kopi Rempah Nusantara menghadirkan biji kopi arabika pilihan dari Gayo, Toraja, dan Kintamani yang diproses bersama rempah pilihan seperti kayu manis, kapulaga, dan cengkih.

Roasted fresh setiap minggu di Singapura dan dikirim ke seluruh Asia Tenggara.',
   '{UMKM}', 2021, '{Pembeli,Distribusi}', 'Hendra Gunawan', 'hendra@kopirempah.sg',
   '+65 8567-1234', 'www.kopirempah.sg', 'published', now() - interval '8 days'),

  ('teh-herbal-indonesia', 'Teh Herbal Indonesia',
   (select id from public.categories where slug = 'makanan-minuman'),
   'Sudah Dijual', 'Belanda', 'Rotterdam',
   'Teh herbal premium dari jamu dan tanaman obat Indonesia.',
   'Teh Herbal Indonesia mengemas kekayaan jamu tradisional dalam bentuk teh modern yang praktis: temulawak, jahe merah, serai, dan rosela.

Semua bahan disuplai langsung dari petani di Jawa Tengah dan diproses tanpa gula tambahan.',
   '{UMKM}', 2022, '{Distribusi,Pembeli}', 'Ratna Kusuma', 'ratna@tehherbal.nl',
   '+31 6-8765-4321', null, 'published', now() - interval '9 days'),

  ('keripik-tempe-nusantara', 'Keripik Tempe Nusantara',
   (select id from public.categories where slug = 'makanan-minuman'),
   'Sudah Dijual', 'Jerman', 'Munich',
   'Keripik tempe renyah dengan bumbu khas nusantara.',
   'Keripik Tempe Nusantara adalah camilan berbahan tempe fermentasi pilihan, diiris tipis, digoreng renyah, dan dibalut bumbu khas seperti balado, keju, dan seaweed.

Produksi halal dan terdaftar resmi di Jerman.',
   '{Produsen}', 2020, '{Distribusi}', 'Ahmad Fauzi', 'fauzi@tempechips.de',
   '+49 176-2345-678', null, 'published', now() - interval '10 days'),

  ('abon-lele-premium', 'Abon Lele Premium',
   (select id from public.categories where slug = 'makanan-minuman'),
   'Prototype', 'Arab Saudi', 'Riyadh',
   'Abon lele higienis kaya protein untuk keluarga diaspora.',
   'Abon Lele Premium memanfaatkan lele hasil budidaya bersertifikat yang diolah menjadi abon rendah garam tanpa MSG.

Sedang dalam tahap uji pasar di kalangan komunitas Indonesia di Riyadh sebelum produksi massal.',
   '{UMKM}', 2023, '{Mentor,Pembeli}', 'Yuni Astuti', 'yuni@abonlele.sa',
   '+966 55-345-6789', null, 'published', now() - interval '11 days'),

  ('kue-semprong-tradisional', 'Kue Semprong Tradisional',
   (select id from public.categories where slug = 'makanan-minuman'),
   'Sudah Dijual', 'Malaysia', 'Johor Bahru',
   'Kue semprong renyah resep turun-temurun dari Riau.',
   'Kue Semprong Tradisional dibuat dengan resep asli turun-temurun menggunakan santan kelapa asli dan telur ayam kampung, tanpa pengenyal.

Cocok untuk hampers, acara hajatan, dan oleh-oleh khas Indonesia.',
   '{Produsen}', 2018, '{Pembeli}', 'Nurhayati', 'nurhayati@semprong.my',
   '+60 19-876-5432', null, 'published', now() - interval '12 days'),

  ('tenun-ikat-nusantara', 'Tenun Ikat Nusantara',
   (select id from public.categories where slug = 'fashion-accessories'),
   'Sudah Dijual', 'Australia', 'Melbourne',
   'Tenun ikat asli Sumba dan Toraja untuk fashion etnik modern.',
   'Tenun Ikat Nusantara bekerja sama langsung dengan 40+ penenun di Sumba dan Toraja untuk menghadirkan kain tenun berkualitas tinggi ke pasar Australia.

Setiap pembelian memberikan kontribusi langsung kepada perajin.',
   '{Komunitas}', 2019, '{Partner,Pembeli}', 'Maria Gozali', 'maria@tenunnusantara.au',
   '+61 423-456-789', null, 'published', now() - interval '13 days'),

  -- Contoh produk pending untuk demo dashboard admin
  ('keripik-ubi-ungu', 'Keripik Ubi Ungu',
   (select id from public.categories where slug = 'makanan-minuman'),
   'Prototype', 'Singapura', null,
   'Keripik ubi ungu premium tanpa bahan pengawet dengan rasa yang renyah dan manis alami.',
   'Keripik Ubi Ungu dibuat dari ubi ungu pilihan yang diiris tipis dan dipanggang, bukan digoreng. Kaya antioksidan dan serat.

Saat ini sedang mencari mitra distribusi untuk masuk ke ritel modern di Singapura.',
   '{UMKM}', 2024, '{Pembeli,Distribusi}', 'Budi Santoso', 'budi.santoso@email.com',
   '+65 9123-4567', null, 'pending', now() - interval '1 day'),

  ('tasbihku-arga', 'Tasbihku Arga',
   (select id from public.categories where slug = 'aplikasi-software'),
   'Prototype', 'Arab Saudi', 'Makkah',
   'Aplikasi digital tasbih dan pengingat ibadah harian untuk muslim diaspora.',
   'Tasbihku Arga adalah aplikasi penghitung tasbih digital lengkap dengan jadwal sholat, Al-Qur''an digital, dan komunitas ibadah.

Butuh investor untuk pengembangan versi iOS dan fitur premium.',
   '{Startup}', 2025, '{Investor}', 'Andi Wijaya', 'andi.wijaya@email.com',
   '+966 54-123-4567', null, 'pending', now() - interval '2 days'),

  ('gadget-organizer-kulit', 'Gadget Organizer Kulit',
   (select id from public.categories where slug = 'fashion-accessories'),
   'Sudah Dijual', 'Malaysia', 'Penang',
   'Organizer gadget berbahan kulit asli buatan pengrajin Garut.',
   'Gadget Organizer Kulit memadukan bahan kulit sapi asli Garut dengan desain minimalis untuk menyimpan kabel, charger, dan aksesori.

Perlu revisi foto produk dan penjelasan sertifikasi kulit sebelum tayang.',
   '{UMKM}', 2022, '{Pembeli}', 'Fajar Nugroho', 'fajar.nugroho@email.com',
   '+60 11-2345-6789', null, 'revision', now() - interval '4 days');

-- ============================================================
-- PERLINDUNGAN PERMANEN ADMIN PEMILIK (OWNER)
--
-- Email karyadiaspora@gmail.com TIDAK BISA (bahkan lewat SQL
-- langsung atau dashboard Supabase):
--   1. role-nya diturunkan dari 'admin' menjadi 'user'
--   2. email-nya diganti
--   3. baris profilnya dihapus (termasuk lewat cascade hapus akun
--      di auth.users - akun Google pemilik ikut terkunci)
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

-- ============================================================
-- BOOTSTRAP OTOMATIS ADMIN PEMILIK (OWNER)
-- Saat karyadiaspora@gmail.com login Google pertama kali,
-- profile-nya otomatis dibuat dengan role = 'admin'.
-- ============================================================

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

-- ============================================================
-- 0005: Lindungi kolom kontak pemilik dari akses massal.
--
-- Kebocoran: policy products_public_read_published (using true)
-- memperbolehkan SELECT semua kolom - termasuk owner_email &
-- owner_whatsapp - via REST Supabase langsung dengan anon key,
-- sehingga kontak pemilik bisa di-scrape massal oleh bot.
--
-- Solusi: revoke SELECT lalu grant per-kolom TANPA owner_email
-- dan owner_whatsapp. Kontak hanya diakses lewat aplikasi
-- (endpoint rate-limited /api/products/[id]/contact yang memakai
-- service-role) atau oleh admin (service-role). Insert/update
-- tidak terpengaruh.
-- ============================================================

revoke select on public.products from anon, authenticated;

grant select (
  id, slug, name, category_id, stage, country, city,
  short_description, long_description, background_types,
  additional_notes, images, video_url, website, year_founded,
  needs, needs_other, owner_name, status, review_note,
  submitted_by, created_at, updated_at
) on public.products to anon, authenticated;
