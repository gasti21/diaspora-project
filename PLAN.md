# 📋 PLAN — Fix Keamanan Round-2 (KaryaDiaspora)

> Disimpan: 31 Agu 2026. Status: **BELUM DIEKSEKUSI — menunggu konfirmasi "gas"**.
> Konteks: hasil audit round-2 pasca-fix sebelumnya (commit `051ea81`, migration 0005 live).
> Project ref Supabase: `scpboipfxqtyujhzgybk` (jalankan SQL via Management API dengan
> `SUPABASE_ACCESS_TOKEN` dari `.env.local` — terbukti berfungsi).
> Git: commit & push pakai identitas **Hakimiqbal / moeh.iqbal.hakim@gmail.com** ke branch `build`.

---

## 1. Migration 0006 — Tutup eskalasi role (CRITICAL) 🔴
File: `supabase/migrations/0006_protect_role_columns.sql`
- [ ] `revoke update` di `profiles` dari `anon` + `authenticated`
- [ ] `grant update` per-kolom HANYA: `full_name`, `avatar_url`, `bio` (+ kolom profil lain yang boleh diedit user)
- [ ] Trigger guard: tolak UPDATE yang mengubah `role`/`email`/`id` kecuali oleh service-role (`current_setting('role') = 'service_role'`) — defense-in-depth
- [ ] Blok INSERT dengan `role = 'admin'` oleh non-service-role
- [ ] Jalankan live via Management API + verifikasi: PATCH role via REST harus DITOLAK

Bukti kerentanan (terkonfirmasi live):
- `authenticated` punya grant `UPDATE` di kolom `profiles.role`
- policy `profiles_update_own` = `using (auth.uid() = id)` tanpa pembatasan kolom
→ user login bisa self-promote jadi admin via PATCH REST langsung ke Supabase.

## 2. Migration 0007 — Perketat storage (HIGH) 🟠
File: `supabase/migrations/0007_storage_policies.sql`
- [ ] Drop policy `product_images_auth_upload` lama (hanya cek bucket_id)
- [ ] Policy baru: `with check (bucket_id='product-images' AND (storage.foldername(name))[1] = auth.uid()::text)` — upload hanya ke folder sendiri
- [ ] Batasi ekstensi di policy: hanya `.jpg/.jpeg/.png`
- [ ] Tambah policy UPDATE/DELETE ke folder sendiri (bug: user tidak bisa hapus foto tak terpakai, kuota 25 file macet)
- [ ] Jalankan live + verifikasi

Masalah: upload via Storage REST bypass kuota & magic-byte check aplikasi;
bucket public → bisa jadi hosting file arbitrer (malware/phishing).

## 3. Rekonstruksi migration hilang (MEDIUM) 🟠
File: `supabase/migrations/0008_favorites_and_views.sql`
- [ ] Dump struktur live `favorites` & `product_views` dari DB (query `information_schema` / `pg_dump`)
- [ ] Tulis sebagai migration `create table if not exists` + RLS persis kondisi live
  (RLS favorites live: insert/select/delete `user_id = auth.uid()` — sudah benar, tinggal dicatat)
- Alasan: 2 tabel ini dibuat di luar file migration → environment baru tak bisa direproduksi

## 4. Bersihkan error leak (LOW) 🟢
- [ ] Route yang balikin `error.message` Supabase mentah → pesan generik:
  `src/app/api/favorites/[productId]/route.ts`, `src/app/api/profile/route.ts`,
  `src/app/api/admin/categories/*`, dan audit route lain dengan pola `(e as Error).message`

## 5. Validasi akhir
- [ ] `npx tsc --noEmit` ✅
- [ ] `npm test` (24 test) ✅
- [ ] `npm run build` ✅
- [ ] Commit (identitas Hakimiqbal) + push ke `origin build`

## ❌ Tidak disentuh kali ini
- Deploy Vercel (belum siap — owner minta ditunda)
- Fitur Fase 2: notifikasi email, favorit server-side, dokumen produk, multi-bahasa, dst.
- Rate limit Upstash Redis (butuh akun/instance)

---

## 📜 Riwayat yang sudah selesai (jangan diulang)
- ✅ Commit 61 file tertunda (`ca4fcd2`) + fix keamanan (`051ea81`) — pushed ke `build`
- ✅ Migration 0005: kolom `owner_email`/`owner_whatsapp` products di-revoke dari anon/authenticated (live & terverifikasi — REST leak ditolak `permission denied`)
- ✅ Endpoint `/api/products/[id]/contact` rate-limited (30/10m/IP, published only)
- ✅ Anti-spoofing: `owner_email` dipaksa dari sesi login
- ✅ `/api/admin/manage` POST/DELETE owner-only (`karyadiaspora@gmail.com`)
- ✅ CSP header di `next.config.ts`
- ✅ `.DS_Store` dibersihkan + `.gitignore`
