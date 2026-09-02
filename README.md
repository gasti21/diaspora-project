# KaryaDiaspora - Platform Konektivitas Bisnis Diaspora Indonesia (MVP)

Pusat informasi produk, bisnis, aplikasi, riset, dan karya kreatif diaspora
Indonesia di seluruh dunia. Dikembangkan oleh Tim Bidang IT dan Data PPID DPBD.

**Alur MVP (sesuai PRD v1.0):**

1. Pengunjung menjelajah katalog **tanpa registrasi** (Explore, filter, detail).
2. Tombol **"Hubungi Pemilik"** membuka **pop-up** berisi Nama, Email, Lokasi,
   Website pemilik produk (tombol "Saya Tertarik" dihapus).
3. Pemilik produk **login via Google (Gmail)** lalu mengisi form submit - produk
   tersimpan berstatus **Pending**.
4. Admin mengelola **satu dashboard** yang difilter per status
   (Pending / Published / Revision / Rejected). Approve → langsung tayang.

## Teknologi

- [Next.js 15](https://nextjs.org) (App Router, TypeScript)
- [Tailwind CSS v4](https://tailwindcss.com)
- [Supabase](https://supabase.com) - Postgres + Auth (Google OAuth) + Storage
- Hosting: Vercel (tier gratis)

## Struktur

```
docs/design/          5 mockup acuan UI (company-profile, explore, detail, submit, dashboard)
supabase/migrations/  skema database + RLS + storage bucket
supabase/seed.sql     6 kategori + produk contoh
src/app/              halaman + API
src/app/(public)/     landing, explore, detail produk, tentang, kontak
src/app/(member)/     area member (login): dashboard, pengajuan, submit, favorit, profil
src/app/admin/        panel admin: overview, produk, aktivitas kurasi, pengguna
src/components/
  branding/           Logo, ikon brand
  layout/             Navbar + MobileMenu (drawer), Footer, UserMenu
  member/             MemberShell (sidebar member ala panel admin)
  product/            ProductCard (+ tombol favorit), tabs, carousel, kontak, share
  catalog/            SearchBar, FilterBar (+ urutan), Pagination
  forms/              SubmitForm + LocationPicker (deteksi GPS ala Shopee)
  admin/              AdminShell, SidebarNav, NotificationBell, tabel & drawer review
  toast/              ToastProvider (semua notifikasi tampil kanan-atas)
src/lib/              data layer, klien Supabase, konstanta
```

## Fitur Utama

- **Notifikasi terpusat kanan-atas** untuk admin & member (toast + progress bar).
- **Panel admin**: sidebar bergrup, lonceng notifikasi badge pending, overview
  dengan grafik distribusi status & quick-approve, halaman Aktivitas Kurasi.
- **Area member** (navigasi via navbar atas): Dashboard, Pengajuan Saya,
  Submit Produk, Favorit, Profil.
- **Deteksi lokasi otomatis** di form submit (GPS realtime + reverse geocoding
  gratis via BigDataCloud, fallback pilih manual).
- **Favorit produk** (ikon hati, login-only, tersimpan di database - sinkron antar perangkat).
- **Explore**: pencarian, filter, urutan (terbaru/terlama/nama), pagination.

> **Mode demo:** tanpa `.env.local`, aplikasi tetap jalan memakai data contoh
> (`src/lib/sample-data.ts`) - cocok untuk review UI. Semua penulisan (submit,
> aksi admin) baru aktif setelah Supabase terhubung.

## Setup Development

```bash
npm install
npm run dev        # http://localhost:3000
```

### 1. Buat project Supabase (gratis)

1. Daftar di [supabase.com](https://supabase.com) → **New project**.
2. Salin **Project URL**, **anon key**, dan **service_role key** dari
   *Project Settings → API*.
3. Buka *SQL Editor* di dashboard Supabase, jalankan isi
   `supabase/migrations/0001_init.sql`, lalu `supabase/seed.sql`.

### 2. Aktifkan login Google (Gmail)

1. Buka [Google Cloud Console](https://console.cloud.google.com) → buat project →
   *APIs & Services → OAuth consent screen* (External, isi nama app).
2. *Credentials → Create Credentials → OAuth client ID* → tipe **Web application**.
   - **Authorized redirect URI:**
     `https://<project-ref>.supabase.co/auth/v1/callback`
     Ganti `<project-ref>` dengan ref project Supabase Anda (terlihat di URL project,
     contoh: `https://scpboipfxqtyujhzgybk.supabase.co`).
   - Ini satu-satunya redirect URI yang dibutuhkan - **tidak perlu** menambah
     `http://localhost:3000/...` di Google.
3. Buka Supabase → *Authentication → Providers → Google* → enable, lalu salin
   *Client ID* & *Client Secret* dari Google → **Save**.
4. Masih di Supabase → *Authentication → URL Configuration*:
   - **Site URL:** `http://localhost:3000` (dev) atau domain produksi.
   - **Redirect URLs:** tambahkan `http://localhost:3000/auth/callback`
     (dan `https://<domain-produksi>/auth/callback` saat sudah deploy).
   Tanpa ini, callback OAuth akan ditolak Supabase.

### 3. Isi `.env.local`

```bash
cp .env.example .env.local
# lalu isi:
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

> Tidak ada variabel `ADMIN_EMAILS`. Status admin disimpan di database
> (tabel `profiles`, kolom `role = 'admin'`) dan dikelola lewat halaman
> `/admin` > "Kelola Admin". Admin pemilik (owner) diatur langsung di DB.

### 4. Deploy ke Vercel

1. Push repo ke GitHub → import di [vercel.com](https://vercel.com).
2. Tambahkan semua variabel dari `.env.local` di *Project → Settings →
   Environment Variables* (isi `NEXT_PUBLIC_SITE_URL` dengan domain Vercel).
3. Deploy. Setelah dapat domain, perbarui *redirect URI* Google bila perlu.

## API Ringkas

| Method | Endpoint | Akses | Fungsi |
|---|---|---|---|
| GET | `/api/products` | publik | katalog published + filter/search/pagination |
| POST | `/api/products` | login Google | ajukan produk (→ pending) |
| POST | `/api/upload` | login Google | unggah foto (JPG/PNG ≤ 5MB) |
| GET | `/api/admin/products` | admin | daftar semua status |
| PATCH | `/api/admin/products/[id]` | admin | ubah status + catatan review |
| GET | `/api/admin/stats` | admin | jumlah per status |

## Fase 2 (di luar MVP)

Halaman Users & Pengaturan admin, notifikasi email otomatis (approve/reject),
favorit produk, dokumen produk, multi-bahasa.
