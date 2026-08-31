# 📋 PLAN — Fix Round-4 (KaryaDiaspora)

> Status: **✅ SELESAI DIEKSEKUSI — 31 Agu 2026** (CSP avatar, anti-spam view + 0009 live, guard profil, admin queries)
> Git: identitas **Hakimiqbal / moeh.iqbal.hakim@gmail.com** → push ke `origin build`.

## 1. Fix regresi CSP — avatar Google rusak 🟠 (prioritas 1)
- [x] Tambah `https://lh3.googleusercontent.com` + `https://*.googleusercontent.com` ke `img-src` di `next.config.ts`
- Latar: CSP round-1 memblokir avatar user login Google → semua foto profil broken

## 2. Anti-spam view counter 🟡 (prioritas 2)
- [x] `ViewTracker` → panggil API route `/api/products/[id]/view` yang rate-limited (5/menit/IP), bukan RPC langsung dari browser
- [x] `data.ts`: fungsi `recordProductView` via service-role insert (bypass RLS, tanpa RPC publik)
- [x] Migration 0009: `drop function public.record_product_view` (tutup pintu spam RPC langsung)
- [x] Jalankan migration ke DB live + verifikasi
- Latar: RPC security-definer bisa dipanggil anon tanpa limit → view bisa digelembungkan bot

## 3. Guard profil member kosong 🟢 (prioritas 3)
- [x] `/u/[id]`: `notFound()` jika `productCount === 0`

## 4. Konsistensi admin queries — defense-in-depth 🟢 (prioritas 4)
- [x] `adminGetOverview` & `adminListActivity`: user client + RLS → `createAdminClient()`

## 5. Validasi & rilis
- [x] `tsc --noEmit` · `npm test` · `npm run build`
- [x] Commit + push ke `origin build` · update status plan

## ❌ Tidak disentuh
- Deploy Vercel (belum siap) · Fitur Fase 2 · Upstash Redis

---
## 📜 Riwayat selesai (jangan diulang)
- Round-1 (`051ea81`): anti-scraping kontak (0005), anti-spoofing email, owner-only admin, CSP
- Round-2 (`f68edb6`): 0006 eskalasi role · 0007 storage · 0008 favorites/views/RPC · error leak
