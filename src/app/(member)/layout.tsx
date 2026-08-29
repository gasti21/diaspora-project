import Link from "next/link";
import { getSessionUser, getAdminUser } from "@/lib/auth";
import { MemberShell } from "@/components/member/MemberShell";
import { LogoMark } from "@/components/branding/Logo";

export const dynamic = "force-dynamic";

/**
 * Guard area member: hanya user yang sudah login yang melihat shell
 * (sidebar + topbar). Tamu dihadapkan pada kartu ajakan masuk.
 */
export default async function MemberLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface px-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-sm">
          <div className="flex justify-center">
            <LogoMark className="h-12 w-12" />
          </div>
          <h1 className="mt-4 text-xl font-extrabold">Masuk Dulu Ya</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Halaman ini khusus member. Masuk dengan akun Google Anda untuk
            melihat dashboard, pengajuan, favorit, dan profil Anda.
          </p>
          <Link
            href="/login"
            className="mt-6 inline-block rounded-lg bg-navy px-6 py-3 text-sm font-semibold text-white hover:bg-navy-dark"
          >
            Masuk dengan Google
          </Link>
          <Link href="/" className="mt-3 block text-sm text-muted hover:text-brand">
            ← Kembali ke beranda
          </Link>
        </div>
      </div>
    );
  }

  const admin = await getAdminUser();

  return (
    <MemberShell
      user={{
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
        isAdmin: Boolean(admin),
      }}
    >
      {children}
    </MemberShell>
  );
}
