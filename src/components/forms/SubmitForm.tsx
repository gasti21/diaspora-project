"use client";


import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CircleCheck, ImagePlus, Info, LoaderCircle, Package, Pencil, Plus, Send, ShieldCheck, X } from "lucide-react";
import { useToast } from "@/components/toast/ToastProvider";
import { LocationPicker } from "./LocationPicker";
import { STAGES, NEEDS, BACKGROUND_TYPES, IMAGE_MAX_MB, IMAGE_TYPES, MAX_IMAGES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { Product, SubmissionPayload, Stage } from "@/lib/types";

interface Props {
  categories: { id: string; slug: string; name: string }[];
  user: { name: string; email: string };
  /** Data pengajuan lama saat mode edit (alur revisi). */
  initial?: Product;
  /** ID pengajuan yang sedang diedit - aktifkan mode PATCH. */
  editId?: string;
  /** Tujuan tombol di layar sukses (default: /pengajuan). */
  doneHref?: string;
  doneLabel?: string;
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

/* ---------- definisi langkah wizard ---------- */
const STEPS = [
  { title: "Informasi Produk", desc: "Identitas dasar produk Anda", icon: Package },
  { title: "Deskripsi & Foto", desc: "Ceritakan dan tunjukkan produknya", icon: ImagePlus },
  { title: "Kontak & Kirim", desc: "Cek ringkasan, lalu kirim", icon: Send },
] as const;

export function SubmitForm({ categories, user, initial, editId, doneHref = "/pengajuan", doneLabel = "Pengajuan Saya" }: Props) {
  const isEdit = Boolean(editId);
  const [form, setForm] = useState(() => ({
    ...initialForm,
    ownerName: user.name,
    ownerEmail: user.email,
    // Prefill data lama saat mode edit revisi.
    ...(initial
      ? {
          name: initial.name,
          categoryId: initial.categoryId,
          stage: initial.stage,
          country: initial.country,
          city: initial.city ?? "",
          yearFounded: initial.yearFounded ? String(initial.yearFounded) : "",
          backgroundTypes: initial.backgroundTypes,
          additionalNotes: initial.additionalNotes ?? "",
          shortDescription: initial.shortDescription,
          longDescription: initial.longDescription,
          videoUrl: initial.videoUrl ?? "",
          website: initial.website ?? "",
          ownerName: initial.ownerName || user.name,
          ownerEmail: initial.ownerEmail || user.email,
          ownerWhatsapp: initial.ownerWhatsapp,
          needs: initial.needs,
          needsOther: initial.needsOther ?? "",
        }
      : {}),
  }));
  const [images, setImages] = useState<string[]>(initial?.images ?? []);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [step, setStep] = useState(0);
  const toast = useToast();

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
        else toast.error(json.error ?? "Gagal mengunggah foto.");
      } catch {
        toast.error("Gagal mengunggah foto. Coba lagi.");
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

  /** Validasi per langkah wizard: hanya cek field yang tampil di langkah tsb. */
  function validateStep(s: number): boolean {
    const e: Record<string, string> = {};
    if (s === 0) {
      if (!form.name.trim()) e.name = "Nama produk wajib diisi.";
      if (!form.categoryId) e.categoryId = "Pilih kategori.";
      if (!form.stage) e.stage = "Pilih tahap produk.";
      if (!form.country) e.country = "Pilih negara/lokasi.";
    } else if (s === 1) {
      if (!form.shortDescription.trim()) e.shortDescription = "Deskripsi singkat wajib diisi.";
      else if (form.shortDescription.length > 200) e.shortDescription = "Maksimal 200 karakter.";
      if (!form.longDescription.trim()) e.longDescription = "Deskripsi lengkap wajib diisi.";
      else if (form.longDescription.length > 2000) e.longDescription = "Maksimal 2000 karakter.";
      if (images.length === 0) e.images = "Unggah minimal 1 foto produk.";
    } else {
      if (!form.ownerName.trim()) e.ownerName = "Nama lengkap wajib diisi.";
      if (!form.ownerEmail.trim()) e.ownerEmail = "Email wajib diisi.";
      if (!form.ownerWhatsapp.trim()) e.ownerWhatsapp = "Nomor WhatsApp wajib diisi.";
    }
    setErrors(e);
    if (Object.keys(e).length > 0) {
      toast.error("Lengkapi data yang ditandai merah dulu ya.");
      return false;
    }
    return true;
  }

  function goNext() {
    if (!validateStep(step)) return;
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function goBack() {
    setStep((s) => Math.max(s - 1, 0));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!validate()) {
      toast.error("Masih ada data yang belum lengkap. Periksa kembali ya.");
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
      const res = await fetch(
        isEdit ? `/api/products/${editId}` : "/api/products",
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const json = await res.json();
      if (res.ok) setDone(true);
      else toast.error(json.error ?? "Gagal mengirim produk. Coba lagi.");
    } catch {
      toast.error("Terjadi kesalahan jaringan. Coba lagi.");
    }
    setSubmitting(false);
  }

  if (done) {
    return (
      <div className="mx-auto mt-10 max-w-lg rounded-2xl border border-line bg-white p-10 text-center shadow-sm">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <CircleCheck className="h-8 w-8 text-green-600" aria-hidden="true" />
        </span>
        <h2 className="mt-5 text-2xl font-extrabold">
          {isEdit ? "Perbaikan Terkirim!" : "Produk Berhasil Dikirim!"}
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          {isEdit ? "Pengajuan Anda kembali " : "Produk Anda berstatus "}
          <span className="font-semibold text-amber-600">Pending</span>{" "}
          dan akan ditinjau ulang oleh admin kami. Kami akan menghubungi Anda
          melalui email atau WhatsApp.
        </p>
        <div className="mt-7 flex justify-center gap-3">
          <Link href={doneHref} className="rounded-lg bg-navy px-5 py-3 text-sm font-semibold text-white hover:bg-navy-dark">
            {isEdit ? "Lihat Status Pengajuan" : doneLabel}
          </Link>
          {!isEdit && (
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
          )}
        </div>
      </div>
    );
  }

  /* data turunan untuk ringkasan di langkah terakhir */
  const categoryName = categories.find((c) => c.id === form.categoryId)?.name ?? "";
  const locationLabel = [form.city, form.country].filter(Boolean).join(", ");

  const summaryItems: { label: string; value: string; editStep: number | null }[] = [
    { label: "Nama Produk", value: form.name, editStep: 0 },
    { label: "Kategori", value: categoryName, editStep: 0 },
    { label: "Tahap", value: form.stage, editStep: 0 },
    { label: "Lokasi", value: locationLabel, editStep: 0 },
    { label: "Foto", value: images.length ? `${images.length} foto terunggah` : "Belum ada foto", editStep: 1 },
    { label: "Deskripsi Singkat", value: form.shortDescription ? "Sudah diisi" : "Belum diisi", editStep: 1 },
    { label: "Kontak (WA)", value: form.ownerWhatsapp, editStep: null },
  ];

  return (
    <form onSubmit={handleSubmit} className="mt-8">
      {/* ===== Stepper wizard ===== */}
      <nav aria-label="Langkah pengisian" className="rounded-2xl border border-line bg-white p-4 sm:p-5">
        <ol className="flex items-center gap-2 sm:gap-3">
          {STEPS.map((s, i) => {
            const isDone = i < step;
            const isCurrent = i === step;
            return (
              <li key={s.title} className="flex flex-1 items-center gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={() => isDone && setStep(i)}
                  disabled={!isDone}
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition",
                    isCurrent && "bg-navy text-white ring-4 ring-navy/10",
                    isDone && "bg-green-100 text-green-700 hover:bg-green-200",
                    !isCurrent && !isDone && "bg-surface text-muted"
                  )}
                  aria-current={isCurrent ? "step" : undefined}
                >
                  {isDone ? (
                    <CircleCheck className="h-4 w-4" aria-hidden="true" />
                  ) : isCurrent ? (
                    <s.icon className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    i + 1
                  )}
                </button>
                <div className="hidden min-w-0 sm:block">
                  <p className={cn("truncate text-xs font-bold", isCurrent ? "text-navy" : "text-muted")}>{s.title}</p>
                  <p className="truncate text-[11px] text-muted">{s.desc}</p>
                </div>
                {i < STEPS.length - 1 && (
                  <span aria-hidden="true" className={cn("h-px flex-1", i < step ? "bg-green-400" : "bg-line")} />
                )}
              </li>
            );
          })}
        </ol>
        {/* Progress bar */}
        <div
          className="mt-4 h-1.5 overflow-hidden rounded-full bg-surface"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={STEPS.length}
          aria-valuenow={step + 1}
          aria-label={`Progres pengisian: langkah ${step + 1} dari ${STEPS.length}`}
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-navy to-navy-dark transition-all duration-500 ease-out"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>
        {/* Judul langkah utk mobile (detail tersembunyi di sm) */}
        <p className="mt-3 text-sm font-bold text-navy sm:hidden">
          Langkah {step + 1}/{STEPS.length}: {STEPS[step].title}
        </p>
      </nav>

      <div key={step} className="animate-step-in mt-5 grid gap-5 lg:grid-cols-2">
        {/* ===== LANGKAH 1 — Informasi Produk ===== */}
        {step === 0 && (
          <Section number={1} title="Informasi Produk" wide>
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
          {/* Lokasi: deteksi GPS otomatis ala Shopee + fallback manual */}
          <LocationPicker
            country={form.country}
            city={form.city}
            onCountry={(v) => set("country", v)}
            onCity={(v) => set("city", v)}
            error={errors.country}
          />
          <Field label="Tahun Berdiri (opsional)">
            <input className={inputCls()} placeholder="Contoh: 2021" inputMode="numeric" value={form.yearFounded} onChange={(e) => set("yearFounded", e.target.value.replace(/[^0-9]/g, "").slice(0, 4))} />
          </Field>
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
        )}

        {/* ===== LANGKAH 2 — Deskripsi & Foto ===== */}
        {step === 1 && (
        <>
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
        </>
        )}

        {/* ===== LANGKAH 3 — Kontak & Kirim ===== */}
        {step === 2 && (
        <>

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

        {/* ===== 6. Ringkasan & Kirim ===== */}
        <Section number={6} title="Ringkasan & Kirim" wide>
          {/* Ringkasan isian dengan tombol lompat-ke-langkah untuk koreksi */}
          <div className="grid gap-3 sm:grid-cols-2">
            {summaryItems.map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between gap-3 rounded-xl border border-line bg-surface/60 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">{item.label}</p>
                  <p className={cn("truncate text-sm font-semibold", item.value ? "text-navy" : "text-brand")}>
                    {item.value || "Belum diisi"}
                  </p>
                </div>
                {item.editStep !== null && (
                  <button
                    type="button"
                    onClick={() => {
                      setStep(item.editStep as number);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="flex shrink-0 items-center gap-1 rounded-lg border border-line px-2.5 py-1.5 text-xs font-semibold text-navy transition hover:bg-white"
                  >
                    <Pencil className="h-3 w-3" aria-hidden="true" />
                    Ubah
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="flex items-start gap-3 rounded-xl bg-brand-soft p-4 text-sm text-navy/85">
            <Info className="mt-0.5 h-4.5 w-4.5 shrink-0 text-brand" aria-hidden="true" />
            <p>
              {isEdit
                ? "Sudah diperbaiki? Tekan "
                : "Sudah semuanya benar? Tekan "}
              <span className="font-semibold">
                {isEdit
                  ? "“Kirim Ulang untuk Review”"
                  : "“Submit Produk Sekarang”"}
              </span>
              . {isEdit ? "Pengajuan Anda" : "Produk Anda"} akan ditinjau admin
              (1&ndash;3 hari), lalu kami menghubungi Anda via email atau
              WhatsApp.
            </p>
          </div>

          <p className="flex items-center justify-center gap-1.5 text-xs text-muted">
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            Informasi Anda aman bersama kami dan hanya digunakan untuk keperluan
            kurasi produk.
          </p>
        </Section>
        </>
        )}
      </div>

      {/* ===== Navigasi wizard ===== */}
      <div className="mt-6 flex items-center justify-between gap-4 rounded-2xl border border-line bg-white p-4 sm:p-5">
        <button
          type="button"
          onClick={goBack}
          disabled={step === 0}
          className="flex items-center gap-1.5 rounded-lg border border-line px-5 py-3 text-sm font-semibold text-navy transition hover:bg-surface disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Kembali
        </button>
        <p className="text-xs font-medium text-muted">
          Langkah {step + 1} dari {STEPS.length}
        </p>
        {step < STEPS.length - 1 ? (
          <button
            type="button"
            onClick={goNext}
            className="flex items-center gap-1.5 rounded-lg bg-navy px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-navy-dark"
          >
            Lanjut
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        ) : (
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 rounded-lg bg-brand px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting && <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />}
            {submitting
              ? "Mengirim..."
              : isEdit
                ? "Kirim Ulang untuk Review"
                : "Submit Produk Sekarang"}
          </button>
        )}
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
  const nearLimit = value > max * 0.9;
  return (
    <p
      className={cn(
        "mt-1 text-right text-xs tabular-nums",
        nearLimit ? "font-semibold text-amber-600" : "text-muted"
      )}
    >
      {value}/{max}
    </p>
  );
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
