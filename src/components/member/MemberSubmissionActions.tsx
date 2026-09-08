"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, LoaderCircle, PackagePlus, Trash2 } from "lucide-react";
import { useToast } from "@/components/toast/ToastProvider";
import type { ProductStatus } from "@/lib/types";

/**
 * Aksi manajemen pengajuan milik member: edit, lihat publik, tarik (hapus).
 * Menyimpan edit pada status apa pun mengembalikan pengajuan ke antrian
 * review - kecuali dinyatakan lain lewat props.
 */
export function MemberSubmissionActions({
  id,
  name,
  slug,
  status,
}: {
  id: string;
  name: string;
  slug: string;
  status: ProductStatus;
}) {
  const toast = useToast();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [gone, setGone] = useState(false);

  async function withdraw() {
    setBusy(true);
    try {
      const res = await fetch(`/api/my/products/${id}`, { method: "DELETE" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(json.error ?? "Gagal menarik pengajuan.");
        return;
      }
      toast.success(`Pengajuan "${name}" ditarik.`);
      setGone(true);
    } catch {
      toast.error("Koneksi bermasalah. Coba lagi.");
    } finally {
      setBusy(false);
    }
  }

  if (gone) {
    return (
      <p className="mt-3 rounded-lg bg-surface px-3 py-2 text-xs text-muted">
        Pengajuan sudah ditarik - refresh halaman untuk memperbarui daftar.
      </p>
    );
  }

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2.5">
      {status === "published" && (
        <Link
          href={`/produk/${slug}`}
          className="inline-flex items-center gap-1 text-xs font-semibold text-navy transition hover:text-brand"
        >
          Lihat halaman publik <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      )}

      <Link
        href={`/pengajuan/${id}/edit`}
        className="inline-flex items-center gap-1 rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-navy transition hover:bg-surface"
      >
        <PackagePlus className="h-3.5 w-3.5" aria-hidden="true" />
        {status === "revision" ? "Perbaiki & ajukan ulang" : "Edit pengajuan"}
      </Link>

      {confirming ? (
        <span className="flex items-center gap-2 text-xs">
          <span className="font-semibold text-brand">Hapus permanen?</span>
          <button
            disabled={busy}
            onClick={() => void withdraw()}
            className="rounded-lg bg-brand px-3 py-1.5 text-xs font-bold text-white transition hover:bg-brand-dark disabled:opacity-60"
          >
            {busy ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : "Ya, Tarik"}
          </button>
          <button
            onClick={() => setConfirming(false)}
            className="rounded-lg border border-line px-3 py-1.5 font-semibold text-muted transition hover:bg-surface"
          >
            Batal
          </button>
        </span>
      ) : (
        <button
          onClick={() => setConfirming(true)}
          title="Tarik pengajuan (hapus permanen)"
          className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50"
        >
          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" /> Tarik
        </button>
      )}
    </div>
  );
}
