"use client";


import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, CircleCheck, Globe, ImagePlus, Info, LoaderCircle, Package, Pencil, Plus, Send, ShieldCheck, Star, X } from "lucide-react";
import { useToast } from "@/components/toast/ToastProvider";
import { LocationPicker } from "./LocationPicker";
import { STAGES, STAGE_META, categoryBySlug, NEEDS, IMAGE_MAX_MB, IMAGE_TYPES, MAX_IMAGES } from "@/lib/constants";
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
  latitude: null as number | null,
  longitude: null as number | null,
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

  function toggleArray(key: "needs", value: string) {
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
      latitude: form.latitude ?? undefined,
      longitude: form.longitude ?? undefined,
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
      <nav aria-label="Langkah pengisian" className="rounded-2xl border border-line bg-white p-4 shadow-sm sm:p-6">
        <ol className="flex items-start">
          {STEPS.map((s, i) => {
            const isDone = i < step;
            const isCurrent = i === step;
            return (
              <li key={s.title} className={cn("flex items-start", i < STEPS.length - 1 && "flex-1")}>
                <div className="flex w-24 flex-col items-center gap-2 text-center sm:w-32">
                  <button
                    type="button"
                    onClick={() => isDone && setStep(i)}
                    disabled={!isDone}
                    title={isDone ? `Kembali ke: ${s.title}` : undefined}
                    className={cn(
                      "group flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold shadow-sm transition",
                      isCurrent &&
                        "bg-navy text-white ring-4 ring-navy/15 scale-110 shadow-md shadow-navy/25",
                      isDone &&
                        "bg-green-500 text-white ring-4 ring-green-100 hover:scale-110 hover:bg-green-600 cursor-pointer",
                      !isCurrent && !isDone && "border-2 border-line bg-white text-muted"
                    )}
                    aria-current={isCurrent ? "step" : undefined}
                  >
                    {isDone ? (
                      <CircleCheck className="h-5 w-5" aria-hidden="true" />
                    ) : isCurrent ? (
                      <s.icon className="h-5 w-5" aria-hidden="true" />
                    ) : (
                      i + 1
                    )}
                  </button>
                  <div className="min-w-0">
                    <p
                      className={cn(
                        "truncate text-xs font-bold transition",
                        isCurrent && "text-navy",
                        isDone && "text-green-700 group-hover:underline decoration-green-400 underline-offset-2",
                        !isCurrent && !isDone && "text-muted"
                      )}
                    >
                      {s.title}
                    </p>
                    <p className={cn("mt-0.5 hidden truncate text-[11px] leading-tight sm:block", isCurrent ? "text-navy/60" : "text-muted/80")}>
                      {s.desc}
                    </p>
                  </div>
                </div>
                {i < STEPS.length - 1 && (
                  <span
                    aria-hidden="true"
                    className="relative mx-1 mt-5 h-1 flex-1 overflow-hidden rounded-full bg-line"
                  >
                    <span
                      className={cn(
                        "absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-green-400 to-green-300 transition-all duration-500 ease-out",
                        i < step ? "w-full" : "w-0"
                      )}
                    />
                  </span>
                )}
              </li>
            );
          })}
        </ol>
        {/* Judul langkah utk mobile (detail tersembunyi di sm) */}
        <p className="mt-4 text-sm font-bold text-navy sm:hidden">
          Langkah {step + 1}/{STEPS.length}: {STEPS[step].title}
        </p>
      </nav>

      <div key={step} className="animate-step-in mt-5 grid gap-5 lg:grid-cols-2">
        {/* ===== LANGKAH 1 - Informasi Produk ===== */}
        {step === 0 && (
          <Section number={1} title="Informasi Produk" wide>
          <Field label="Nama Produk" required error={errors.name}>
            <input className={inputCls(errors.name)} placeholder="Masukkan nama produk" value={form.name} onChange={(e) => set("name", e.target.value)} />
          </Field>
          <Field label="Kategori" required error={errors.categoryId}>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              {categories.map((c) => {
                const meta = categoryBySlug(c.slug);
                const Icon = meta?.icon;
                const active = form.categoryId === c.id;
                return (
                  <label
                    key={c.id}
                    className={cn(
                      "flex cursor-pointer flex-col items-center gap-1.5 rounded-xl border px-3 py-3.5 text-center transition select-none",
                      active
                        ? "border-navy bg-navy/5 shadow-md shadow-navy/10"
                        : "border-line bg-white hover:-translate-y-0.5 hover:border-navy/40 hover:shadow-md hover:shadow-navy/5"
                    )}
                  >
                    <input type="radio" className="sr-only" checked={active} onChange={() => set("categoryId", c.id)} />
                    {Icon && <Icon className={cn("h-6 w-6", active ? "text-navy" : meta?.color)} aria-hidden="true" />}
                    <span className={cn("text-xs font-semibold leading-tight", active ? "text-navy" : "text-navy/70")}>{c.name}</span>
                    {active && <Check className="h-4 w-4 text-navy" aria-hidden="true" />}
                  </label>
                );
              })}
            </div>
          </Field>
          <Field label="Tahap Produk" required error={errors.stage}>
            <div className="grid grid-cols-2 gap-2.5">
              {STAGES.map((s) => {
                const meta = STAGE_META[s];
                const Icon = meta.icon;
                const active = form.stage === s;
                return (
                  <label
                    key={s}
                    className={cn(
                      "flex cursor-pointer flex-col gap-1 rounded-xl border px-3.5 py-3 transition select-none",
                      active
                        ? "border-navy bg-navy/5 shadow-md shadow-navy/10"
                        : "border-line bg-white hover:-translate-y-0.5 hover:border-navy/40 hover:shadow-md hover:shadow-navy/5"
                    )}
                  >
                    <input type="radio" className="sr-only" checked={active} onChange={() => set("stage", s)} />
                    <span className="flex items-center gap-2">
                      <Icon className={cn("h-5 w-5", active ? "text-navy" : meta.color)} aria-hidden="true" />
                      <span className={cn("text-xs font-bold", active ? "text-navy" : "text-navy/70")}>{s}</span>
                    </span>
                    <span className="text-[11px] leading-snug text-muted">{meta.desc}</span>
                  </label>
                );
              })}
            </div>
          </Field>
          {/* Lokasi: deteksi GPS otomatis ala Shopee + fallback manual */}
          <LocationPicker
            country={form.country}
            city={form.city}
            onCountry={(v) => set("country", v)}
            onCity={(v) => set("city", v)}
            onCoordinates={(lat, lng) => {
              set("latitude", lat);
              set("longitude", lng);
            }}
            error={errors.country}
          />
          <Field label="Catatan Tambahan" counter={<Counter value={form.additionalNotes.length} max={1000} />}>
            <textarea rows={3} maxLength={1000} className={cn(inputCls(), "resize-none")} placeholder="Contoh: siap kirim ke luar kota, butuh partner produksi, minimal order 10 pcs…" value={form.additionalNotes} onChange={(e) => set("additionalNotes", e.target.value)} />
          </Field>
        </Section>
        )}

        {/* ===== LANGKAH 2 - Deskripsi & Foto ===== */}
        {step === 1 && (
        <>
        <Section number={2} title="Deskripsi Produk">
          <Field label="Deskripsi Singkat" required error={errors.shortDescription} counter={<Counter value={form.shortDescription.length} max={200} />}>
            <textarea rows={5} maxLength={220} className={cn(inputCls(errors.shortDescription), "resize-none")} placeholder="Contoh: Keripik ubi ungu asli, dipanggang tanpa minyak, renyah tahan 3 bulan." value={form.shortDescription} onChange={(e) => set("shortDescription", e.target.value)} />
          </Field>
          <Field label="Deskripsi Lengkap" required error={errors.longDescription} hint="Ceritakan manfaat, keunikan, bahan, dan cara memesan." counter={<Counter value={form.longDescription.length} max={2000} />}>
            <textarea rows={12} maxLength={2200} className={cn(inputCls(errors.longDescription), "resize-none")} placeholder={"Contoh:\n\nKeripik ubi ungu ini dibuat dari ubi ungu pilihan petani lokal, dipanggang tanpa minyak sehingga lebih sehat.\n\nKeunikannya: warna alami tanpa pewarna, renyahnya bertahan hingga 3 bulan.\n\nTersedia 3 varian rasa. Pemesanan melalui WhatsApp, minimal 5 pcs."} value={form.longDescription} onChange={(e) => set("longDescription", e.target.value)} />
          </Field>
        </Section>

        {/* ===== 3. Gambar & Link ===== */}
        <Section number={3} title="Gambar & Link">
          <Field label="Foto Produk" required error={errors.images}>
            <div className="space-y-3">
              {images.length > 0 && (
                <div className="group flex flex-wrap gap-3">
                  {images.map((img, i) => (
                    <div
                      key={img}
                      className={cn(
                        "relative h-20 w-24 overflow-hidden rounded-lg border-2 transition",
                        i === 0 ? "border-navy" : "border-line"
                      )}
                    >
                      <img src={img} alt={`Foto ${i + 1}`} className="h-full w-full object-cover" />
                      {i > 0 && (
                        <button
                          type="button"
                          onClick={() =>
                            setImages((prev) => {
                              const next = [...prev];
                              const [chosen] = next.splice(i, 1);
                              return [chosen, ...next];
                            })
                          }
                          aria-label={`Jadikan sampul: foto ${i + 1}`}
                          title="Jadikan sampul"
                          className="absolute left-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-white/90 text-navy opacity-0 transition hover:bg-white group-hover:opacity-100"
                        >
                          <Star className="h-3 w-3" />
                        </button>
                      )}
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
                          Sampul
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
                  <span className="text-xs text-muted">Tarik & lepas, atau klik untuk memilih - JPG/PNG, maks {IMAGE_MAX_MB}MB ({images.length}/{MAX_IMAGES})</span>
                  <input type="file" accept="image/jpeg,image/png" multiple className="sr-only" onChange={(e) => handleFiles(e.target.files)} disabled={uploading} />
                </label>
              )}
            </div>
          </Field>
          <Field label="Link Video / Media Sosial (opsional)">
            <input className={inputCls()} placeholder="https://youtube.com/watch?v=... atau link TikTok/Instagram" value={form.videoUrl} onChange={(e) => set("videoUrl", e.target.value)} />
            <LinkPreview url={form.videoUrl} />
          </Field>
          <Field label="Website (opsional)">
            <input className={inputCls()} placeholder="https://tokomu.com" value={form.website} onChange={(e) => set("website", e.target.value)} />
            <LinkPreview url={form.website} screenshot />
          </Field>
        </Section>
        </>
        )}

        {/* ===== LANGKAH 3 - Kontak & Kirim ===== */}
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

        {/* ===== 5. Sedang Mencari ===== */}
        <Section number={5} title="Sedang Mencari" wide>
          <p className="-mt-1 text-xs text-muted">
            Apa yang Anda butuhkan untuk mengembangkan produk ini? Pilihan ini
            akan tampil di halaman produk sebagai &quot;Sedang Mencari&quot; agar pengunjung
            tahu bagaimana mereka bisa membantu. (Pilih semua yang sesuai)
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
      <div className="sticky bottom-4 z-30 mt-6 flex items-center justify-between gap-4 rounded-2xl border border-line bg-white/95 p-4 shadow-lg shadow-navy/5 backdrop-blur sm:p-5">
        <button
          type="button"
          onClick={goBack}
          disabled={step === 0}
          className="flex items-center gap-1.5 rounded-xl border border-line px-4 py-2.5 text-sm font-semibold text-navy transition hover:bg-surface disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white sm:px-5 sm:py-3"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          <span className="hidden sm:inline">Kembali</span>
        </button>
        <p className="text-xs font-medium text-muted">
          Langkah <span className="font-bold text-navy">{step + 1}</span> dari {STEPS.length}
        </p>
        {step < STEPS.length - 1 ? (
          <button
            type="button"
            onClick={goNext}
            className="flex items-center gap-1.5 rounded-xl bg-navy px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-navy-dark hover:shadow-md sm:px-6 sm:py-3"
          >
            Lanjut
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        ) : (
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-brand-dark hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 sm:px-6 sm:py-3"
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
        "form-section rounded-2xl border border-line bg-white p-6 shadow-sm",
        wide && "lg:col-span-2"
      )}
    >
      <div className="flex items-center gap-3 border-b border-line pb-4">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-navy text-sm font-extrabold text-white">
          {number}
        </span>
        <h2 className="text-lg font-extrabold tracking-tight">{title}</h2>
      </div>
      <div className="mt-5 space-y-5">{children}</div>
    </section>
  );
}

function Field({
  label,
  required,
  hint,
  error,
  counter,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  counter?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <label className="block text-sm font-semibold">
          {label} {required && <span className="text-brand">*</span>}
        </label>
        {counter && <span className="shrink-0 text-xs tabular-nums text-muted">{counter}</span>}
      </div>
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
        "text-xs tabular-nums",
        nearLimit ? "font-semibold text-amber-600" : "text-muted"
      )}
    >
      {value}/{max}
    </p>
  );
}

