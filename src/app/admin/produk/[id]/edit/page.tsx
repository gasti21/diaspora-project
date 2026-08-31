import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { getAdminUser } from "@/lib/auth";
import { adminGetProduct, listCategories } from "@/lib/data";
import { SubmitForm } from "@/components/forms/SubmitForm";

export const dynamic = "force-dynamic";

/** Edit data produk oleh admin (memperbaiki typo/isi tanpa mengubah status). */
export default async function AdminEditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!(await getAdminUser())) redirect("/admin");

  const { id } = await params;
  const [product, categories] = await Promise.all([
    adminGetProduct(id),
    listCategories(),
  ]);
  if (!product) notFound();

  return (
    <div>
      <Link
        href="/admin/produk"
        className="inline-flex items-center gap-1 text-sm font-medium text-muted transition hover:text-navy"
      >
        <ChevronLeft className="h-4 w-4" aria-hidden="true" /> Kembali ke Manajemen Produk
      </Link>
      <h1 className="mt-4 text-2xl font-extrabold text-navy">
        Edit Produk: <span className="text-brand">{product.name}</span>
      </h1>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
        Perbaiki data produk seperlunya. Status review dan catatan{" "}
        <span className="font-semibold">tidak ikut berubah</span> - edit di sini
        murni memperbaiki isi data.
      </p>

      <div className="mt-8">
        <SubmitForm
          categories={categories}
          user={{ name: product.ownerName, email: product.ownerEmail }}
          initial={product}
          editId={product.id}
          doneHref="/admin/produk"
          doneLabel="Kembali ke Manajemen Produk"
        />
      </div>
    </div>
  );
}
