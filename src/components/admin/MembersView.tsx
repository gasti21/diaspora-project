"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CircleUserRound, LoaderCircle, Search, ShieldCheck, UserRound } from "lucide-react";
import { STATS_EVENT } from "./admin-nav";
import { useToast } from "@/components/toast/ToastProvider";
import { cn, formatDate } from "@/lib/utils";
import type { AdminUser } from "@/lib/types";

const ROLE_FILTERS = [
  { key: "all", label: "Semua" },
  { key: "admin", label: "Admin" },
  { key: "user", label: "Member" },
] as const;

type RoleFilter = (typeof ROLE_FILTERS)[number]["key"];

interface Props {
  users: AdminUser[];
}

/** Daftar semua pengguna + kelola role admin (menggantikan "Kelola Admin" lama). */
export function MembersView({ users }: Props) {
  const router = useRouter();
  const toast = useToast();
  const [q, setQ] = useState("");
  const [role, setRole] = useState<RoleFilter>("all");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return users.filter((u) => {
      if (role !== "all" && u.role !== role) return false;
      if (!needle) return true;
      return (
        u.name.toLowerCase().includes(needle) || u.email.toLowerCase().includes(needle)
      );
    });
  }, [users, q, role]);

  const admins = users.filter((u) => u.role === "admin").length;
  const members = users.length - admins;

  /** POST (angkat admin) / DELETE (turunkan admin) via /api/admin/manage. */
  async function manage(target: AdminUser, action: "promote" | "demote") {
    setBusyId(target.id);
    try {
      const res = await fetch("/api/admin/manage", {
        method: action === "promote" ? "POST" : "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: target.email }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Aksi gagal.");
        return;
      }
      toast.success(
        action === "promote"
          ? `${target.email} sekarang menjadi admin.`
          : `${target.email} sudah tidak menjadi admin lagi.`
      );
      window.dispatchEvent(new Event(STATS_EVENT));
      router.refresh(); // server component mengambil data terbaru
    } catch {
      toast.error("Aksi gagal. Coba lagi.");
    }
    setBusyId(null);
    setConfirmId(null);
  }

  return (
    <div className="space-y-4">
      {/* Ringkasan */}
      <div className="grid grid-cols-2 gap-3 sm:max-w-md">
        <div className="rounded-2xl border border-line bg-white p-4">
          <p className="text-2xl font-extrabold text-navy">{admins}</p>
          <p className="mt-0.5 text-xs font-medium text-muted">Admin aktif</p>
        </div>
        <div className="rounded-2xl border border-line bg-white p-4">
          <p className="text-2xl font-extrabold text-navy">{members}</p>
          <p className="mt-0.5 text-xs font-medium text-muted">Member terdaftar</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {ROLE_FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setRole(f.key)}
              className={cn(
                "rounded-full px-3.5 py-1.5 text-xs font-semibold transition",
                role === f.key
                  ? "bg-navy text-white"
                  : "border border-line bg-white text-navy hover:bg-surface"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="relative sm:w-72">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
            aria-hidden="true"
          />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari nama atau email…"
            className="h-10 w-full rounded-lg border border-line bg-white pl-9 pr-3 text-sm outline-none transition focus:border-navy"
          />
        </div>
      </div>

      {/* Tabel */}
      <div className="overflow-hidden rounded-2xl border border-line bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-line bg-surface/60 text-xs uppercase tracking-wide text-muted">
                <th className="px-4 py-3 font-semibold">Pengguna</th>
                <th className="px-4 py-3 font-semibold">Role</th>
                <th className="px-4 py-3 font-semibold">Bergabung</th>
                <th className="px-4 py-3 font-semibold">Pengajuan</th>
                <th className="px-4 py-3 text-right font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-sm text-muted">
                    {users.length === 0
                      ? "Belum ada pengguna terdaftar - data muncul setelah orang pertama login."
                      : "Tidak ada pengguna pada filter ini."}
                  </td>
                </tr>
              )}
              {filtered.map((u) => {
                const busy = busyId === u.id;
                return (
                  <tr key={u.id} className="border-b border-line/70 transition last:border-0 hover:bg-surface/60">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        {u.avatarUrl ? (
                          <img
                            src={u.avatarUrl}
                            alt={u.name}
                            className="h-10 w-10 shrink-0 rounded-full object-cover"
                          />
                        ) : (
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface text-muted">
                            <CircleUserRound className="h-5 w-5" aria-hidden="true" />
                          </span>
                        )}
                        <div className="min-w-0">
                          <p className="flex items-center gap-2 font-semibold text-navy">
                            <span className="max-w-[200px] truncate">{u.name}</span>
                            {u.isOwner && (
                              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-bold text-blue-600">
                                <ShieldCheck className="h-3 w-3" aria-hidden="true" /> Pemilik
                              </span>
                            )}
                          </p>
                          <p className="max-w-[240px] truncate text-xs text-muted">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
                          u.role === "admin"
                            ? "bg-blue-50 text-blue-700"
                            : "bg-gray-100 text-gray-700"
                        )}
                      >
                        {u.role === "admin" ? (
                          <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                        ) : (
                          <UserRound className="h-3.5 w-3.5" aria-hidden="true" />
                        )}
                        {u.role === "admin" ? "Admin" : "Member"}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-muted">{formatDate(u.createdAt)}</td>
                    <td className="px-4 py-3.5 font-semibold text-navy">{u.submissions}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex justify-end">
                        {u.isOwner ? (
                          <span className="text-xs text-muted">Terlindungi</span>
                        ) : busy ? (
                          <LoaderCircle className="h-4 w-4 animate-spin text-muted" aria-hidden="true" />
                        ) : confirmId === u.id ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => manage(u, u.role === "admin" ? "demote" : "promote")}
                              className="rounded-lg bg-brand px-3 py-1.5 text-xs font-bold text-white transition hover:bg-brand-dark"
                            >
                              Yakin
                            </button>
                            <button
                              onClick={() => setConfirmId(null)}
                              className="rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-muted transition hover:bg-surface"
                            >
                              Batal
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmId(u.id)}
                            title={u.role === "admin" ? "Turunkan jadi member" : "Angkat jadi admin"}
                            className={cn(
                              "rounded-lg px-3 py-1.5 text-xs font-bold transition",
                              u.role === "admin"
                                ? "border border-line text-muted hover:bg-red-50 hover:text-brand"
                                : "bg-navy text-white hover:bg-navy-dark"
                            )}
                          >
                            {u.role === "admin" ? "Turunkan" : "Jadikan Admin"}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs leading-relaxed text-muted">
        Catatan: hanya orang yang sudah pernah login ke platform yang bisa diangkat
        menjadi admin. Admin terakhir tidak dapat diturunkan, dan pemilik platform
        bersifat permanen.
      </p>
    </div>
  );
}