function inputCls(error?: string) {
  return cn(
    "w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm outline-none transition placeholder:text-muted/60",
    error
      ? "border-brand focus:border-brand focus:ring-4 focus:ring-brand/10"
      : "border-line hover:border-navy/30 focus:border-navy focus:ring-4 focus:ring-navy/10"
  );
}

function chipCls(active: boolean) {
  return cn(
    "flex cursor-pointer items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold transition select-none",
    active
      ? "border-navy bg-navy text-white shadow-md shadow-navy/20"
      : "border-line bg-white text-navy hover:-translate-y-0.5 hover:border-navy/40 hover:shadow-md hover:shadow-navy/5"
  );
}

/**
 * Pratinjau link: sampul besar (og:image) dari video/sosmed/situs, via
 * proxy server sendiri sehingga semua platform terdukung tanpa CORS.
 */
function LinkPreview({ url, screenshot = false }: { url: string; screenshot?: boolean }) {
  const u = url.trim();
  const [state, setState] = useState<{
    loading: boolean;
    image: string | null;
    title: string;
    host: string;
  }>({ loading: false, image: null, title: "", host: "" });
  const [shotFailed, setShotFailed] = useState(false);

  useEffect(() => {
    if (!u) {
      setState({ loading: false, image: null, title: "", host: "" });
      setShotFailed(false);
      return;
    }
    setShotFailed(false);
    let alive = true;
    setState((st) => ({ ...st, loading: true }));
    const t = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/link-preview?url=${encodeURIComponent(u)}`
        );
        const data = await res.json();
        if (!alive) return;
        setState({
          loading: false,
          image: data.image ?? null,
          title: data.title ?? "",
          host: data.host ?? "",
        });
      } catch {
        if (alive) setState((st) => ({ ...st, loading: false }));
      }
    }, 450);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [u]);

  if (!u) return null;

  const href = u.startsWith("http") ? u : `https://${u}`;

  // Situs tanpa og:image: kartu ringkas, bukan kotak besar kosong.
  const shotUrl = screenshot && !state.image && !shotFailed
    ? `/api/link-preview/screenshot?url=${encodeURIComponent(href)}`
    : null;
  if (!state.image && !shotUrl && !state.loading) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className="mt-2 flex items-center gap-3 overflow-hidden rounded-xl border border-line bg-white px-3.5 py-3 transition hover:border-navy/40"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface text-navy">
          <Globe className="h-5 w-5" aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-navy">
            {state.title || state.host || href}
          </span>
          <span className="block truncate text-[11px] text-muted">{state.host || href}</span>
        </span>
        <span className="flex shrink-0 items-center gap-1 text-[11px] font-semibold text-green-700">
          <CircleCheck className="h-3.5 w-3.5" aria-hidden="true" />
          Link valid
        </span>
      </a>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="mt-2 block overflow-hidden rounded-xl border border-line bg-white transition hover:border-navy/40"
    >
      <div className="relative aspect-video w-full bg-surface">
        {state.image || shotUrl ? (
          <img
            src={state.image ? `/api/link-preview/image?url=${encodeURIComponent(state.image)}` : shotUrl!}
            alt="Pratinjau"
            className="h-full w-full object-cover"
            onError={() => setShotFailed(true)}
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-xs text-muted">
            Memuat pratinjau...
          </span>
        )}
        {state.image && state.title && (
          <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2.5 pt-6">
            <span className="block truncate text-xs font-semibold text-white">{state.title}</span>
          </span>
        )}
      </div>
      <span className="flex items-center gap-2 px-3 py-2">
        <span className="min-w-0 truncate text-[11px] font-medium text-muted">{state.host || href}</span>
        <span className="ml-auto flex shrink-0 items-center gap-1 text-[11px] font-semibold text-green-700">
          <CircleCheck className="h-3.5 w-3.5" aria-hidden="true" />
          Link valid
        </span>
      </span>
    </a>
  );
}

