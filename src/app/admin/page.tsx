import Link from "next/link";
import { getSessionUser, getAdminUser } from "@/lib/auth";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { WelcomeBanner } from "@/components/layout/WelcomeBanner";
import { LogoMark } from "@/components/branding/Logo";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await getSessionUser();

  // Otorisasi tunggal: profiles.role = 'admin' di database.
  const admin = user ? await getAdminUser() : null;

  if (!admin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-navy-deep px-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-xl">
          <div className="flex justify-center">
            <LogoMark className="h-12 w-12" />
          </div>
          <h1 className="mt-4 text-xl font-extrabold">Akses Admin Ditolak</h1>
          <p className="mt-3 text-justify text-sm leading-relaxed text-muted">
            {user
              ? `Akun ${user.email} tidak terdaftar sebagai admin. Hubungi admin platform untuk mendapatkan akses.`
              : "Silakan masuk dengan akun Google pengurus untuk membuka dashboard admin."}
          </p>
          <Link
            href="/login?next=%2Fadmin"
            className="mt-6 inline-block rounded-lg bg-navy px-6 py-3 text-sm font-semibold text-white hover:bg-navy-dark"
          >
            {user ? "Coba akun lain" : "Masuk dengan Google"}
          </Link>
          <Link href="/" className="mt-3 block text-sm text-muted hover:text-brand">
            ← Kembali ke beranda
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <WelcomeBanner />
      <AdminDashboard adminName={admin.name} />
    </>
  );
}
