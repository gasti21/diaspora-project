import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
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

  // Edit dibuka untuk semua status. Published yang disimpan ulang otomatis
  // kembali ke antrian review (lihat updateMySubmission).
  const reReview = product.status === "published";

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
          Data Anda sudah terisi dari pengajuan sebelumnya - perbaiki bagian yang
          diperlukan, lalu simpan.
        </p>
        {reReview && (
          <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Produk ini sedang tayang. Menyimpan perubahan akan{' '}
            <span className="font-bold">mengembalikannya ke antrian review</span> sebelum
            tayang kembali.
          </p>
        )}
        {product.reviewNote && (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-800">
            <span className="font-bold">Catatan reviewer: </span>
            {product.reviewNote}
          </div>
        )}
      </div>

      <div className="mt-8">
        <SubmitForm categories={categories} user={{ name: user.name, email: user.email, whatsapp: product.ownerWhatsapp }} initial={product} editId={product.id} />
      </div>
    </div>
  );
}
