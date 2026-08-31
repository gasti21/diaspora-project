"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/components/toast/ToastProvider";
import { cn } from "@/lib/utils";

export interface AdminCategory {
  id: string;
  slug: string;
  name: string;
  productCount: number;
}

interface Props {
  categories: AdminCategory[];
}

/** Kelola kategori produk: tambah, ubah nama, hapus (guard bila masih dipakai). */
export function CategoriesView({ categories }: Props) {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [confirmId, setConfirmId] = useState<string | null>(null);

  async function call(url: string, method: string, body?: unknown) {
    setBusy(true);
    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(json.error ?? "Aksi gagal.");
        return false;
      }
      router.refresh();
      return true;
    } catch {
      toast.error("Aksi gagal. Coba lagi.");
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function add() {
    if (!newName.trim()) return;
    if (await call("/api/admin/categories", "POST", { name: newName })) {
      toast.success(`Kategori "${newName.trim()}" ditambahkan.`);
      setNewName("");
      setAdding(false);
    }
  }

  async function saveEdit(id: string) {
    if (!editName.trim()) return;
    if (await call(`/api/admin/categories/${id}`, "PATCH", { name: editName })) {
      toast.success("Kategori diperbarui.");
      setEditId(null);
    }
  }

  async function remove(id: string) {
    if (await call(`/api/admin/categories/${id}`, "DELETE")) {
      toast.success("Kategori dihapus.");
      setConfirmId(null);
    }
  }

  return (
    <div className="space-y-4">
      {/* Ringkasan + tombol tambah */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="rounded-2xl border border-line bg-white px-4 py-3 sm:max-w-xs">
          <p className="text-2xl font-extrabold text-navy">{categories.length}</p>
          <p className="mt-0.5 text-xs font-medium text-muted">Kategori terdaftar</p>
        </div>
        {adding ? (
          <div className="flex gap-2">
            <input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && add()}
              placeholder="Nama kategori baru…"
              className="h-10 w-full rounded-lg border border-line bg-white px-3 text-sm outline-none transition focus:border-navy sm:w-64"
            />
            <button
              disabled={busy}
              onClick={add}
              className="h-10 shrink-0 rounded-lg bg-navy px-4 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
            >
              Simpan
            </button>
            <button
              onClick={() => {
                setAdding(false);
                setNewName("");
              }}
              className="h-10 shrink-0 rounded-lg border border-line px-4 text-sm font-semibold text-navy transition hover:bg-surface"
            >
              Batal
            </button>
          </div>
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="inline-flex h-10 items-center gap-2 self-start rounded-lg bg-navy px-4 text-sm font-semibold text-white transition hover:opacity-90"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Tambah Kategori
          </button>
        )}
      </div>

      {/* Tabel */}
      <div className="overflow-hidden rounded-2xl border border-line bg-white">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-line bg-surface text-xs uppercase tracking-wide text-muted">
              <th className="px-4 py-3 font-semibold">Nama</th>
              <th className="px-4 py-3 font-semibold">Slug</th>
              <th className="px-4 py-3 text-center font-semibold">Produk</th>
              <th className="px-4 py-3 text-right font-semibold">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((c) => (
              <tr key={c.id} className="border-b border-line/60 last:border-0">
                <td className="px-4 py-3 font-semibold text-navy">
                  {editId === c.id ? (
                    <input
                      autoFocus
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && saveEdit(c.id)}
                      className="h-9 w-full rounded-lg border border-line px-2 text-sm outline-none focus:border-navy"
                    />
                  ) : (
                    c.name
                  )}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-muted">
                  {c.slug}
                </td>
                <td className="px-4 py-3 text-center">
                  <span
                    className={cn(
                      "inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold",
                      c.productCount > 0 ? "bg-navy/10 text-navy" : "bg-surface text-muted"
                    )}
                  >
                    {c.productCount}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1.5">
                    {editId === c.id ? (
                      <>
                        <button
                          disabled={busy}
                          onClick={() => saveEdit(c.id)}
                          className="h-8 rounded-lg bg-navy px-3 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
                        >
                          Simpan
                        </button>
                        <button
                          onClick={() => setEditId(null)}
                          className="h-8 rounded-lg border border-line px-3 text-xs font-semibold text-navy transition hover:bg-surface"
                        >
                          Batal
                        </button>
                      </>
                    ) : confirmId === c.id ? (
                      <>
                        <span className="mr-1 text-xs font-medium text-muted">Yakin hapus?</span>
                        <button
                          disabled={busy}
                          onClick={() => remove(c.id)}
                          className="h-8 rounded-lg bg-red-600 px-3 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
                        >
                          Hapus
                        </button>
                        <button
                          onClick={() => setConfirmId(null)}
                          className="h-8 rounded-lg border border-line px-3 text-xs font-semibold text-navy transition hover:bg-surface"
                        >
                          Batal
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          title="Ubah nama"
                          onClick={() => {
                            setEditId(c.id);
                            setEditName(c.name);
                          }}
                          className="rounded-lg p-2 text-muted transition hover:bg-surface hover:text-navy"
                        >
                          <Pencil className="h-4 w-4" aria-hidden="true" />
                        </button>
                        <button
                          title={
                            c.productCount > 0
                              ? "Tidak bisa dihapus: masih dipakai produk"
                              : "Hapus kategori"
                          }
                          disabled={c.productCount > 0 || busy}
                          onClick={() => setConfirmId(c.id)}
                          className="rounded-lg p-2 text-muted transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"
                        >
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {categories.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-sm text-muted">
                  Belum ada kategori. Tambahkan kategori pertama.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-muted">
        Catatan: slug dibuat otomatis dari nama. Kategori yang masih dipakai produk tidak
        dapat dihapus — pindahkan produknya dulu.
      </p>
    </div>
  );
}
