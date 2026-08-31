"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Merekam satu view saat halaman produk dibuka (via RPC security definer,
 * jadi pengunjung anonim pun bisa merekam tanpa bypass RLS). Guard ref
 * mencegah double-record akibat strict mode / re-render.
 */
export function ViewTracker({ productId }: { productId: string }) {
  const recorded = useRef(false);

  useEffect(() => {
    if (recorded.current) return;
    recorded.current = true;
    createClient()
      .rpc("record_product_view", { p_product_id: productId })
      .then(({ error }) => {
        if (error) console.warn("Gagal merekam view:", error.message);
      });
  }, [productId]);

  return null;
}
