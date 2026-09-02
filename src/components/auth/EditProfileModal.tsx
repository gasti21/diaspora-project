"use client";

import { useRef, useState } from "react";
import { CircleUserRound, LoaderCircle, Mail, Pencil, X } from "lucide-react";
import { useToast } from "@/components/toast/ToastProvider";
import { FAVORITES_EVENT } from "@/lib/constants";

export interface ProfileData {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  bio: string | null;
  role: "admin" | "user";
}

interface Props {
  profile: ProfileData;
  onClose: () => void;
  onSaved: () => void;
}

const BIO_MAX = 280;

/**
 * Modal Edit Profil: avatar (upload), nama, dan bio bisa diubah.
 * Email ditampilkan read-only - identitas terikat sesi Google.
 */
export function EditProfileModal({ profile, onClose, onSaved }: Props) {
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(profile.name);
  const [bio, setBio] = useState(profile.bio ?? "");
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Escape untuk menutup.
  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape" && !saving) onClose();
  }

  async function uploadAvatar(file: File) {
    setUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/profile", { method: "POST", body });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Gagal mengunggah avatar.");
        return;
      }
      setAvatarUrl(json.url);
      toast.success("Avatar diperbarui - tekan Simpan untuk menerapkan.");
    } catch {
      toast.error("Gagal mengunggah avatar. Coba lagi.");
    }
    setUploading(false);
  }

  async function save() {
    if (!name.trim()) {
      toast.error("Nama tidak boleh kosong.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, bio, avatarUrl }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Gagal menyimpan profil.");
        return;
      }
      toast.success("Profil berhasil diperbarui.");
      window.dispatchEvent(new Event(FAVORITES_EVENT)); // sinkron komponen lain
      onSaved();
    } catch {
      toast.error("Gagal menyimpan profil. Coba lagi.");
    }
    setSaving(false);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-navy-deep/50 p-4 backdrop-blur-sm"
      onMouseDown={(e) => e.target === e.currentTarget && !saving && onClose()}
      onKeyDown={onKeyDown}
    >
      <div
        role="dialog"
        aria-label="Edit profil"
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="text-base font-extrabold text-navy">Edit Profil</h2>
          <button
            onClick={onClose}
            disabled={saving}
            aria-label="Tutup"
            className="rounded-lg p-1.5 text-muted transition hover:bg-surface hover:text-navy disabled:opacity-50"
          >
            <X className="h-4.5 w-4.5" aria-hidden="true" />
          </button>
        </div>

        <div className="space-y-5 px-5 py-5">
          {/* Avatar */}
          <div className="flex flex-col items-center gap-3">
            <span className="relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border border-line bg-surface text-navy">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                <CircleUserRound className="h-10 w-10" aria-hidden="true" />
              )}
              {uploading && (
                <span className="absolute inset-0 flex items-center justify-center bg-white/70">
                  <LoaderCircle className="h-6 w-6 animate-spin text-navy" aria-hidden="true" />
                </span>
              )}
            </span>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) uploadAvatar(file);
                e.target.value = "";
              }}
            />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-navy transition hover:bg-surface disabled:opacity-60"
            >
              <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
              Ganti Foto
            </button>
            <p className="text-[11px] text-muted">JPG/PNG, maksimal 2MB.</p>
          </div>

          {/* Nama */}
          <div>
            <label htmlFor="ep-name" className="text-xs font-bold uppercase tracking-wide text-muted">
              Nama Lengkap <span className="text-brand">*</span>
            </label>
            <input
              id="ep-name"
              value={name}
              maxLength={80}
              onChange={(e) => setName(e.target.value)}
              className="mt-1.5 h-10 w-full rounded-lg border border-line px-3 text-sm outline-none transition focus:border-navy"
            />
            <p className="mt-1 text-right text-[11px] text-muted">{name.length}/80</p>
          </div>

          {/* Email - read only */}
          <div>
            <label htmlFor="ep-email" className="text-xs font-bold uppercase tracking-wide text-muted">
              Email
            </label>
            <div className="relative mt-1.5">
              <Mail
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
                aria-hidden="true"
              />
              <input
                id="ep-email"
                value={profile.email}
                readOnly
                disabled
                title="Email terikat akun Google dan tidak dapat diubah."
                className="h-10 w-full cursor-not-allowed rounded-lg border border-line bg-surface pl-9 pr-3 text-sm text-muted"
              />
            </div>
            <p className="mt-1 text-[11px] text-muted">
              Email terikat akun Google Anda dan tidak dapat diubah.
            </p>
          </div>

          {/* Bio */}
          <div>
            <label htmlFor="ep-bio" className="text-xs font-bold uppercase tracking-wide text-muted">
              Bio Singkat
            </label>
            <textarea
              id="ep-bio"
              value={bio}
              rows={3}
              maxLength={BIO_MAX}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Ceritakan singkat tentang Anda / usaha Anda…"
              className="mt-1.5 w-full resize-none rounded-lg border border-line px-3 py-2.5 text-sm outline-none transition focus:border-navy"
            />
            <p className={bio.length > BIO_MAX * 0.9 ? "mt-1 text-right text-[11px] font-bold text-amber-600" : "mt-1 text-right text-[11px] text-muted"}>
              {bio.length}/{BIO_MAX}
            </p>
          </div>

          {/* Aksi */}
          <div className="flex justify-end gap-2 border-t border-line pt-4">
            <button
              onClick={onClose}
              disabled={saving}
              className="rounded-lg border border-line px-4 py-2.5 text-sm font-semibold text-navy transition hover:bg-surface disabled:opacity-60"
            >
              Batal
            </button>
            <button
              onClick={save}
              disabled={saving || uploading}
              className="inline-flex items-center gap-2 rounded-lg bg-navy px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-navy-dark disabled:opacity-60"
            >
              {saving && <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />}
              Simpan Perubahan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
