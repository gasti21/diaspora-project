# 📋 PLAN — KaryaDiaspora

> **Status terkini (8 Sep 2026):** semua round perbaikan & Fase 1–2 SELESAI.
> Detail fase aktif ada di `docs/RENCANA-KERJA.md`, arsitektur di
> `docs/ARCHITECTURE.md`.

## ✅ Selesai (riwayat, jangan diulang)

### Round-5 — 8 Sep 2026 (bug fix + infrastruktur)
- [x] Fix kritis: `GET /api/admin/manage` selalu 500 karena `if (error)` tanpa `{}` → kini 403 untuk non-admin (bug membuat menu Kelola Admin mati total)
- [x] Fix dead code & syntax: unreachable `return {}` di `adminDeleteProduct`, semicolon ganda di `adminUpdateProduct`
- [x] Fix navigasi: link "Kelola favorit" di landing (`/dashboard/favorit` → `/favorit`)
- [x] Render bio pelaku (Tahun Berdiri & Jenis Pelaku) di tab "Tentang Produk" (`ProductTabs.tsx`) — data sudah ditarik tapi tidak pernah ditampilkan
- [x] Pembersihan ESLint: unused imports, eslint-disable redundan, `next-env.d.ts` di-ignore → 0 error, 24/24 test pass
- [x] Fix redirect OAuth: `auth/callback`, `auth/signout`, `middleware` kini pakai `SITE_URL` (bukan `request.url`/`origin`) — memperbaiki `localhost:3000` error saat akses via tunnel
- [x] Infrastruktur: PM2 diarahkan ke clone kerja `/home/ubuntu/repos/diaspora-project` (sebelumnya me-serve clone lama `/tmp/diaspora-project` tanpa fitur baru)
- [x] Supabase Auth config: `site_url` + `uri_allow_list` diset ke tunnel URL
- [x] **Link preview:** `https://breach-tap-kilometers-answer.trycloudflare.com`

### Round-4 — 31 Agu 2026
- [x] CSP avatar Google (`lh3.googleusercontent.com` di `next.config.ts`)
- [x] Anti-spam view counter: API route `/api/products/[id]/view` rate-limited
      (5/menit/IP), service-role insert; RPC publik `record_product_view` dihapus (0009)
- [x] Guard profil member kosong: `/u/[id]` → `notFound()` bila tanpa produk
- [x] `adminGetOverview` & `adminListActivity` → `createAdminClient()`

### Pasca-Round-4 (Sep 2026) — fitur besar yang sudah live
- [x] Fase 1 RENCANA-KERJA: commit mengambang, error handling seragam (`api-error.ts`), dead code dihapus
- [x] Fase 2 RENCANA-KERJA: chat support realtime (`support_sessions`/`support_messages`, 0011), UI user `/support` + inbox admin, auto-close 48 jam
- [x] Ulasan produk ala Tokopedia (0013): rating + teks + media, bucket `review-media`
- [x] Manajemen pengajuan member: edit & tarik pengajuan sendiri (0020–0022)
- [x] Tahap produk 4 level ala Indiegogo + rename kategori (0017)
- [x] Peta Leaflet + proxy tile + geocoding; koordinat produk (0015)
- [x] Notifikasi email Resend (0012), profil bio & sosmed (0010, 0016)
- [x] Realtime auto-update UI (0023) + redirect slug lama (0024)
- [x] CI GitHub Actions (lint + `tsc --noEmit` + Vitest)

## 🎯 Berikutnya (Fase 3 — pra-deploy, lihat docs/RENCANA-KERJA.md)

- [ ] Rombak total UI (public/member/admin) — design system anti-slop mengikuti prinsip Superdesign
- [ ] Upstash Redis untuk rate limit (in-memory Map tak efektif di serverless)
- [ ] Sentry di `error.tsx` (slot komentar sudah disiapkan)
- [ ] Test API route: guard non-admin 403 di endpoint admin, guard member
- [ ] Deploy Vercel (jalankan `setup-all.sql` di DB production)

## 📜 Riwayat lebih lama (jangan diulang)

- Round-4 (31 Agu 2026): CSP avatar Google, anti-spam view counter (0009), guard profil member kosong, admin queries konsisten.
- Round-3 (2 Sep 2026): Chat support realtime (0011), ulasan produk (0013), profil sosmed ternormalisasi (0010).
- Round-2 (`f68edb6`, 29 Agu 2026): 0006 eskalasi role · 0007 storage · 0008 favorites/views/RPC · error leak.
- Round-1 (`051ea81`, 25 Agu 2026): anti-scraping kontak (0005), anti-spoofing email, owner-only admin, CSP.