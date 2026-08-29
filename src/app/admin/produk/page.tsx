import { ProductsView } from "@/components/admin/ProductsView";
import { getAdminUser } from "@/lib/auth";
import AdminAccessDenied from "@/components/admin/AdminAccessDenied";

export const dynamic = "force-dynamic";

/**
 * Manajemen produk admin. Filter status & pencarian tersimpan di URL
 * (?status=&q=&halaman=) supaya bisa di-bookmark dan di-share.
 */
export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; halaman?: string }>;
}) {
  // Guard page: data di-fetch client-side via API, tapi tetap dikunci
  // ganda supaya seluruh area /admin/* konsisten terlindungi.
  if (!(await getAdminUser())) return <AdminAccessDenied />;

  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.halaman ?? "1", 10) || 1);

  return (
    <ProductsView
      initialStatus={sp.status ?? "all"}
      initialQ={sp.q ?? ""}
      initialPage={page}
    />
  );
}
