"use client";

import { useEffect, useRef } from "react";

/**
 * Merekam satu view saat halaman produk dibuka, via API route rate-limited
 * (5/menit/IP). RPC publik dihapus (migration 0009) - perekaman kini lewat
 * service-role di server. Guard ref mencegah double-record akibat strict
 * mode / re-render.
 */
export function ViewTracker({ productId }: { productId: string }) {
  const recorded = useRef(false);

  useEffect(() => {
    if (recorded.current) return;
    recorded.current = true;
    fetch(`/api/products/${productId}/view`, { method: "POST" }).catch(() => {
      // Kegagalan perekaman view tidak mengganggu pengunjung.
    });
  }, [productId]);

  return null;
}
