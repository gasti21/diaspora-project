import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronLeft, TriangleAlert } from "lucide-react";
import { getSessionUser } from "@/lib/auth";
import { getMySubmission, listCategories } from "@/lib/data";
import { SubmitForm } from "@/components/forms/SubmitForm";

export const dynamic = "force-dynamic";

/**
 * Perbaiki pengajuan yang diminta revisi admin. Hanya pemilik pengajuan
 * dan hanya produk berstatus "revision" yang boleh masuk halaman ini.
 */
export default async function EditSubmissionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const [product, categories] = await Promise.all([
    getMySubmission(user.id, id),
    listCategories(),
  ]);

  if (!product) notFound();

  // Alur edit hanya untuk pengajuan yang diminta revisi.
  if (product.status !== "revision") {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-50">
          <TriangleAlert className="h-7 w-7 text-amber-500" aria-hidden="true" />
        </span>
        <h1 className="mt-4 text-xl font-extrabold">Halaman Ini Tidak Tersedia</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Pengajuan hanya bisa diperbaiki saat statusnya{" "}
          <span className="font-semibold text-amber-600">Perlu Revisi</span>.
          Status pengajuan ini saat ini bukan revisi.
        </p>
        <Link
          href="/pengajuan"
          className="mt-6 inline-block rounded-lg bg-navy px-5 py-2.5 text-sm font-semibold text-white hover:bg-navy-dark"
        >
          Kembali ke Pengajuan Saya
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mx-auto max-w-3xl">
        <Link
          href="/pengajuan"
          className="inline-flex items-center gap-1 text-sm font-medium text-muted transition hover:text-brand"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" /> Kembali ke Pengajuan Saya
        </Link>
        <h1 className="mt-4 text-3xl font-extrabold">Perbaiki Pengajuan</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Data Anda sudah terisi dari pengajuan sebelumnya - cukup perbaiki bagian
          yang diminta reviewer, lalu kirim ulang untuk ditinjau.
        </p>
        {product.reviewNote && (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-800">
            <span className="font-bold">Catatan reviewer: </span>
            {product.reviewNote}
          </div>
        )}
      </div>

      <div className="mt-8">
        <SubmitForm categories={categories} user={{ name: user.name, email: user.email }} initial={product} editId={product.id} />
      </div>
    </div>
  );
}
