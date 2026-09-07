"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

/**
 * Garis progres tipis di atas layar saat berpindah halaman (ala YouTube).
 * Muncul saat link diklik, selesai saat pathname berubah (atau timeout
 * pengaman 4 detik). Murni indikator visual - tidak memengaruhi navigasi.
 */
export function RouteProgress() {
  const pathname = usePathname();
  const [active, setActive] = useState(false);
  const [done, setDone] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const doneTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Selesai: pathname berubah.
  useEffect(() => {
    if (!active) return;
    setDone(true);
    doneTimer.current = setTimeout(() => {
      setActive(false);
      setDone(false);
    }, 250);
  }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  // Pengaman: navigasi dibatalkan / lambat -> paksa hilang.
  useEffect(() => {
    if (!active || done) return;
    timer.current = setTimeout(() => {
      setActive(false);
      setDone(false);
    }, 4000);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [active, done]);

  // Tangkap klik link internal -> mulai progres.
  useEffect(() => {
    function onClick(e: MouseEvent) {
      const anchor = (e.target as HTMLElement).closest("a");
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      const target = anchor.getAttribute("target");
      if (!href || target === "_blank" || href.startsWith("http") || href.startsWith("#") || href.startsWith("mailto:")) return;
      if (href === pathname) return;
      setActive(true);
      setDone(false);
    }
    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true } as EventListenerOptions);
  }, [pathname]);

  if (!active) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-0.5 overflow-hidden"
    >
      <div
        className={cnBar(done)}
      />
    </div>
  );
}

function cnBar(done: boolean) {
  return done
    ? "h-full w-full bg-brand transition-all duration-200"
    : "h-full w-1/3 animate-[routebar_1s_ease-in-out_infinite] bg-brand";
}
