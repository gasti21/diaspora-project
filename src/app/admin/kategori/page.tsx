import { adminListCategories } from "@/lib/data";
import { getAdminUser } from "@/lib/auth";
import { CategoriesView } from "@/components/admin/CategoriesView";
import AdminAccessDenied from "@/components/admin/AdminAccessDenied";

export const dynamic = "force-dynamic";

/** Kelola kategori produk: tambah, ubah nama, hapus. */
export default async function AdminCategoriesPage() {
  if (!(await getAdminUser())) return <AdminAccessDenied />;

  const categories = await adminListCategories();
  return <CategoriesView categories={categories} />;
}
