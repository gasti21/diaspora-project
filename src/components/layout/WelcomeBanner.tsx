"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Sparkles, X } from "lucide-react";

/**
 * Sapaan singkat setelah login sukses. Muncul bila callback OAuth
 * mengirim ?welcome=admin | user; URL dibersihkan otomatis supaya
 * banner tidak muncul lagi saat halaman di-refresh.
 */
export function WelcomeBanner() {
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const [variant, setVariant] = useState<"admin" | "user">("user");

  useEffect(() => {
    const param = new URLSearchParams(window.location.search).get("welcome");
    if (param === "admin" || param === "user") {
      setVariant(param);
      setVisible(true);
      // Bersihkan query param tanpa reload.
      router.replace(window.location.pathname, { scroll: false });
    }
    // Jalankan sekali saat mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!visible) return null;

  const isAdmin = variant === "admin";

  return (
    <div
      className={
        "mx-auto mb-6 mt-6 flex max-w-7xl items-start gap-3 rounded-2xl border px-5 py-4 " +
        (isAdmin
          ? "border-blue-100 bg-blue-50/70"
          : "border-green-100 bg-green-50/70")
      }
    >
      {isAdmin ? (
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" aria-hidden="true" />
      ) : (
        <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-green-600" aria-hidden="true" />
      )}
      <p className="flex-1 text-sm leading-relaxed text-navy/85">
        {isAdmin ? (
          <>
            <span className="font-bold">Selamat datang kembali!</span> Anda masuk
            sebagai admin - produk pengajuan member menanti review Anda.
          </>
        ) : (
          <>
            <span className="font-bold">Selamat datang!</span> Ceritakan karya
            terbaik Anda - setelah submit, status pengajuannya bisa Anda pantau
            di menu <span className="font-semibold">Pengajuan Saya</span>.
          </>
        )}
      </p>
      <button
        onClick={() => setVisible(false)}
        aria-label="Tutup sapaan"
        className="shrink-0 rounded-full p-1 text-muted transition hover:bg-white/70 hover:text-navy"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}
