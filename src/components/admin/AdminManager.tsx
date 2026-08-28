"use client";

/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useState } from "react";
import { CircleUserRound, Loader2, ShieldCheck, Trash2, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AdminProfile {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string | null;
  createdAt: string;
  protected: boolean;
}

/** Section "Kelola Admin" di dashboard: daftar admin + tambah/hapus. */
export function AdminManager() {
  const [admins, setAdmins] = useState<AdminProfile[] | null>(null);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [confirmEmail, setConfirmEmail] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/admin/manage");
      const json = await res.json();
      if (res.ok) setAdmins(json.admins);
      else setError(json.error ?? "Gagal memuat daftar admin.");
    } catch {
      setError("Gagal memuat daftar admin.");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function addAdmin(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch("/api/admin/manage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const json = await res.json();
      if (res.ok) {
        setNotice(`${email.trim()} sekarang menjadi admin.`);
        setEmail("");
        await load();
      } else {
        setError(json.error ?? "Gagal menambahkan admin.");
      }
    } catch {
      setError("Gagal menambahkan admin.");
    }
    setBusy(false);
  }

  async function removeAdmin(target: AdminProfile) {
    setBusy(true);
    setError(null);
    setNotice(null);
    setConfirmEmail(null);
    try {
      const res = await fetch("/api/admin/manage", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: target.email }),
      });
      const json = await res.json();
      if (res.ok) {
        setNotice(`${target.email} sudah tidak menjadi admin lagi.`);
        await load();
      } else {
        setError(json.error ?? "Gagal menghapus admin.");
      }
    } catch {
      setError("Gagal menghapus admin.");
    }
    setBusy(false);
  }

  return (
    <div className="mt-6 max-w-2xl">
      {/* Form tambah admin */}
      <form onSubmit={addAdmin} className="rounded-2xl border border-line bg-white p-5">
        <h2 className="flex items-center gap-2 font-extrabold">
          <UserPlus className="h-4.5 w-4.5 text-navy" aria-hidden="true" /> Tambah Admin
        </h2>
        <p className="mt-1.5 text-justify text-sm leading-relaxed text-muted">
          Masukkan email yang sudah pernah login ke platform. User yang belum pernah
          login tidak dapat ditambahkan - minta dia login dulu dengan Google.
        </p>
        <div className="mt-3 flex gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nama@email.com"
            className="h-10 flex-1 rounded-lg border border-line px-3.5 text-sm outline-none focus:border-navy"
          />
          <button
            type="submit"
            disabled={busy || !email.trim()}
            className="flex h-10 items-center gap-2 rounded-lg bg-navy px-5 text-sm font-semibold text-white transition hover:bg-navy-dark disabled:opacity-50"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            Tambah
          </button>
        </div>
      </form>

      {notice && (
        <p className="mt-4 rounded-lg bg-green-50 p-3 text-sm font-medium text-green-700">
          {notice}
        </p>
      )}
      {error && (
        <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm font-medium text-brand">
          {error}
        </p>
      )}

      {/* Daftar admin */}
      <div className="mt-4 overflow-hidden rounded-2xl border border-line bg-white">
        <div className="border-b border-line p-4">
          <h2 className="font-extrabold">Daftar Admin</h2>
          <p className="mt-1 text-sm text-muted">
            {admins ? `${admins.length} admin aktif` : "Memuat…"}
          </p>
        </div>
        <ul className="divide-y divide-line">
          {admins?.map((a) => (
            <li key={a.id} className="flex items-center gap-3 p-4">
              {a.avatarUrl ? (
                <img
                  src={a.avatarUrl}
                  alt={a.name}
                  className="h-10 w-10 shrink-0 rounded-full object-cover"
                />
              ) : (
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface text-muted">
                  <CircleUserRound className="h-5 w-5" aria-hidden="true" />
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2 font-semibold">
                  <span className="truncate">{a.name}</span>
                  {a.protected && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-bold text-blue-600">
                      <ShieldCheck className="h-3 w-3" aria-hidden="true" /> Pemilik
                    </span>
                  )}
                </p>
                <p className="truncate text-sm text-muted">{a.email}</p>
              </div>
              {a.protected ? (
                <span className="shrink-0 text-xs text-muted">Tidak dapat dihapus</span>
              ) : confirmEmail === a.email ? (
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    disabled={busy}
                    onClick={() => removeAdmin(a)}
                    className="rounded-lg bg-brand px-3 py-1.5 text-xs font-bold text-white transition hover:bg-brand-dark disabled:opacity-60"
                  >
                    Yakin, hapus
                  </button>
                  <button
                    onClick={() => setConfirmEmail(null)}
                    className="rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-muted transition hover:bg-surface"
                  >
                    Batal
                  </button>
                </div>
              ) : (
                <button
                  disabled={busy}
                  onClick={() => setConfirmEmail(a.email)}
                  title="Turunkan jadi user biasa"
                  aria-label={`Hapus admin ${a.email}`}
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600",
                    "transition hover:bg-red-100 disabled:opacity-60"
                  )}
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </button>
              )}
            </li>
          ))}
          {admins?.length === 0 && (
            <li className="p-8 text-center text-sm text-muted">
              Belum ada admin terdaftar. Set admin pertama langsung di Supabase.
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}