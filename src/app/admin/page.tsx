import Link from "next/link";
import { getSessionUser, isAdminEmail } from "@/lib/auth";
import { adminAllowlistActive } from "@/lib/supabase/config";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { LogoMark } from "@/components/branding/Logo";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await getSessionUser();

  if (!user || !isAdminEmail(user.email)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-navy-deep px-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-xl">
          <div className="flex justify-center">
            <LogoMark className="h-12 w-12" />
          </div>
          <h1 className="mt-4 text-xl font-extrabold">Akses Admin Ditolak</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            {user
              ? `Akun ${user.email} tidak terdaftar sebagai admin. Hubungi Tim IT & Data PPID DPBD untuk mendapatkan akses.`
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

  if (!adminAllowlistActive) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface px-4">
        <div className="max-w-md rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">
          <p className="font-bold">Mode development tanpa allowlist.</p>
          <p className="mt-2 leading-relaxed">
            Set variabel <code className="rounded bg-amber-100 px-1">ADMIN_EMAILS</code>{" "}
            di <code className="rounded bg-amber-100 px-1">.env.local</code> (dan di
            Vercel nanti) agar hanya email pengurus yang bisa membuka dashboard ini.
          </p>
        </div>
      </div>
    );
  }

  return <AdminDashboard adminName={user.name} />;
}
