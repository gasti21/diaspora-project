"use client";

/* eslint-disable @next/next/no-img-element */

import { useState } from "react";
import Link from "next/link";
import { CircleCheck, Info, LoaderCircle, Plus, ShieldCheck, X } from "lucide-react";
import { LogoMark } from "@/components/Logo";
import { CATEGORIES, STAGES, COUNTRIES, NEEDS, BACKGROUND_TYPES, IMAGE_MAX_MB, IMAGE_TYPES, MAX_IMAGES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { SubmissionPayload, Stage } from "@/lib/types";

interface Props {
  categories: { id: string; slug: string; name: string }[];
  user: { name: string; email: string };
}

const initialForm = {
  name: "",
  categoryId: "",
  stage: "" as Stage | "",
  country: "",
  city: "",
  yearFounded: "",
  backgroundTypes: [] as string[],
  additionalNotes: "",
  shortDescription: "",
  longDescription: "",
  videoUrl: "",
  website: "",
  ownerName: "",
  ownerEmail: "",
  ownerWhatsapp: "",
  needs: [] as string[],
  needsOther: "",
};

export function SubmitForm({ categories, user }: Props) {
  const [form, setForm] = useState({
    ...initialForm,
    ownerName: user.name,
    ownerEmail: user.email,
  });
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: "" }));
  }

  function toggleArray(key: "backgroundTypes" | "needs", value: string) {
    setForm((f) => ({
      ...f,
      [key]: f[key].includes(value)
        ? f[key].filter((v) => v !== value)
        : [...f[key], value],
    }));
  }

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    setServerError(null);

    const room = MAX_IMAGES - images.length;
    const picked = Array.from(files).slice(0, room);
    if (picked.length === 0) {
      setErrors((e) => ({ ...e, images: `Maksimal ${MAX_IMAGES} foto.` }));
      return;
    }

    setUploading(true);
    const uploaded: string[] = [];
    for (const file of picked) {
      if (!IMAGE_TYPES.includes(file.type)) {
        setErrors((e) => ({ ...e, images: "Format harus JPG atau PNG." }));
        continue;
      }
      if (file.size > IMAGE_MAX_MB * 1024 * 1024) {
        setErrors((e) => ({ ...e, images: `Ukuran maksimal ${IMAGE_MAX_MB}MB per foto.` }));
        continue;
      }
      const body = new FormData();
      body.append("file", file);
      try {
        const res = await fetch("/api/upload", { method: "POST", body });
        const json = await res.json();
        if (res.ok && json.url) uploaded.push(json.url);
        else setServerError(json.error ?? "Gagal mengunggah foto.");
      } catch {
        setServerError("Gagal mengunggah foto. Coba lagi.");
      }
    }
    if (uploaded.length) {
      setImages((prev) => [...prev, ...uploaded].slice(0, MAX_IMAGES));
      setErrors((e) => ({ ...e, images: "" }));
    }
    setUploading(false);
  }

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Nama produk wajib diisi.";
    if (!form.categoryId) e.categoryId = "Pilih kategori.";
    if (!form.stage) e.stage = "Pilih tahap produk.";
    if (!form.country) e.country = "Pilih negara/lokasi.";
    if (!form.shortDescription.trim()) e.shortDescription = "Deskripsi singkat wajib diisi.";
    else if (form.shortDescription.length > 200) e.shortDescription = "Maksimal 200 karakter.";
    if (!form.longDescription.trim()) e.longDescription = "Deskripsi lengkap wajib diisi.";
    else if (form.longDescription.length > 2000) e.longDescription = "Maksimal 2000 karakter.";
    if (images.length === 0) e.images = "Unggah minimal 1 foto produk.";
    if (!form.ownerName.trim()) e.ownerName = "Nama lengkap wajib diisi.";
    if (!form.ownerEmail.trim()) e.ownerEmail = "Email wajib diisi.";
    if (!form.ownerWhatsapp.trim()) e.ownerWhatsapp = "Nomor WhatsApp wajib diisi.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    setServerError(null);
    if (!validate()) {
      document.querySelector(".form-section")?.scrollIntoView({ behavior: "smooth" });
      return;
    }

    const payload: SubmissionPayload = {
      name: form.name.trim(),
      categoryId: form.categoryId,
      stage: form.stage as Stage,
      country: form.country,
      city: form.city.trim() || undefined,
      yearFounded: form.yearFounded ? parseInt(form.yearFounded, 10) : null,
      backgroundTypes: form.backgroundTypes,
      additionalNotes: form.additionalNotes.trim() || undefined,
      shortDescription: form.shortDescription.trim(),
      longDescription: form.longDescription.trim(),
      images,
      videoUrl: form.videoUrl.trim() || undefined,
      website: form.website.trim() || undefined,
      ownerName: form.ownerName.trim(),
      ownerEmail: form.ownerEmail.trim(),
      ownerWhatsapp: form.ownerWhatsapp.trim(),
      needs: form.needs,
      needsOther: form.needsOther.trim() || undefined,
    };

    setSubmitting(true);
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (res.ok) setDone(true);
      else setServerError(json.error ?? "Gagal mengirim produk. Coba lagi.");
    } catch {
      setServerError("Terjadi kesalahan jaringan. Coba lagi.");
    }
    setSubmitting(false);
  }

  if (done) {
    return (
      <div className="mx-auto mt-10 max-w-lg rounded-2xl border border-line bg-white p-10 text-center shadow-sm">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <CircleCheck className="h-8 w-8 text-green-600" aria-hidden="true" />
        </span>
        <h2 className="mt-5 text-2xl font-extrabold">Produk Berhasil Dikirim!</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Produk Anda berstatus <span className="font-semibold text-amber-600">Pending</span>{" "}
          dan akan ditinjau oleh admin kami. Kami akan menghubungi Anda melalui
          email atau WhatsApp.
        </p>
        <div className="mt-7 flex justify-center gap-3">
          <Link href="/explore" className="rounded-lg bg-navy px-5 py-3 text-sm font-semibold text-white hover:bg-navy-dark">
            Explore Produk
          </Link>
          <button
            onClick={() => {
              setForm({ ...initialForm, ownerName: user.name, ownerEmail: user.email });
              setImages([]);
              setDone(false);
            }}
            className="rounded-lg border border-line px-5 py-3 text-sm font-semibold text-navy hover:bg-surface"
          >
            Submit Produk Lain
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8">
      <div className="grid gap-5 lg:grid-cols-2">
        {/* ===== 1. Informasi Dasar ===== */}
        <Section number={1} title="Informasi Dasar">
          <Field label="Nama Produk" required error={errors.name}>
            <input className={inputCls(errors.name)} placeholder="Masukkan nama produk" value={form.name} onChange={(e) => set("name", e.target.value)} />
          </Field>
          <Field label="Kategori" required error={errors.categoryId}>
            <select className={inputCls(errors.categoryId)} value={form.categoryId} onChange={(e) => set("categoryId", e.target.value)}>
              <option value="">Pilih kategori</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Tahap Produk" required error={errors.stage}>
            <select className={inputCls(errors.stage)} value={form.stage} onChange={(e) => set("stage", e.target.value as Stage)}>
              <option value="">Pilih tahap produk</option>
              {STAGES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </Field>
          <Field label="Negara / Lokasi" required error={errors.country}>
            <select className={inputCls(errors.country)} value={form.country} onChange={(e) => set("country", e.target.value)}>
              <option value="">Pilih negara</option>
              {COUNTRIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Kota (opsional)">
              <input className={inputCls()} placeholder="Contoh: Kuala Lumpur" value={form.city} onChange={(e) => set("city", e.target.value)} />
            </Field>
            <Field label="Tahun Berdiri (opsional)">
              <input className={inputCls()} placeholder="Contoh: 2021" inputMode="numeric" value={form.yearFounded} onChange={(e) => set("yearFounded", e.target.value.replace(/[^0-9]/g, "").slice(0, 4))} />
            </Field>
          </div>
          <Field label="Kisah/Latar Belakang" hint="Apa yang Anda lakukan? (Pilih semua yang sesuai)">
            <div className="flex flex-wrap gap-2.5">
              {BACKGROUND_TYPES.map((b) => (
                <label key={b} className={chipCls(form.backgroundTypes.includes(b))}>
                  <input type="checkbox" className="sr-only" checked={form.backgroundTypes.includes(b)} onChange={() => toggleArray("backgroundTypes", b)} />
                  {b}
                </label>
              ))}
            </div>
          </Field>
          <Field label="Ceritakan Tambahan" hint="Tulis kebutuhan atau catatan tambahan (opsional)">
            <textarea rows={3} maxLength={1000} className={inputCls()} placeholder="Tulis kebutuhan atau catatan tambahan (opsional)" value={form.additionalNotes} onChange={(e) => set("additionalNotes", e.target.value)} />
            <Counter value={form.additionalNotes.length} max={1000} />
          </Field>
        </Section>

        {/* ===== 2. Deskripsi Produk ===== */}
        <Section number={2} title="Deskripsi Produk">
          <Field label="Deskripsi Singkat" required error={errors.shortDescription} hint="Jelaskan produk Anda dalam 1–3 kalimat">
            <textarea rows={5} maxLength={220} className={inputCls(errors.shortDescription)} placeholder="Jelaskan produk Anda dalam 1–3 kalimat" value={form.shortDescription} onChange={(e) => set("shortDescription", e.target.value)} />
            <Counter value={form.shortDescription.length} max={200} />
          </Field>
          <Field label="Deskripsi Lengkap" required error={errors.longDescription} hint="Jelaskan produk Anda secara detail, manfaat, keunikan, dan nilai tambah.">
            <textarea rows={12} maxLength={2200} className={inputCls(errors.longDescription)} placeholder="Jelaskan produk Anda secara detail, manfaat, keunikan, dan nilai tambah." value={form.longDescription} onChange={(e) => set("longDescription", e.target.value)} />
            <Counter value={form.longDescription.length} max={2000} />
          </Field>
        </Section>

        {/* ===== 3. Gambar & Link ===== */}
        <Section number={3} title="Gambar & Link">
          <Field label="Foto Produk" required error={errors.images} hint={`Format: JPG, PNG, maks ${IMAGE_MAX_MB}MB per foto (hingga ${MAX_IMAGES} foto)`}>
            <div className="space-y-3">
              {images.length > 0 && (
                <div className="flex flex-wrap gap-3">
                  {images.map((img, i) => (
                    <div key={img} className="relative h-20 w-24 overflow-hidden rounded-lg border border-line">
                      <img src={img} alt={`Foto ${i + 1}`} className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setImages((prev) => prev.filter((_, j) => j !== i))}
                        aria-label={`Hapus foto ${i + 1}`}
                        className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-navy-deep/80 text-white"
                      >
                        <X className="h-3 w-3" />
                      </button>
                      {i === 0 && (
                        <span className="absolute bottom-0 w-full bg-navy-deep/70 py-0.5 text-center text-[10px] text-white">
                          Utama
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {images.length < MAX_IMAGES && (
                <label
                  className={cn(
                    "flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-line bg-surface/60 py-8 text-center transition hover:border-navy/40",
                    uploading && "opacity-60"
                  )}
                >
                  {uploading ? (
                    <LoaderCircle className="h-6 w-6 animate-spin text-navy" aria-hidden="true" />
                  ) : (
                    <Plus className="h-6 w-6 text-navy" aria-hidden="true" />
                  )}
                  <span className="text-sm font-semibold">{uploading ? "Mengunggah..." : "Upload foto produk"}</span>
                  <span className="text-xs text-muted">Format: JPG, PNG, maks {IMAGE_MAX_MB}MB</span>
                  <input type="file" accept="image/jpeg,image/png" multiple className="sr-only" onChange={(e) => handleFiles(e.target.files)} disabled={uploading} />
                </label>
              )}
            </div>
          </Field>
          <Field label="Link Video (YouTube) / Media Sosial">
            <input className={inputCls()} placeholder="Masukkan link (opsional)" value={form.videoUrl} onChange={(e) => set("videoUrl", e.target.value)} />
          </Field>
          <Field label="Website (Jika tersedia)">
            <input className={inputCls()} placeholder="Masukkan link (opsional)" value={form.website} onChange={(e) => set("website", e.target.value)} />
          </Field>
        </Section>

        {/* ===== 4. Kontak ===== */}
        <Section number={4} title="Kontak">
          <Field label="Nama Lengkap" required error={errors.ownerName}>
            <input className={inputCls(errors.ownerName)} placeholder="Masukkan nama lengkap" value={form.ownerName} onChange={(e) => set("ownerName", e.target.value)} />
          </Field>
          <Field label="Email" required error={errors.ownerEmail} hint="Terisi otomatis dari akun Google Anda">
            <input type="email" className={inputCls(errors.ownerEmail)} placeholder="Masukkan email aktif" value={form.ownerEmail} onChange={(e) => set("ownerEmail", e.target.value)} />
          </Field>
          <Field label="WhatsApp / No. HP" required error={errors.ownerWhatsapp}>
            <input className={inputCls(errors.ownerWhatsapp)} placeholder="Masukkan nomor WhatsApp" value={form.ownerWhatsapp} onChange={(e) => set("ownerWhatsapp", e.target.value)} />
          </Field>
        </Section>

        {/* ===== 5. Kebutuhan Produk ===== */}
        <Section number={5} title="Kebutuhan Produk" wide>
          <p className="-mt-1 text-xs text-muted">
            Apa yang Anda butuhkan untuk mengembangkan produk ini? (Pilih semua
            yang sesuai)
          </p>
          <div className="flex flex-wrap gap-3">
            {NEEDS.map((n) => (
              <label key={n} className={chipCls(form.needs.includes(n))}>
                <input type="checkbox" className="sr-only" checked={form.needs.includes(n)} onChange={() => toggleArray("needs", n)} />
                {n}
              </label>
            ))}
          </div>
          {form.needs.includes("Lainnya") && (
            <Field label="Kebutuhan Lainnya (opsional)">
              <input className={inputCls()} placeholder="Sebutkan kebutuhan lainnya" value={form.needsOther} onChange={(e) => set("needsOther", e.target.value)} />
            </Field>
          )}
        </Section>

        {/* ===== 6. Review & Submit ===== */}
        <Section number={6} title="Review & Submit" wide>
          <p className="-mt-1 text-xs text-muted">
            Pastikan semua informasi sudah benar sebelum dikirim.
          </p>
          <div className="flex items-start gap-3 rounded-xl bg-brand-soft p-4 text-sm text-navy/85">
            <Info className="mt-0.5 h-4.5 w-4.5 shrink-0 text-brand" aria-hidden="true" />
            <p>
              Setelah submit, produk Anda akan ditinjau oleh admin. Kami akan
              menghubungi melalui email atau WhatsApp.
            </p>
          </div>

          {serverError && (
            <p className="rounded-lg bg-red-50 p-3 text-sm text-brand">{serverError}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-brand py-4 text-sm font-bold text-white transition hover:bg-brand-dark disabled:opacity-60"
          >
            {submitting ? "Mengirim..." : "Submit Produk Sekarang"}
          </button>

          <p className="flex items-center justify-center gap-1.5 text-xs text-muted">
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            Informasi Anda aman bersama kami dan hanya digunakan untuk keperluan
            kurasi produk.
          </p>
        </Section>
      </div>
    </form>
  );
}

/* ---------- sub-komponen form ---------- */

function Section({
  number,
  title,
  wide,
  children,
}: {
  number: number;
  title: string;
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section
      className={cn(
        "form-section rounded-2xl border border-line bg-white p-6",
        wide && "lg:col-span-2"
      )}
    >
      <h2 className="text-lg font-extrabold">
        {number}. {title}
      </h2>
      <div className="mt-5 space-y-5">{children}</div>
    </section>
  );
}

function Field({
  label,
  required,
  hint,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold">
        {label} {required && <span className="text-brand">*</span>}
      </label>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
      <div className="mt-2">{children}</div>
      {error && <p className="mt-1.5 text-xs font-medium text-brand">{error}</p>}
    </div>
  );
}

function Counter({ value, max }: { value: number; max: number }) {
  return <p className="mt-1 text-right text-xs text-muted">{value}/{max}</p>;
}

function inputCls(error?: string) {
  return cn(
    "w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm outline-none transition placeholder:text-muted/70",
    error ? "border-brand" : "border-line focus:border-navy"
  );
}

function chipCls(active: boolean) {
  return cn(
    "cursor-pointer rounded-lg border px-4 py-2 text-sm font-medium transition select-none",
    active
      ? "border-navy bg-navy text-white"
      : "border-line bg-white text-navy hover:border-navy/40"
  );
}
