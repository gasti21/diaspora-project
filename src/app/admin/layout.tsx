import { getSessionUser, getAdminUser } from "@/lib/auth";
import { AdminShell } from "@/components/admin/AdminShell";
import AdminAccessDenied from "@/components/admin/AdminAccessDenied";

export const dynamic = "force-dynamic";

/**
 * Guard otorisasi untuk SELURUH area /admin/*: hanya profiles.role = 'admin'
 * yang melihat shell dashboard. Non-admin dihadapkan pada kartu akses ditolak.
 *
 * Catatan: layout & page di-render paralel oleh Next.js, jadi SETIAP page
 * admin juga memanggil guard sendiri (lihat AdminAccessDenied) supaya data
 * tidak pernah di-fetch/ter-stream untuk non-admin.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  const admin = user ? await getAdminUser() : null;

  if (!admin) return <AdminAccessDenied />;

  return (
    <AdminShell
      admin={{ name: admin.name, email: admin.email, avatarUrl: admin.avatarUrl }}
    >
      {children}
    </AdminShell>
  );
}