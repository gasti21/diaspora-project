"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { CheckCircle2, Info, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastKind = "success" | "error" | "info";

export interface ToastOptions {
  /** Judul tebal di atas pesan (opsional). */
  title?: string;
  /** Durasi tampil (ms) sebelum menghilang sendiri. */
  duration?: number;
}

interface ToastItem {
  id: number;
  kind: ToastKind;
  title?: string;
  message: string;
  duration: number;
  leaving?: boolean;
}

export interface ToastApi {
  success: (message: string, options?: ToastOptions) => void;
  error: (message: string, options?: ToastOptions) => void;
  info: (message: string, options?: ToastOptions) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

const KIND_META: Record<ToastKind, { icon: typeof CheckCircle2; chip: string; bar: string }> = {
  success: { icon: CheckCircle2, chip: "bg-green-50 text-green-600", bar: "bg-green-500" },
  error: { icon: XCircle, chip: "bg-red-50 text-red-600", bar: "bg-red-500" },
  info: { icon: Info, chip: "bg-blue-50 text-blue-600", bar: "bg-blue-500" },
};

const DEFAULT_DURATION: Record<ToastKind, number> = {
  success: 5000,
  error: 7000,
  info: 6000,
};

/**
 * Sistem notifikasi tunggal KaryaDiaspora: semua toast tampil mengapung
 * di KANAN-ATAS, menyusut otomatis (progress bar) lalu menghilang sendiri.
 * Sentuh toast untuk menutup lebih cepat. Tidak butuh library eksternal.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const seq = useRef(0);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  const remove = useCallback((id: number) => {
    // mainkan animasi keluar sebentar lalu lepas dari DOM
    setToasts((list) => list.map((t) => (t.id === id ? { ...t, leaving: true } : t)));
    const old = timers.current.get(id);
    if (old) clearTimeout(old);
    timers.current.set(
      id,
      setTimeout(() => {
        setToasts((list) => list.filter((t) => t.id !== id));
        timers.current.delete(id);
      }, 250)
    );
  }, []);

  const push = useCallback(
    (kind: ToastKind, message: string, options?: ToastOptions) => {
      const id = ++seq.current;
      const duration = options?.duration ?? DEFAULT_DURATION[kind];
      setToasts((list) => [
        ...list.slice(-3), // maksimal 4 toast tampil bersamaan
        { id, kind, message, title: options?.title, duration },
      ]);
      timers.current.set(id, setTimeout(() => remove(id), duration));
    },
    [remove]
  );

  const api = useMemo<ToastApi>(
    () => ({
      success: (message, options) => push("success", message, options),
      error: (message, options) => push("error", message, options),
      info: (message, options) => push("info", message, options),
    }),
    [push]
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      {/* viewport notifikasi: selalu kanan-atas */}
      <div
        aria-live="polite"
        className="pointer-events-none fixed right-4 top-4 z-[100] flex w-[calc(100%-2rem)] flex-col gap-2 sm:w-96"
      >
        {toasts.map((t) => {
          const meta = KIND_META[t.kind];
          return (
            <div
              key={t.id}
              role="status"
              title="Klik untuk menutup lebih cepat"
              onClick={() => remove(t.id)}
              className={cn(
                "animate-toast-in pointer-events-auto relative flex cursor-pointer items-start gap-3 overflow-hidden rounded-xl border border-line bg-white px-4 py-3.5 shadow-lg shadow-navy/15",
                t.leaving && "animate-toast-out"
              )}
            >
              <span
                className={cn(
                  "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                  meta.chip
                )}
              >
                <meta.icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                {t.title && <p className="text-sm font-bold text-navy">{t.title}</p>}
                <p
                  className={cn(
                    "text-sm leading-relaxed",
                    t.title ? "mt-0.5 text-muted" : "font-medium text-navy"
                  )}
                >
                  {t.message}
                </p>
              </div>
              {/* bar durasi: menyusut habis tepat saat toast menghilang sendiri */}
              <span
                aria-hidden="true"
                style={{ animationDuration: `${t.duration}ms` }}
                className={cn("animate-toast-progress absolute inset-x-0 bottom-0 h-1", meta.bar)}
              />
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

/** Akses toast dari komponen client apa pun (aman walau provider belum terpasang). */
export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  return ctx ?? { success: () => undefined, error: () => undefined, info: () => undefined };
}