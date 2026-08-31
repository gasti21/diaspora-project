"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Bell, CheckCircle2, TriangleAlert, X } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import type { ProductStatus } from "@/lib/types";

/** Item notifikasi ringkas - dipetakan dari daftar pengajuan member. */
export interface NotifItem {
  id: string;
  slug: string;
  name: string;
  status: ProductStatus;
  reviewNote?: string | null;
  updatedAt: string;
}

interface Props {
  items: NotifItem[];
  /** Kunci penyimpanan last-seen per user (dipakai email user). */
  userKey: string;
}

const STATUS_META: Record<
  Exclude<ProductStatus, "pending">,
  { label: string; cls: string; icon: typeof CheckCircle2 }
> = {
  published: {
    label: "Disetujui & tayang di katalog",
    cls: "bg-green-50 text-green-600",
    icon: CheckCircle2,
  },
  revision: {
    label: "Perlu revisi",
    cls: "bg-amber-50 text-amber-600",
    icon: TriangleAlert,
  },
  rejected: {
    label: "Ditolak",
    cls: "bg-red-50 text-red-600",
    icon: TriangleAlert,
  },
};

const SEEN_KEY = (k: string) => `kd:notif-seen:${k}`;

/**
 * Lonceng notifikasi status pengajuan. "Belum dibaca" ditentukan dari
 * timestamp terakhir user membuka panel (disimpan di localStorage),
 * jadi tidak perlu tabel tambahan di database.
 */
export function NotificationBell({ items, userKey }: Props) {
  const [open, setOpen] = useState(false);
  const [seenAt, setSeenAt] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  // Muat timestamp terakhir dibaca (dilakukan di klien setelah hydrate).
  useEffect(() => {
    setSeenAt(localStorage.getItem(SEEN_KEY(userKey)));
  }, [userKey]);

  // Tutup panel saat klik di luar / tekan Escape.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Hanya perubahan status yang jadi notifikasi - pending bukan kabar baru.
  const notifItems = useMemo(
    () =>
      items
        .filter((i) => i.status !== "pending")
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [items]
  );

  const unread = useMemo(
    () => (seenAt === null ? 0 : notifItems.filter((i) => i.updatedAt > seenAt).length),
    [notifItems, seenAt]
  );

  function toggle() {
    const next = !open;
    setOpen(next);
    if (next) {
      // Tandai semua sebagai dibaca: simpan waktu terbaru saat ini.
      const latest = notifItems[0]?.updatedAt ?? new Date().toISOString();
      localStorage.setItem(SEEN_KEY(userKey), latest);
      setSeenAt(latest);
    }
  }


  return (
    <div ref={rootRef} className="relative">
      <button
        onClick={toggle}
        aria-label={unread > 0 ? `${unread} notifikasi belum dibaca` : "Notifikasi"}
        className={cn(
          "relative flex h-9 w-9 items-center justify-center rounded-lg border transition",
          unread > 0 || open
            ? "border-navy/30 bg-navy/5 text-navy"
            : "border-line bg-white text-muted hover:bg-surface hover:text-navy"
        )}
      >
        <Bell className="h-4.5 w-4.5" aria-hidden="true" />
        {unread > 0 && (
          <span
            className="absolute -right-1.5 -top-1.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-bold text-white"
            aria-hidden="true"
          >
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 top-11 z-50 w-80 overflow-hidden rounded-2xl border border-line bg-white shadow-xl sm:w-96"
          role="dialog"
          aria-label="Notifikasi status pengajuan"
        >
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <p className="text-sm font-bold text-navy">Notifikasi</p>
            <button
              onClick={() => setOpen(false)}
              aria-label="Tutup notifikasi"
              className="rounded-lg p-1 text-muted transition hover:bg-surface hover:text-navy"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          {notifItems.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <Bell className="mx-auto h-8 w-8 text-muted/40" aria-hidden="true" />
              <p className="mt-3 text-sm font-semibold text-navy">Belum ada notifikasi</p>
              <p className="mx-auto mt-1 max-w-64 text-xs leading-relaxed text-muted">
                Kabar hasil review pengajuan Anda akan muncul di sini.
              </p>
            </div>
          ) : (
            <ul className="max-h-80 divide-y divide-line overflow-y-auto">
              {notifItems.map((i) => {
                const meta = STATUS_META[i.status as Exclude<ProductStatus, "pending">];
                const Icon = meta.icon;
                const isNew = seenAt !== null && i.updatedAt > seenAt;
                return (
                  <li key={`${i.id}-${i.updatedAt}`}>
                    <Link
                      href={i.status === "published" ? `/produk/${i.slug}` : `/pengajuan?status=${i.status}`}
                      onClick={() => setOpen(false)}
                      className="flex gap-3 px-4 py-3 transition hover:bg-surface"
                    >
                      <span
                        className={cn(
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                          meta.cls
                        )}
                      >
                        <Icon className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span className="truncate text-sm font-bold text-navy">{i.name}</span>
                          {isNew && (
                            <span className="shrink-0 rounded-full bg-brand/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand">
                              Baru
                            </span>
                          )}
                        </span>
                        <span className="mt-0.5 block text-xs font-medium text-muted">
                          {meta.label}
                        </span>
                        {i.reviewNote && (
                          <span className="mt-1 line-clamp-2 block text-xs leading-relaxed text-muted/80">
                            “{i.reviewNote}”
                          </span>
                        )}
                        <span className="mt-1 block text-[11px] text-muted/60">
                          {formatDate(i.updatedAt)}
                        </span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}

          <Link
            href="/pengajuan"
            onClick={() => setOpen(false)}
            className="block border-t border-line bg-surface px-4 py-2.5 text-center text-xs font-bold text-navy transition hover:bg-line/40"
          >
            Lihat semua pengajuan
          </Link>
        </div>
      )}
    </div>
  );
}
