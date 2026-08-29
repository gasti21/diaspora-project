"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, LogOut } from "lucide-react";
import { useToast } from "@/components/toast/ToastProvider";
import { cn } from "@/lib/utils";

/** Tombol keluar yang dipakai di halaman Profil & drawer member. */
export function SignOutButton({
  label = "Keluar dari Akun",
  className,
}: {
  label?: string;
  className?: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  async function signOut() {
    setBusy(true);
    await fetch("/auth/signout", { method: "POST" });
    toast.info("Anda sudah keluar. Sampai jumpa lagi!");
    router.push("/");
    router.refresh();
  }

  return (
    <button
      onClick={signOut}
      disabled={busy}
      className={cn(
        "flex items-center justify-center gap-2 rounded-lg border border-brand/30 bg-brand-soft px-5 py-3 text-sm font-semibold text-brand transition hover:bg-brand hover:text-white disabled:opacity-60",
        className
      )}
    >
      {busy ? (
        <LoaderCircle className="h-4.5 w-4.5 animate-spin" aria-hidden="true" />
      ) : (
        <LogOut className="h-4.5 w-4.5" aria-hidden="true" />
      )}
      {label}
    </button>
  );
}
