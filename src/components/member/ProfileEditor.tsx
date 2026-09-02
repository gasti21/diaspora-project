"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Camera,
  Check,
  LoaderCircle,
  Lock,
} from "lucide-react";
import {
  FacebookIcon,
  InstagramIcon,
  LinkedInIcon,
  WhatsAppIcon,
  XIcon,
} from "@/components/member/SocialIcons";
import { useToast } from "@/components/toast/ToastProvider";
import type { MyProfile, ProfileSocials } from "@/lib/data";

const SOCIAL_FIELDS: {
  key: keyof ProfileSocials;
  label: string;
  placeholder: string;
  icon: typeof InstagramIcon;
}[] = [
  { key: "instagram", label: "Instagram", placeholder: "username atau instagram.com/username", icon: InstagramIcon },
  { key: "whatsapp", label: "WhatsApp", placeholder: "08123456789 atau wa.me/62812…", icon: WhatsAppIcon },
  { key: "linkedin", label: "LinkedIn", placeholder: "username atau linkedin.com/in/username", icon: LinkedInIcon },
  { key: "twitter", label: "X / Twitter", placeholder: "username atau x.com/username", icon: XIcon },
  { key: "facebook", label: "Facebook", placeholder: "username atau facebook.com/username", icon: FacebookIcon },
];

/** URL tersimpan -> teks input ("https://instagram.com/foo" -> "instagram.com/foo"). */
function socialToInput(value: string | null): string {
  if (!value) return "";
  try {
    const url = new URL(value);
    return `${url.hostname.replace(/^www\./, "")}${url.pathname.replace(/\/+$/, "")}`;
  } catch {
    return value;
  }
}

/**
 * Form edit profil: foto, nama, bio, dan link sosmed.
 * Email sengaja read-only - identitas dikelola Google Auth.
 */
