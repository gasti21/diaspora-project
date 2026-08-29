import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { LogoMark } from "@/components/branding/Logo";

/**
 * Kartu "akses ditolak" area admin.
 *
 * PENTING: Next.js merender layout & page secara PARALEL, sehingga guard
 * yang hanya ada di layout tidak mencegah page tetap ter-render - datanya
 * bisa ikut ter-stream ke tamu di RSC payload. Karena itu SETIAP page admin
 * wajib memeriksa getAdminUser() dan merender komponen ini saat bukan admin,
 * sebelum melakukan fetch data apa pun.
 */
export default async function AdminAccessDenied() {
  const user = await getSessionUser();

  return (
    <div className="flex min-h-screen items-center justify-center bg-navy-deep px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-xl">
        <div className="flex justify-center">
          <LogoMark className="h-12 w-12" />
        </div>
        <h1 className="mt-4 text-xl font-extrabold">Akses Admin Ditolak</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
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
