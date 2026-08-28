"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Sparkles } from "lucide-react";

/** Lama toast tampil sebelum menghilang sendiri (harus sama dengan durasi .animate-toast-progress). */
const AUTO_HIDE_MS = 6000;
/** Durasi animasi keluar toast. */
const EXIT_MS = 250;

/**
 * Notifikasi sambutan setelah login sukses. Callback OAuth mengirim
 * ?welcome=admin | user; toast muncul mengapung di pojok kanan bawah,
 * lalu menghilang sendiri tanpa menunggu klik apa pun. URL dibersihkan
 * otomatis supaya toast tidak muncul lagi saat halaman di-refresh.
 * Menyentuh toast membuatnya menutup lebih awal (bonus, bukan syarat).
 */
export function WelcomeToast() {
  const router = useRouter();
  const [variant, setVariant] = useState<"admin" | "user" | null>(null);
  const [leaving, setLeaving] = useState(false);

  // Baca ?welcome= sekali saat mount lalu bersihkan URL tanpa reload.
  useEffect(() => {
    const param = new URLSearchParams(window.location.search).get("welcome");
    if (param === "admin" || param === "user") {
      setVariant(param);
      router.replace(window.location.pathname, { scroll: false });
    }
    // Jalankan sekali saat mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-hilang: tidak ada tombol tutup, tidak menunggu pengguna.
  useEffect(() => {
    if (!variant) return;
    const t = setTimeout(() => setLeaving(true), AUTO_HIDE_MS);
    return () => clearTimeout(t);
  }, [variant]);

  // Lepas dari DOM setelah animasi keluar selesai.
  useEffect(() => {
    if (!leaving) return;
    const t = setTimeout(() => setVariant(null), EXIT_MS);
    return () => clearTimeout(t);
  }, [leaving]);

  if (!variant) return null;

  const isAdmin = variant === "admin";

  return (
    <div
      role="status"
      aria-live="polite"
      title="Klik untuk menutup lebih cepat"
      onClick={() => setLeaving(true)}
      className={
        "animate-toast-in fixed inset-x-4 bottom-4 z-50 flex cursor-pointer items-start gap-3 overflow-hidden rounded-2xl border bg-white px-4 py-3.5 shadow-lg shadow-navy/15 " +
        (leaving ? "animate-toast-out " : "") +
        (isAdmin ? "border-blue-200" : "border-green-200") +
        " sm:inset-x-auto sm:bottom-6 sm:right-6 sm:w-[22rem]"
      }
    >
      <span
        className={
          "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full " +
          (isAdmin ? "bg-blue-50 text-blue-600" : "bg-green-50 text-green-600")
        }
      >
        {isAdmin ? (
          <ShieldCheck className="h-5 w-5" aria-hidden="true" />
        ) : (
          <Sparkles className="h-5 w-5" aria-hidden="true" />
        )}
      </span>
      <p className="flex-1 text-sm leading-relaxed text-muted">
        <span className="block font-bold text-navy">
          {isAdmin ? "Selamat datang kembali!" : "Selamat datang!"}
        </span>
        {isAdmin
          ? "Anda masuk sebagai admin — pengajuan produk member menanti review Anda."
          : "Ajukan karya terbaik Anda, lalu pantau statusnya di menu Pengajuan Saya."}
      </p>
      {/* bar durasi — menyusut habis tepat saat toast menghilang sendiri */}
      <span
        aria-hidden="true"
        className={
          "animate-toast-progress absolute inset-x-0 bottom-0 h-1 rounded-full " +
          (isAdmin ? "bg-blue-500" : "bg-green-500")
        }
      />
    </div>
  );
}