# 🏗️ Arsitektur — KaryaDiaspora

> Terakhir diperbarui: 8 September 2026. Ringkasan teknis untuk developer
> baru; panduan setup ada di [README.md](../README.md).

## 1. Gambaran Umum

Aplikasi **Next.js 15 App Router** (SSR-heavy) dengan **Supabase** sebagai
backend tunggal (Postgres + Auth + Storage + Realtime). Tidak ada server
terpisah — semua logika bisnis ada di Server Components, API Routes, dan
Row Level Security (RLS) di database.

```
Browser ── Next.js (Vercel) ──┬── Server Components ──► lib/data.ts ──► Supabase Postgres (RLS)
                              ├── API Routes (/api/*) ──► lib/data.ts / service-role client
                              ├── Supabase Storage (foto produk, avatar, media ulasan)
                              └── Supabase Realtime (postgres_changes → router.refresh())
```

## 2. Pola Arsitektur Penting

- **Single data layer** — semua query Supabase lewat `src/lib/data.ts`
  (±64 fungsi). Halaman & API route tidak pernah memanggil Supabase langsung
  untuk baca data. Client user (RLS aktif) untuk baca; **service-role client**
  (`createAdminClient()`) hanya untuk operasi bypass-RLS yang tervalidasi
  server (update profil, record view, kategori, dsb).
- **Auth** — `getSessionUser()` di `lib/auth.ts` (cached per request);
  status admin dibaca dari DB (`profiles.role = 'admin'`, via `is_admin()`
  SQL function untuk menghindari rekursi RLS). `PROTECTED_ADMIN_EMAIL`
  melindungi owner dari dicabut rolenya.
- **Error handling** — semua API route memakai `serverError()` dari
  `lib/api-error.ts`: pesan generik di production, detail di dev, selalu
  `console.error`.
- **Rate limit** — `lib/rate-limit.ts`, sliding window in-memory per IP
  (view counter 5/menit). ⚠️ Tidak efektif di serverless multi-instance —
  rencana diganti Upstash Redis (Fase 3).
- **Realtime** — listener `postgres_changes` client-side pada `products`,
  `product_reviews`, `support_messages`, `profiles` → memicu
  `router.refresh()` (halus, tanpa reload). Chat punya poll fallback 30 dtk
  (`useChatSync.ts`).
- **Validasi** — `lib/validation.ts` di sisi server untuk semua tulisan
  (produk, profil, ulasan, pesan chat).

## 3. Skema Database (ringkas)

Migration `0001`–`0024` (lihat `supabase/migrations/`, setup idempotent di
`supabase/setup-all.sql`):

| Tabel | Fungsi | Catatan RLS |
|---|---|---|
| `profiles` | identitas user: nama, avatar, bio, sosmed, `role` | user edit barisnya sendiri; role diubah admin |
| `products` | produk/pengajuan: status, stage 4 level, koordinat, slug + `previous_slug` | publik baca `published`; owner kelola punyanya; admin semua |
| `categories` | kategori katalog | CRUD admin |
| `product_reviews` | ulasan: rating 1–5, teks ≤1000, media jsonb | baca publik, tulis sendiri, hapus milik sendiri (unique per user/produk) |
| `favorites`, `product_views` | favorit & view counter | view dicatat via API route service-role (anti-spam) |
| `support_sessions`, `support_messages` | chat support | user = sesinya; admin = semua; partial unique index = maks 1 sesi open/user |
| `activity_log` | log aktivitas kurasi | baca admin |

Storage buckets: `product-images`, `avatars`, `review-media` (publik,
policy tertutup untuk tulis).

## 4. Keamanan

- RLS aktif di semua tabel publik; `is_admin()` security-definer untuk
  menghindari infinite recursion.
- Proteksi kolom kontak produk (`0005`, `0019`) — kontak hanya lewat popup
  "Hubungi Pemilik" (anti-scraping) & anti-spoofing email (`0006`).
- CSP lengkap di `next.config.ts` (termasuk `lh3.googleusercontent.com` untuk
  avatar Google), security headers, nol `dangerouslySetInnerHTML`.
- Service-role key & `SUPABASE_ACCESS_TOKEN` tidak pernah sampai ke client.
- Error production generik + digest (pola Vercel/Linear) — slot Sentry sudah
  disiapkan di `error.tsx`.

## 5. Endpoint API

Ringkasan lengkap ada di [README.md](../README.md#api-ringkas). Semua route
ada di `src/app/api/`, dikelompokkan: `products`, `favorites`, `profile`,
`reviews`, `support`, `geocode`, `map-tile`, `link-preview`, `og`, `admin/*`.

## 6. Testing & CI

- **Vitest** (`npm test`): **24 test di 4 file** (`rate-limit`, `validation`,
  `utils`, `curation-flow`) — semua di `src/lib/`, semua lolos ✅.
- **CI** (`.github/workflows/ci.yml`): lint → `tsc --noEmit` → test, per
  push/PR.
- Skrip utilitas: `scripts/cleanup-orphan-images.ts` (hapus foto Storage yang
  tidak lagi dirujuk produk).

## 7. Dokumen Terkait

- [RENCANA-KERJA.md](RENCANA-KERJA.md) — status per fase & keputusan desain.
- [LAPORAN-PROJECT.md](LAPORAN-PROJECT.md) — audit & riwayat pengerjaan.
