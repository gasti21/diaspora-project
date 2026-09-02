# 🎯 Rencana Kerja — KaryaDiaspora

> **Tanggal:** 2 September 2026
> **Status:** Rencana disetujui untuk disimpan · belum dieksekusi
> **Prinsip:** 3 fase berurutan, tiap fase independen — bisa berhenti kapan pun dan app tetap sehat.

---

## Daftar Isi

1. [Ringkasan](#ringkasan)
2. [Fase 1 — Amankan yang Sudah Ada](#fase-1--amankan-yang-sudah-ada-wajib-duluan)
3. [Fase 2 — Chat Support Realtime](#fase-2--chat-support-realtime-fitur-utama)
4. [Fase 3 — Pra-deploy Hardening](#fase-3--pra-deploy-hardening-nanti-sebelum-ke-vercel)
5. [Keputusan yang Masih Menunggu](#keputusan-yang-masih-menunggu)
6. [Temuan Audit](#temuan-audit-yang-melandasi-rencana)

---

## Ringkasan

| Fase | Tujuan | Prioritas |
|---|---|---|
| **1** | Amankan kerja yang belum di-commit + tutup celah kecil | 🔴 Mendesak — pengaman |
| **2** | Bangun chat support realtime (user ↔ admin, sesi ala Shopee) | 🟠 Fitur utama berikutnya |
| **3** | Hardening sebelum deploy ke Vercel | 🟡 Nanti, pra-deploy |

**Aturan urutan:** Fase 2 tidak dimulai sebelum Fase 1 beres (commit dulu = pengaman).

---

## Fase 1 — Amankan yang Sudah Ada (WAJIB duluan)

**Tujuan:** kerja sesi lalu tidak hilang + tutup celah kecil sebelum menambah fitur.

| # | Tugas | Detail |
|---|---|---|
| 1.1 | **Commit 17 file yang mengambang** | 3 commit logis:<br>• `fix(db): grant select on public tables`<br>• `feat(profile): editor + link sosmed ternormalisasi + popup identitas avatar`<br>• `ui(error): error page minimalis + pesan error mode dev` |
| 1.2 | **Seragamkan error handling API** | 8 endpoint yang me-return `e.message` mentah → ganti pesan generik ramah + `console.error` server-side (pola `api/profile` & `api/admin/manage`). Menutup kebocoran detail DB ke publik di production |
| 1.3 | **Hapus dead code + sinkronkan docs** | Hapus `lib/favorites.ts` (localStorage legacy), update README (favorit sekarang login-only di DB) |

**Endpoint yang bocor `e.message` (target 1.2):**

```
src/app/api/products/route.ts            (GET + POST)
src/app/api/products/[id]/route.ts       (PATCH + DELETE)
src/app/api/admin/products/route.ts      (GET)
src/app/api/admin/products/[id]/route.ts (PATCH)
src/app/api/admin/stats/route.ts         (GET)
src/app/api/upload/route.ts              (POST)
```

**Output:** git bersih, error handling konsisten, tidak ada kode/dok menyesatkan.

---

## Fase 2 — Chat Support Realtime (fitur utama)

**Tujuan:** user login bisa chat ke admin, admin balas, sesi ala Shopee.

### Desain yang sudah disepakati

| Aspek | Keputusan |
|---|---|
| Realtime | ✅ Supabase Realtime di `support_messages` (+ fallback poll) |
| Sesi | 1 user bisa banyak sesi; maks 1 sesi aktif per user pada satu waktu |
| Penutupan | Admin "Selesaikan" / user "Tutup" (konfirmasi) / **auto-close 48 jam** (lazy-eval + `closed_by='auto'`) |
| Closed | Read-only permanen, history tetap terlihat, sesi baru untuk topik baru |
| Enforcement | Server/API menolak kirim di sesi closed — bukan cuma sembunyi input |
| Notifikasi | Reuse pola NotificationBell: badge admin & user |
| Keamanan | RLS: user = sesi miliknya saja; admin = semua (via `is_admin()`) |

| Keamanan | RLS: user = sesi miliknya saja; admin = semua (via `is_admin()`) |

### Langkah implementasi

| # | Tugas | Detail |
|---|---|---|
| 2.1 | **Migration `0011_support_chat.sql`** | Tabel `support_sessions` (user_id, status open/closed, closed_by, closed_at, last_message_at, unread flags) + `support_messages` (session_id, sender_id, body, read_at). RLS ketat |
| 2.2 | **Aktifkan Realtime** | Masukkan `support_messages` ke `supabase_realtime` publication |
| 2.3 | **Data layer + API** | Fungsi `lib/data.ts` (buat sesi, kirim pesan, list sesi, tutup sesi) + route `/api/support/*` dengan enforcement server (tolak kirim di sesi closed / auto-close 48 jam) |
| 2.4 | **UI user** | Halaman `/support` — daftar sesi (Aktif di atas, Riwayat read-only), chat bubble realtime, tombol "Mulai Sesi Baru", banner "Sesi ditutup" |
| 2.5 | **UI admin** | Inbox di panel admin — tab Aktif/Riwayat, badge unread, tombol "Selesaikan" |
| 2.6 | **Notifikasi** | Reuse pola NotificationBell: badge saat pesan baru masuk (dua sisi) |
| 2.7 | **Pintu masuk** | Tombol "Chat Support" di popup avatar + aktifkan kartu di `/kontak` |

**Catatan teknis:** client `subscribe()` ke `support_messages` saat halaman terbuka (RLS otomatis memfilter — user hanya menerima event sesinya sendiri); auto-close 48 jam via lazy-eval saat query (tanpa cron job).

---

## Fase 3 — Pra-deploy Hardening (nanti, sebelum ke Vercel)

| # | Tugas | Catatan |
|---|---|---|
| 3.1 | **Upstash Redis** untuk rate limit | In-memory `Map` tidak efektif di serverless; ganti sliding-window ke Upstash (free tier) |
| 3.2 | **Sentry** di `error.tsx` | Slot komentar sudah disiapkan — supaya digest error production benar-benar "tertangkap" |
| 3.3 | **Test API route** | Minimal: non-admin ditolak 403 di endpoint admin; guard member |

---

## Keputusan yang Masih Menunggu

> Rencana ini disimpan sebelum tiga hal berikut diputuskan. Eksekusi menunggu jawaban.

1. **Urutan** — setuju Fase 1 → 2, atau langsung loncat ke chat support (Fase 2) dan skip commit dulu?
2. **Fase 1.2 (error handling)** — seragamkan ke **pesan generik** (lebih aman, disarankan) atau tetap tampilkan `e.message` saat dev? Bisa dua-duanya: generik di production, detail di dev.
3. **Chat support (Fase 2)** — desain sesi + auto-close 48 jam masih berlaku, atau ada yang diubah?

---

## Temuan Audit yang Melandasi Rencana

Ringkasan penilaian (detail lengkap di `docs/LAPORAN-PROJECT.md`):

| Aspek | Nilai | Catatan |
|---|---|---|
| **Security** | 8.5/10 | Kuat: RLS dewasa (atasi infinite recursion via `is_admin()`), auth berlapis, security headers lengkap, nol `dangerouslySetInnerHTML`, service-role tidak bocor. **Kurang:** rate-limit in-memory tak efektif di serverless, `e.message` bocor di 8 endpoint, belum ada monitoring |
| **Backend** | 8/10 | Rapi & konsisten (single data layer `lib/data.ts`). **Kurang:** error handling tak seragam, dead code `favorites.ts` |
| **Frontend** | 8.5/10 | Matang & dipoles. **Kurang:** chat support belum jalan |
| **Produksi-ready** | 6.5/10 | **Tertahan: commit + rate-limit + monitoring** |

**Risiko #1 saat ini:** 17 file modified (+834/−543 baris) belum di-commit — semua kerja sesi lalu masih mengambang.

---

*Dokumen rencana ini dibuat dari hasil audit langsung codebase (auth, RLS, rate-limit, validasi, middleware, security headers, endpoint) pada 2 September 2026.*
