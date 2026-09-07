"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Activity,
  CircleUserRound,
  LayoutDashboard,
  LoaderCircle,
  LogOut,
  MessagesSquare,
  Package,
  Pencil,
  Settings,
  Tags,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { EditProfileModal, type ProfileData } from "./EditProfileModal";
import { cn } from "@/lib/utils";

/** Item navigasi admin di dalam dropdown profil (pengganti sidebar). */
const ADMIN_NAV: { href: string; label: string; icon: LucideIcon; stat?: "pending" | "users" | "support" }[] = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/produk", label: "Manajemen Produk", icon: Package, stat: "pending" },
  { href: "/admin/kategori", label: "Kategori", icon: Tags },
  { href: "/admin/aktivitas", label: "Aktivitas Kurasi", icon: Activity },
  { href: "/admin/pengguna", label: "Pengguna & Admin", icon: Users, stat: "users" },
  { href: "/admin/support", label: "Chat Support", icon: MessagesSquare, stat: "support" },
];

interface Props {
  /** Mode menentukan link cepat di menu: member vs admin. */
  mode: "member" | "admin";
  /** Fallback tampilan awal sebelum profil termuat. */
  fallback?: { name: string; email: string; avatarUrl?: string };
}

/**
 * Menu avatar di topbar: klik untuk membuka panel profil (foto, nama,
 * email, badge role, bio) + aksi Edit Profil & Keluar. Dipakai bersama
 * oleh Area Member dan Panel Admin.
 */
export function ProfileMenu({ mode, fallback }: Props) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [signingOut, setSigningOut] = useState(false);
  // Statistik badge navigasi admin (pending/users/support) - hanya mode admin.
  const [stats, setStats] = useState<{ pending: number; users: number; support: number } | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/profile")
      .then(async (res) => (res.ok ? setProfile(await res.json()) : null))
      .catch(() => {});
  }, [open]);

  useEffect(() => {
    if (!open || mode !== "admin") return;
    fetch("/api/admin/stats")
      .then(async (res) => (res.ok ? setStats(await res.json()) : null))
      .catch(() => {});
  }, [open, mode]);

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

  const name = profile?.name ?? fallback?.name ?? "…";
  const email = profile?.email ?? fallback?.email ?? "";
  const avatarUrl = profile?.avatarUrl ?? fallback?.avatarUrl;

  async function signOut() {
    setSigningOut(true);
    await fetch("/auth/signout", { method: "POST" });
    window.location.href = "/";
  }

  return (
    <div ref={rootRef} className="relative">
      {/* Trigger: avatar bulat */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Buka menu profil"
        aria-expanded={open}
        className={cn(
          "inline-flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border transition",
          open
            ? "border-navy/40 ring-2 ring-navy/15"
            : "border-line hover:border-navy/40"
        )}
      >
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl} alt={name} className="h-full w-full object-cover" />
        ) : (
          <span className="flex h-full w-full items-center justify-center bg-navy text-sm font-bold text-white">
            {name.charAt(0).toUpperCase()}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute right-0 top-11 z-50 w-72 overflow-hidden rounded-2xl border border-line bg-white shadow-xl"
          role="menu"
          aria-label="Menu profil"
        >
          {/* Header profil */}
          <div className="flex flex-col items-center border-b border-line px-4 pb-4 pt-5 text-center">
            <span className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border border-line bg-surface text-navy">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt={name} className="h-full w-full object-cover" />
              ) : (
                <CircleUserRound className="h-8 w-8" aria-hidden="true" />
              )}
            </span>
            <p className="mt-2.5 max-full truncate text-sm font-extrabold text-navy">{name}</p>
            <p className="mt-0.5 w-full truncate text-xs text-muted">{email}</p>
            {profile?.role === "admin" && (
              <span className="mt-2 rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-blue-700">
                Admin
              </span>
            )}
            {profile?.bio && (
              <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-muted/90">
                “{profile.bio}”
              </p>
            )}
          </div>

          {/* Aksi */}
          <div className="p-2">
            {mode === "admin" ? (
              /* Admin memakai editor profil lengkap yang sama dengan member. */
              <Link
                href="/profil"
                onClick={() => setOpen(false)}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-semibold text-navy transition hover:bg-surface"
              >
                <Pencil className="h-4 w-4 text-muted" aria-hidden="true" />
                Edit Profil
              </Link>
            ) : (
              <button
                onClick={() => {
                  setOpen(false);
                  setEditing(true);
                }}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-semibold text-navy transition hover:bg-surface"
              >
                <Pencil className="h-4 w-4 text-muted" aria-hidden="true" />
                Edit Profil
              </button>
            )}

            {mode === "member" ? (
              <>
                <Link
                  href="/profil"
                  onClick={() => setOpen(false)}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-navy transition hover:bg-surface"
                >
                  <CircleUserRound className="h-4 w-4 text-muted" aria-hidden="true" />
                  Profil Saya
                </Link>
                <Link
                  href="/pengajuan"
                  onClick={() => setOpen(false)}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-navy transition hover:bg-surface"
                >
                  <Settings className="h-4 w-4 text-muted" aria-hidden="true" />
                  Pengajuan Saya
                </Link>
              </>
            ) : (
              <>
                {/* Navigasi panel admin lengkap di dalam menu profil */}
                <p className="px-3 pb-1 pt-2 text-[10px] font-bold uppercase tracking-widest text-muted/70">
                  Panel Admin
                </p>
                {ADMIN_NAV.map((item) => {
                  const badge = item.stat && stats ? stats[item.stat] : null;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-navy transition hover:bg-surface"
                    >
                      <item.icon className="h-4 w-4 text-muted" aria-hidden="true" />
                      <span className="flex-1">{item.label}</span>
                      {badge !== null && badge > 0 && (
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[10px] font-bold",
                            item.stat === "pending"
                              ? "bg-brand-soft text-brand"
                              : "bg-navy/10 text-navy"
                          )}
                        >
                          {badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </>
            )}

            <button
              onClick={signOut}
              disabled={signingOut}
              className="mt-1 flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-semibold text-brand transition hover:bg-brand-soft disabled:opacity-60"
            >
              {signingOut ? (
                <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <LogOut className="h-4 w-4" aria-hidden="true" />
              )}
              Keluar dari Akun
            </button>
          </div>
        </div>
      )}

      {/* Modal edit profil */}
      {editing && profile && (
        <EditProfileModal
          profile={profile}
          onClose={() => setEditing(false)}
          onSaved={() => {
            setEditing(false);
            // Segarkan seluruh tampilan agar nama/avatar baru konsisten di mana pun.
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}

