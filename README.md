# KaryaDiaspora — Platform Konektivitas Bisnis Diaspora Indonesia

Pusat informasi produk, bisnis, aplikasi, riset, dan karya kreatif diaspora
Indonesia di seluruh dunia. Dikembangkan oleh Tim Bidang IT dan Data PPID DPBD.

> **Status (8 Sep 2026):** MVP + Fase 2 selesai — ulasan produk, chat support
> realtime, manajemen pengajuan member, peta lokasi, notifikasi email, dan
> auto-update realtime sudah berjalan. Fase 3 (hardening pra-deploy) belum.

## Alur Utama (PRD v1.0)

1. Pengunjung menjelajah katalog **tanpa registrasi** (Explore, filter, detail).
2. Tombol **"Hubungi Pemilik"** membuka pop-up berisi Nama, Email, Lokasi,
   Website pemilik produk.
3. Pemilik produk **login via Google (Gmail)** lalu mengisi form submit — produk
   tersimpan berstatus **Pending**.
4. Admin mengelola **satu dashboard** yang difilter per status
   (Pending / Published / Revision / Rejected). Approve → langsung tayang.

## Teknologi

| Lapisan | Teknologi |
|---|---|
| Framework | [Next.js 15](https://nextjs.org) (App Router) + React 19 + TypeScript |
| Styling | [Tailwind CSS v4](https://tailwindcss.com) (tema kustom: navy `#16274e`, merah `#d32f2f`) |
| Backend | [Supabase](https://supabase.com) — Postgres + RLS, Auth Google OAuth, Storage, Realtime |
| Peta | Leaflet + tile proxy internal + geocoding (Nominatim/BigDataCloud) |
| Ikon | lucide-react; ikon brand sosmed SVG kustom (`SocialIcons.tsx`) |
| Email | Resend (notifikasi — graceful no-op tanpa API key) |
| Testing | Vitest (`npm test`) + CI GitHub Actions (lint, type check, test) |
| Hosting | Vercel (tier gratis) |

## Fitur

### Publik (tanpa login)
- **Explore**: pencarian, filter kategori/tipe/tahap, urutan, pagination.
- **Detail produk**: galeri carousel, tabs, peta lokasi (Leaflet), share,
  **ulasan** (baca publik), view counter anti-spam (rate limit 5/menit/IP).
- **Profil publik pemilik** `/u/[id]` (hanya tampil bila punya produk).
- **Tahap produk ala Indiegogo**: Ide → Prototipe → Produksi → Sudah Dipasarkan.

### Member (login Google)
- **Submit produk** multi-langkah dengan **deteksi lokasi otomatis** (GPS +
  reverse geocoding, fallback pilih manual di peta).
- **Manajemen pengajuan**: dashboard, edit, tarik (withdraw) pengajuan sendiri.
- **Favorit** tersimpan di database (sinkron antar perangkat).
- **Profil**: avatar, bio, link sosmed ternormalisasi.
- **Chat support** ala Shopee: sesi dengan admin, realtime (Supabase Realtime +
  poll fallback 30 dtk), maks 1 sesi aktif, auto-close 48 jam (lazy-eval).
- **Ulasan produk**: rating 1–5 + teks + media (foto/video), 1 ulasan per user
  per produk, bisa hapus ulasan sendiri.

### Admin
- **Overview** dengan grafik distribusi status & quick-approve.
- **Produk**: tabel semua status, drawer review, **aksi bulk**, edit produk,
  regenerasi slug (slug lama redirect otomatis).
- **Kategori**: CRUD kategori.
- **Pengguna**: kelola admin (`role = 'admin'` di DB, owner diatur langsung).
- **Aktivitas kurasi**: log aktivitas.
- **Support inbox**: balas & selesaikan sesi chat (shared `ChatPanel`).
- **Notifikasi terpusat kanan-atas** (toast) + badge lonceng admin & member.

### Infrastruktur
- **Realtime auto-update**: perubahan `products`, `product_reviews`,
  `support_messages`, `profiles` memicu `router.refresh()` — semua peran melihat
  data terbaru tanpa reload (migration `0023`).
- **Keamanan**: RLS ketat (atasi rekursi via `is_admin()`), proteksi kolom
  kontak & role, anti-scraping kontak, anti-spoofing email, CSP lengkap,
  rate limit, error generik di production (detail di dev).
- **OG image dinamis** per produk (`/api/og/[slug]`) + link-preview endpoint.
- **Mode demo**: tanpa `.env.local`, aplikasi tetap jalan memakai data contoh
  (`src/lib/sample-data.ts`). Semua penulisan baru aktif setelah Supabase
  terhubung.

## Struktur

```
docs/                 RENCANA-KERJA.md, LAPORAN-PROJECT.md, ARCHITECTURE.md
docs/design/          mockup acuan UI + varian desain (PH/Kickstarter/Tokped)
supabase/migrations/  0001–0024: skema, RLS, storage, favorites/views, sosmed,
                      support chat, ulasan, koordinat, tahap, realtime, slug lama
supabase/setup-all.sql  skrip setup idempotent (termasuk fix GRANT baca)
supabase/seed.sql     kategori + produk contoh
scripts/              cleanup-orphan-images.ts (bersihkan foto yatim di Storage)
src/app/(public)/     home, explore, produk/[slug], u/[id], tentang, kontak
src/app/(member)/     dashboard, pengajuan (+edit), submit, favorit, profil, support
src/app/admin/        overview, produk (+edit), kategori, pengguna, aktivitas,
                      support, profil
src/app/api/          products, favorites, profile, upload, reviews, support,
                      geocode, map-tile, link-preview, og, admin/*
src/components/
  layout/             Navbar, NavLinks, UserMenu, MobileMenu, Footer, RouteProgress
  member/             MemberShell, ProfileEditor, SocialIcons, NotificationBell
  admin/              AdminShell, ProductsView, ProductDrawer, SupportInbox, dll
  product/            ProductCard, tabs, carousel, kontak, share, MiniMap,
                      reviews/ (ProductReviews, lightbox)
  support/            ChatPanel, SupportView, useChatSync (realtime hook)
  catalog/            SearchBar, FilterBar, Pagination
  forms/              SubmitForm, LocationPicker (GPS ala Shopee)
  toast/              ToastProvider (notifikasi kanan-atas), WelcomeNotifier
  auth/               SignOutButton, ProfileMenu, EditProfileModal
  branding/           Logo, BrandIcon
src/lib/
  data.ts             ±64 fungsi query Supabase (single data layer)
  auth.ts             getSessionUser (cached), isDbAdmin, PROTECTED_ADMIN_EMAIL
  api-error.ts        serverError(): generik di production, detail di dev
  rate-limit.ts       rate limit in-memory (sliding window)
  validation.ts       validasi input server-side
  email/              send.ts + templates.tsx (Resend)
  supabase/           client, server, config
  constants.ts, types.ts, sample-data.ts, utils.ts
```

## Setup Development

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # Vitest
npm run lint       # ESLint
```

### 1. Buat project Supabase (gratis)

1. Daftar di [supabase.com](https://supabase.com) → **New project**.
2. Salin **Project URL**, **anon key**, dan **service_role key** dari
   *Project Settings → API*.
3. Buka *SQL Editor*, jalankan `supabase/setup-all.sql` (idempotent, mencakup
   semua migration + fix GRANT), lalu `supabase/seed.sql`.
   Alternatif: jalankan tiap file di `supabase/migrations/` berurutan
   (`0001` → `0024`).

### 2. Aktifkan login Google (Gmail)

1. [Google Cloud Console](https://console.cloud.google.com) → buat project →
   *APIs & Services → OAuth consent screen* (External, isi nama app).
2. *Credentials → Create Credentials → OAuth client ID* → **Web application**.
   - **Authorized redirect URI:**
     `https://<project-ref>.supabase.co/auth/v1/callback`
     (ganti `<project-ref>` dengan ref project Supabase — **tidak perlu** URI
     localhost; callback ditangani Supabase).
3. Supabase → *Authentication → Providers → Google* → enable, isi Client ID &
   Secret → **Save**.
4. Supabase → *Authentication → URL Configuration*:
   - **Site URL:** `http://localhost:3000` (dev) atau domain produksi.
   - **Redirect URLs:** `http://localhost:3000/auth/callback`
     (dan `https://<domain-produksi>/auth/callback` saat deploy).

### 3. Aktifkan Realtime (wajib untuk chat & auto-update)

Migration `0023_realtime_publication.sql` mendaftarkan tabel `products`,
`product_reviews`, `support_messages`, `profiles` ke publication
`supabase_realtime`. Bila menjalankan migration manual, pastikan file ini
dieksekusi.

### 4. Isi `.env.local`

```bash
cp .env.example .env.local
# lalu isi:
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Opsional — email transaksional (kosongkan untuk mematikan, graceful no-op):
RESEND_API_KEY=
NOTIFY_FROM=KaryaDiaspora <onboarding@resend.dev>
```

> Tidak ada variabel `ADMIN_EMAILS`. Status admin disimpan di database
> (tabel `profiles`, kolom `role = 'admin'`) dan dikelola lewat `/admin` >
> "Kelola Admin". Admin pemilik (owner) diatur langsung di DB.

### 5. Deploy ke Vercel

1. Push repo ke GitHub → import di [vercel.com](https://vercel.com).
   CI (`lint` + `tsc` + `test`) berjalan otomatis per push/PR.
2. Tambahkan semua variabel `.env.local` di *Project → Settings → Environment
   Variables* (`NEXT_PUBLIC_SITE_URL` = domain Vercel).
3. Deploy. Setelah dapat domain, perbarui Redirect URLs Supabase & jalankan
   `setup-all.sql` di DB production.

## API Ringkas

| Method | Endpoint | Akses | Fungsi |
|---|---|---|---|
| GET | `/api/products` | publik | katalog published + filter/search/pagination |
| POST | `/api/products` | login | ajukan produk (→ pending) |
| PATCH/DELETE | `/api/products/[id]` | owner | edit / tarik pengajuan |
| DELETE | `/api/my/products/[id]` | owner | tarik (withdraw) pengajuan |
| POST | `/api/products/[id]/view` | publik | view counter (rate-limited) |
| GET/POST | `/api/products/[id]/reviews` | publik / login | baca / tulis ulasan |
| GET/POST/DELETE | `/api/favorites` | login | favorit produk |
| GET/PATCH | `/api/profile` | login | profil + sosmed |
| POST | `/api/upload`, `/api/reviews/upload` | login | unggah media (≤ 5MB) |
| GET/POST | `/api/support/sessions` | login | sesi chat support (user) |
| GET/POST | `/api/support/sessions/[id]/messages` | owner sesi | pesan chat |
| GET | `/api/geocode/search`, `/api/geocode/reverse` | publik | geocoding |
| GET | `/api/map-tile/[z]/[x]/[y]` | publik | proxy tile peta |
| GET | `/api/og/[slug]` | publik | OG image dinamis |
| GET | `/api/admin/products`, `/api/admin/stats` | admin | daftar semua status, statistik |
| PATCH | `/api/admin/products/[id]` | admin | ubah status + catatan review |
| POST | `/api/admin/products/bulk` | admin | aksi massal |
| CRUD | `/api/admin/categories` | admin | kelola kategori |
| GET/POST | `/api/admin/support*` | admin | inbox chat support |
| POST | `/api/admin/manage` | admin | kelola role pengguna |

## Roadmap

Selesai (lihat `docs/RENCANA-KERJA.md`):
✅ Fase 1 — amankan & rapikan (error handling seragam, dead code dihapus)
✅ Fase 2 — chat support realtime, ulasan, manajemen pengajuan, realtime UI

Berikutnya (Fase 3 — pra-deploy):
1. **Upstash Redis** untuk rate limit (in-memory `Map` tak efektif di serverless).
2. **Sentry** di `error.tsx` (slot komentar sudah disiapkan).
3. **Test API route**: guard non-admin 403, guard member.

Ide lanjutan: dokumen produk, multi-bahasa, badge verifikasi, preview profil
publik, sosmed di halaman `u/[id]`.

## Dokumentasi Lain

| Dokumen | Isi |
|---|---|
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | arsitektur teknis, skema DB, pola keamanan |
| [`docs/RENCANA-KERJA.md`](docs/RENCANA-KERJA.md) | rencana & status per fase |
| [`docs/LAPORAN-PROJECT.md`](docs/LAPORAN-PROJECT.md) | laporan audit & riwayat pengerjaan |
