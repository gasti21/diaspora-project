# 📋 Laporan Lengkap Project KaryaDiaspora

> **Tanggal:** 2 September 2026
> **Project:** KaryaDiaspora — Platform Konektivitas Bisnis Diaspora Indonesia (MVP)
> **Lingkup:** Audit menyeluruh codebase + riwayat pengerjaan sesi (perbaikan error page, bug database, fitur profil, popup avatar)

---

## Daftar Isi

1. [Gambaran Umum](#1-gambaran-umum)
2. [Arsitektur & Struktur](#2-arsitektur--struktur)
3. [Skema Database](#3-skema-database-supabase)
4. [Fitur per Peran](#4-fitur-per-peran)
5. [Riwayat Pengerjaan Sesi Ini](#5-riwayat-pengerjaan-sesi-ini)
6. [Keputusan Desain & Alasannya](#6-keputusan-desain--alasannya)
7. [Status & Risiko Saat Ini](#7-status--risiko-saat-ini)
8. [Rekomendasi Langkah Berikutnya](#8-rekomendasi-langkah-berikutnya)

---

## 1. Gambaran Umum

**KaryaDiaspora** adalah platform konektivitas bisnis diaspora Indonesia (MVP),
dikembangkan oleh Tim Bidang IT & Data PPID DPBD. Diaspora Indonesia di seluruh
dunia dapat **mengajukan produk, bisnis, aplikasi, riset, dan karya kreatif**
mereka, admin mengkurasi pengajuan, lalu publik menjelajah katalog dan
menghubungi pemiliknya.

**Alur MVP (PRD v1.0):**

1. Pengunjung menjelajah katalog **tanpa registrasi** (Explore, filter, detail).
2. Tombol **"Hubungi Pemilik"** membuka pop-up berisi Nama, Email, Lokasi,
   Website pemilik produk.
3. Pemilik produk **login via Google (Gmail)** lalu mengisi form submit —
   produk tersimpan berstatus **Pending**.
4. Admin mengelola **satu dashboard** yang difilter per status
   (Pending / Published / Revision / Rejected). Approve → langsung tayang.

| Aspek | Detail |
|---|---|
| Framework | Next.js 15 (App Router) + React 19 + TypeScript |
| Styling | Tailwind CSS v4 (tema kustom: navy `#16274e`, brand merah `#d32f2f`, surface, line, muted) |
| Database / Auth / Storage | Supabase (Postgres + Google OAuth + Storage) |
| Ikon | lucide-react; ikon brand sosmed dibuat SVG sendiri (`SocialIcons.tsx`) |
| Testing | Vitest — **4 file, 24 test, semua lolos ✅** |
| Rencana hosting | Vercel (tier gratis) |

---

## 2. Arsitektur & Struktur

```
src/
  app/
    (public)/     home, explore, produk/[slug], tentang, kontak, u/[id]
    (member)/     dashboard, pengajuan (+edit), submit, favorit, profil  ← login-only
    admin/        overview, produk (+edit), kategori, pengguna, aktivitas
    api/          products, favorites, profile, upload, admin
    error.tsx     error boundary global (minimalis)
    not-found.tsx
  components/
    layout/       Navbar, UserMenu (popup akun), MobileMenu, NavLinks, Footer
    member/       ProfileEditor, SocialIcons, MemberShell, NotificationBell
    admin/        AdminShell, SidebarNav, ProductsView, ProductDrawer, dll
    product/      ProductCard (tombol favorit), tabs, carousel, kontak, share
    catalog/      SearchBar, FilterBar, Pagination
    forms/        SubmitForm, LocationPicker (GPS ala Shopee)
    toast/        ToastProvider
  lib/
    data.ts       ±38 fungsi query Supabase (sumber data utama)
    auth.ts       getSessionUser (cached), isDbAdmin, PROTECTED_ADMIN_EMAIL
    favorites.ts  legacy localStorage (sudah tidak dipakai halaman Favorit)
    rate-limit.ts, validation.ts, constants.ts, types.ts, sample-data.ts
    supabase/     client, server, config
supabase/
  migrations/     0001–0010 (skema, RLS, storage, favorites/views, sosmed profil)
  setup-all.sql   skrip setup idempotent (termasuk fix GRANT baca)
  seed.sql        6 kategori + produk contoh
```

**Pola arsitektur penting:**

- **Server Components** untuk semua data fetching; halaman member memakai
  `export const dynamic = "force-dynamic"`.
- **Auth:** `getSessionUser()` (React `cache()`) membaca sesi dari cookie
  Supabase. Status admin ditentukan **hanya** dari `profiles.role = 'admin'`
  di database — tanpa fallback env/allowlist.
- **Favorit:** tersimpan di **tabel `favorites`** (login-only, sinkron antar
  perangkat). `lib/favorites.ts` (localStorage) adalah legacy.
- **Rate limiting** di endpoint sensitif (contoh: PATCH profil maks 10x/menit).
- **Upload avatar:** validasi magic bytes (JPG/PNG), maks 2MB, upsert ke bucket
  `avatars` dengan cache-buster timestamp.
- **Guard member** ada di layout `(member)` — tamu melihat kartu ajakan login,
  bukan error.

---

## 3. Skema Database (Supabase)

Project: `scpboipfxqtyujhzgybk` (live, memakai `.env.local`).

| Tabel | Isi utama | Catatan |
|---|---|---|
| `profiles` | id (FK `auth.users`), email, full_name, avatar_url, bio, role (`user`/`admin`), **instagram_url, whatsapp_url, linkedin_url, twitter_url, facebook_url** | 5 kolom sosmed baru (migration 0010), berisi URL utuh ternormalisasi |
| `categories` | kategori katalog | seed 6 kategori |
| `products` | slug, name, category_id, stage (`Sudah Dijual`/`Prototype`/`Riset`), country, city, short/long description, background_types, contact info, dsb. | RLS: publik hanya baca `published` |
| `favorites` | (user_id, product_id) PK komposit | RLS: hanya milik sendiri |
| `product_views` | perekaman view produk | via RPC `record_product_view` (security definer, anon pun bisa) |
| Storage | bucket `avatars` (public), `product-images` (5MB, JPG/PNG/WebP) | |

RLS aktif di semua tabel; policy per-kepemilikan (select/insert/delete sendiri).

---

## 4. Fitur per Peran

### 🛍️ Pengunjung (tanpa login)
- Explore katalog + search, filter (kategori, negara, stage), sorting, pagination
- Detail produk: galeri, background types, kebutuhan, **popup kontak pemilik**
  (nama, email, lokasi, website), ViewTracker, share
- Halaman home / tentang / kontak **guest-only** (auto-redirect ke explore bila login)
- SEO: `sitemap.ts`, `robots.ts`, metadata per halaman

### 👤 Member (login via Google)
- **Dashboard** — ringkasan pengajuan + notifikasi status (dipetakan dari
  `listMySubmissions`, tanpa query tambahan)
- **Submit produk** — form lengkap + LocationPicker (deteksi GPS ala Shopee),
  status awal **Pending**
- **Pengajuan saya** — daftar + edit pengajuan
- **Favorit** — tersimpan di database (sinkron antar perangkat)
- **Profil** — halaman pengaturan: foto, nama, bio, 5 tautan sosmed;
  email read-only (dikelola Google)

### 🛡️ Admin
- Satu dashboard, filter per status (Pending/Published/Revision/Rejected)
- Drawer review & approve produk → langsung tayang
- Kelola kategori, kelola pengguna, log aktivitas kurasi, counter view
- Proteksi: role admin **hanya** dari `profiles.role`; email owner
  `karyadiaspora@gmail.com` tidak bisa diturunkan rolenya

---

## 5. Riwayat Pengerjaan Sesi Ini

> Semua perubahan berikut **belum di-commit** — lihat bagian 7.

### 5.1 Error page minimalis (`src/app/error.tsx`)
- Desain ala Vercel/Linear: label **ERROR** (uppercase, warna brand, tracking
  lebar), judul "Ada yang salah di sisi kami", 1 kalimat penjelas, dua tombol
  (**Muat Ulang** solid brand + **Kembali ke Beranda** outline), dan
  `Kode: <digest>` mono redup di bawah — hanya bila ada.
- **Bonus debugging:** di mode dev, **pesan error asli** ditampilkan dalam kotak
  mono (`process.env.NODE_ENV === "development"`); production tetap sembunyi.
- Pesan error asli inilah yang kemudian membongkar bug database di bawah.

### 5.2 🐞 Bug kritis: `permission denied for table products` (FIXED)
- **Gejala:** `/favorit` menampilkan error page saat user login (digest `1930847927`).
- **Diagnosis:** kotak pesan dev menampilkan `permission denied for table products`.
  Pemeriksaan `information_schema.role_table_grants` membuktikan role `anon` &
  `authenticated` punya INSERT/UPDATE/DELETE **tapi tidak SELECT** di `products`.
  Tidak ada satu pun statement GRANT di migrations.
- **Fix (di-apply langsung ke DB live** via Supabase Management API):

  ```sql
  grant select on all tables in schema public to anon, authenticated;
  grant usage  on schema public to anon, authenticated;
  ```

- **Pencegahan:** statement yang sama ditambahkan ke `supabase/setup-all.sql`.
- **Verifikasi:** REST `products` HTTP 200; kelima tabel public memiliki SELECT
  untuk `authenticated`. RLS tetap aktif (izin level tabel, bukan baris).
- Dampak bug sebenarnya lebih luas: semua halaman yang membaca produk sebagai
  user login (explore, dashboard, dll) ikut terdampak.

### 5.3 Profil bisa diedit penuh (`/profil`)
- **Migration `0010_profile_social_links.sql`** (di-apply ke DB live): 5 kolom
  URL sosmed di `profiles`.
- **`normalizeSocialUrl()`** (`lib/data.ts`) — input fleksibel dinormalisasi
  menjadi URL kanonik per platform:
  - `@username` / `username` / URL lengkap → semuanya diterima
  - Instagram → `https://www.instagram.com/username`
  - WhatsApp: `08123456789` → `https://wa.me/628123456789` (konversi `0` → `62`);
    link `api.whatsapp.com/send?phone=...` ikut dikonversi
  - LinkedIn handle → `linkedin.com/in/username`; Twitter/X → `x.com/username`
  - URL dari platform yang salah → ditolak dengan pesan jelas
- **`ProfileEditor`** (`components/member/ProfileEditor.tsx`, client component):
  - Upload avatar: hover overlay kamera → POST multipart → PATCH URL; validasi
    JPG/PNG 2MB server-side
  - Nama (maks 80), bio (280 + counter)
  - 5 input sosmed berikon platform
  - **Email read-only** (ikon gembok, "Dikelola melalui akun Google Anda") dan
    **lokasi tidak diedit** — sesuai permintaan
  - Simpan: tombol disabled sampai ada perubahan, indikator "Ada perubahan yang
    belum disimpan", spinner, error inline, toast sukses, `router.refresh()`
- **API** (`/api/profile` PATCH) diperluas menerima `socials`; tetap ada rate limit.

### 5.4 Section "Aktivitas" dihapus dari `/profil` (keputusan desain)
- Statistik pengajuan redundan dengan dashboard dan tanpa aksi terkait.
- Query dobel hilang — halaman profil kini hanya `getAdminUser()` + `getMyProfile()`.

### 5.5 Popup avatar = kartu identitas (`components/layout/UserMenu.tsx`)
- Klik avatar di navbar → popup berisi: **foto besar** (ring), **nama + badge
  Member/Admin**, **email**, dan **baris ikon sosmed** yang terisi — masing-masing
  anchor sungguhan ke platform (`target="_blank"`, `rel="noopener noreferrer me"`).
- Diikuti menu akun: Panel Admin (admin saja), Dashboard, Pengajuan Saya,
  Favorit, **Profil Saya** → `/profil`, Submit Produk, Keluar.
- Navbar kini memanggil `getMyProfile()` dan mengoper `socials` ke UserMenu;
  karena simpan profil memicu `router.refresh()`, popup selalu menampilkan data
  terbaru.

### 5.6 Ikon brand custom (`components/member/SocialIcons.tsx`)
- Instagram, WhatsApp, LinkedIn, X, Facebook sebagai SVG inline —
  lucide-react tidak menyediakan ikon brand.

### 5.7 Infrastruktur sesi
- Dev server pernah gagal dijalankan sebagai background job (mati saat shell
  ditutup) → di-restart persisten; log di `/tmp/kd-dev.log`.

---

## 6. Keputusan Desain & Alasannya

| Keputusan | Alasan |
|---|---|
| Error page menampilkan `Kode: <digest>` di production | Next.js menghapus `error.message` di production demi keamanan (pesan bisa bocor nama tabel/stack). Digest = "nomor tiket" untuk dicocokkan ke log server — pola Vercel/Linear/GitHub |
| Pesan error asli tampil di dev | Mempercepat debugging tanpa buka console (terbukti: membongkar bug GRANT) |
| Profil tanpa statistik | Statistik = urusan dashboard; profil = identitas + pengaturan (pola GitHub/Notion); menghemat 1 query |
| Ikon sosmed di popup hanya yang terisi | Menghindari ikon mati/menyesatkan |
| Sosmed disimpan sebagai URL utuh ternormalisasi | Link benar-benar berfungsi ke platform; input tetap ramah (handle saja boleh) |
| Update profil via service-role client + validasi server | Pola yang sudah dipakai project; RLS tetap menjaga baris |
| Ikon brand SVG sendiri | lucide-react tidak menyediakan brand icons |

---

## 7. Status & Risiko Saat Ini

| Item | Status |
|---|---|
| TypeScript (`tsc --noEmit`) | ✅ Bersih |
| Test (Vitest) | ✅ 24/24 lolos |
| Dev server | ✅ `:3000`, `/profil` & `/favorit` HTTP 200 (33–67ms) |
| Database | ✅ Sehat — GRANT fix, kolom sosmed ada, RLS aktif, bucket siap |
| **Git** | ⚠️ **±15 file modified + file baru BELUM di-commit**: `error.tsx`, profil page, `ProfileEditor.tsx`, `SocialIcons.tsx`, `UserMenu.tsx`, `Navbar.tsx`, `data.ts`, `api/profile/route.ts`, migration 0010, `setup-all.sql`, dll |
| Proses dev server | ⚠️ Berjalan dari background shell (`/tmp/kd-dev.log`) — kalau mati, jalankan `npm run dev` |
| `lib/favorites.ts` | ⚠️ Legacy localStorage, tak dipakai lagi — kandidat dihapus |

---

## 8. Rekomendasi Langkah Berikutnya

1. **Commit sekarang** — pisah 3 commit logis:
   - `fix(db): grant select on public tables (permission denied fix)`
   - `feat(profile): editor lengkap + link sosmed ternormalisasi + popup identitas avatar`
   - `ui(error): error page minimalis + pesan error mode dev`
2. **Uji fungsional end-to-end dengan login sungguhan** (semua verifikasi sesi
   ini tanpa cookie login): edit profil, upload avatar, simpan sosmed, cek popup,
   toggle favorit, alur submit → approve.
3. **Hapus `lib/favorites.ts` legacy** saat refactoring berikutnya.
4. **Sebelum deploy Vercel:** jalankan `setup-all.sql` di Supabase production
   (bug GRANT bisa berulang saat tabel dibuat ulang); pastikan
   `SUPABASE_SERVICE_ROLE_KEY` & `SUPABASE_ACCESS_TOKEN` tidak pernah sampai ke client.
5. **Opsional berikutnya:** badge verifikasi di popup; preview "profil publik
   saya"; halaman `u/[id]` menampilkan sosmed pemilik produk (data sudah
   tersedia); integrasi Sentry di `error.tsx` (slot komentar sudah disiapkan).

---

*Dokumen ini dihasilkan dari audit menyeluruh codebase, skema database live
(via Supabase Management API), dan riwayat pengerjaan pada 2 September 2026.*
