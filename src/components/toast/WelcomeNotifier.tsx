"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/toast/ToastProvider";

/**
 * Notifikasi sambutan setelah login sukses. Callback OAuth mengirim
 * ?welcome=admin | user; tampil sebagai toast kanan-atas yang menghilang
 * sendiri, lalu URL dibersihkan supaya tidak muncul lagi saat refresh.
 * Dipasang di root layout - berlaku untuk area admin maupun user.
 */
export function WelcomeNotifier() {
  const router = useRouter();
  const toast = useToast();
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return; // jangan dobel saat React strict mode
    const param = new URLSearchParams(window.location.search).get("welcome");
    if (param === "admin") {
      fired.current = true;
      toast.success(
        "Anda masuk sebagai admin - pengajuan produk member menanti review Anda.",
        { title: "Selamat datang kembali!" }
      );
      router.replace(window.location.pathname, { scroll: false });
    } else if (param === "user") {
      fired.current = true;
      const name = new URLSearchParams(window.location.search).get("name");
      const firstName = name ? name.split(" ")[0] : null;
      toast.success(
        "Jelajahi karya terbaru dari diaspora Indonesia.",
        { title: firstName ? `Selamat datang, ${firstName}!` : "Selamat datang!" }
      );
      router.replace(window.location.pathname, { scroll: false });
    }
  }, [router, toast]);

  return null;
}