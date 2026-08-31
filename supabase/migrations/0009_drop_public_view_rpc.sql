-- ============================================================
-- 0009: Hapus RPC publik record_product_view.
--
-- Kerentanan: RPC security-definer ini bisa dipanggil SIAPA PUN
-- tanpa login dan tanpa rate limit langsung via REST Supabase -
-- bot dapat menggelembungkan jumlah view produk semaunya.
--
-- Pengganti: API route /api/products/[id]/view yang rate-limited
-- (5/menit/IP) merekam view via service-role insert langsung ke
-- product_views (RLS tabel tetap menutup akses langsung).
-- ============================================================

drop function if exists public.record_product_view(uuid);