export function ProfileEditor({ profile }: { profile: MyProfile }) {
  const router = useRouter();
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(profile.name);
  const [bio, setBio] = useState(profile.bio ?? "");
  const [socials, setSocials] = useState<Record<keyof ProfileSocials, string>>(() => {
    const out = {} as Record<keyof ProfileSocials, string>;
    for (const f of SOCIAL_FIELDS) out[f.key] = socialToInput(profile.socials[f.key]);
    return out;
  });
  const [notifyEmail, setNotifyEmail] = useState(profile.notifyEmail);
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function touch() {
    setDirty(true);
    setError(null);
  }

  async function onAvatarChange(file: File) {
    setAvatarBusy(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const upRes = await fetch("/api/profile", { method: "POST", body: form });
      const upData = await upRes.json();
      if (!upRes.ok) throw new Error(upData.error ?? "Gagal mengunggah foto.");

      const patchRes = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarUrl: upData.url }),
      });
      const patchData = await patchRes.json();
      if (!patchRes.ok) throw new Error(patchData.error ?? "Gagal menyimpan foto.");

      setAvatarUrl(upData.url);
      toast.success("Foto profil diperbarui.");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal mengunggah foto.");
    } finally {
      setAvatarBusy(false);
    }
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, bio, socials, notifyEmail }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Gagal menyimpan profil.");
      setDirty(false);
      toast.success("Profil tersimpan.");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal menyimpan profil.");
    } finally {
      setSaving(false);
    }
  }

  const inputCls =
    "w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm text-navy placeholder:text-muted/50 transition focus:border-navy/40 focus:outline-none";

  return (
    <section className="overflow-hidden rounded-2xl border border-line bg-white">
      <header className="border-b border-line px-6 py-5 sm:px-8">
        <h2 className="text-sm font-bold uppercase tracking-wider text-navy">Pengaturan Profil</h2>
        <p className="mt-1 text-sm text-muted">Informasi ini tampil bersama produk yang Anda ajukan.</p>
      </header>

      <div className="space-y-7 px-6 py-6 sm:px-8">
        {/* Foto */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={avatarBusy}
            className="group relative h-20 w-20 shrink-0 overflow-hidden rounded-full border border-line"
            aria-label="Ubah foto profil"
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt={profile.name} className="h-full w-full object-cover" />
            ) : (
              <span className="flex h-full w-full items-center justify-center bg-surface text-xl font-bold text-muted">
                {profile.name.charAt(0).toUpperCase()}
              </span>
            )}
            <span className="absolute inset-0 flex flex-col items-center justify-center gap-0.5 bg-navy/60 text-white opacity-0 transition group-hover:opacity-100">
              {avatarBusy ? (
                <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Camera className="h-4 w-4" aria-hidden="true" />
              )}
              <span className="text-[10px] font-semibold">Ubah</span>
            </span>
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onAvatarChange(f);
              e.target.value = "";
            }}
          />
          <p className="text-xs leading-relaxed text-muted">
            JPG atau PNG, maksimal 2MB. Foto dikrop otomatis menjadi bentuk lingkaran.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-navy">Nama Lengkap</span>
            <input
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                touch();
              }}
              maxLength={80}
              className={inputCls}
            />
          </label>
          <label className="block">
            <span className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-muted">
              Email
              <Lock className="h-3 w-3" aria-hidden="true" />
            </span>
            <input
              value={profile.email}
              readOnly
              className={`${inputCls} cursor-not-allowed bg-surface text-muted`}
            />
            <span className="mt-1 block text-[11px] text-muted/80">
              Dikelola melalui akun Google Anda.
            </span>
          </label>
        </div>

        <label className="block">
          <span className="mb-1.5 flex items-baseline justify-between">
            <span className="text-xs font-semibold text-navy">Bio Singkat</span>
            <span className="text-[11px] text-muted">{bio.length}/280</span>
          </span>
          <textarea
            value={bio}
            onChange={(e) => {
              setBio(e.target.value.slice(0, 280));
              touch();
            }}
            rows={2}
            placeholder="Ceritakan singkat tentang Anda atau produk yang Anda kembangkan…"
            className={`${inputCls} resize-none`}
          />
        </label>

        {/* Preferensi email (opt-out) */}
      <div className="rounded-2xl border border-line bg-white p-5">
        <h2 className="text-sm font-bold text-navy">Preferensi Email</h2>
        <label className="mt-3 flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={notifyEmail}
            onChange={(e) => {
              setNotifyEmail(e.target.checked);
              touch();
            }}
            className="mt-0.5 h-4 w-4 accent-[#d32f2f]"
          />
          <span className="text-sm leading-relaxed text-muted">
            <span className="font-semibold text-navy">Terima email notifikasi</span> —
            kabar produk tayang, balasan chat support, dan info penting akun.
          </span>
        </label>
      </div>

      {/* Sosmed */}
        <div>
          <p className="text-xs font-semibold text-navy">Tautan Media Sosial</p>
          <p className="mt-1 text-xs text-muted">
            Isi username saja atau tempel link lengkap - otomatis dihubungkan ke platform-nya.
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {SOCIAL_FIELDS.map((f) => (
              <label key={f.key} className="relative block">
                <f.icon
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted/60"
                  aria-hidden="true"
                />
                <input
                  value={socials[f.key]}
                  onChange={(e) => {
                    setSocials((s) => ({ ...s, [f.key]: e.target.value }));
                    touch();
                  }}
                  placeholder={f.placeholder}
                  className={`${inputCls} pl-9`}
                />
              </label>
            ))}
          </div>
        </div>

        {error && (
          <p className="rounded-lg bg-brand-soft px-4 py-3 text-sm font-medium text-brand-dark">{error}</p>
        )}

        <div className="flex items-center gap-3 border-t border-line pt-5">
          {dirty && !error && (
            <span className="mr-auto text-xs text-muted">Ada perubahan yang belum disimpan</span>
          )}
          <button
            onClick={save}
            disabled={saving || !dirty}
            className="ml-auto inline-flex items-center gap-2 rounded-lg bg-navy px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-navy-dark disabled:cursor-not-allowed disabled:opacity-40"
          >
            {saving ? (
              <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Check className="h-4 w-4" aria-hidden="true" />
            )}
            Simpan Perubahan
          </button>
        </div>
      </div>
    </section>
  );
}
