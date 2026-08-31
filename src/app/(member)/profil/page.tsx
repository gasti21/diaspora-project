import Link from "next/link";
import type { Metadata } from "next";
import { CircleUserRound, ClipboardList, Mail, ShieldCheck, UserRound } from "lucide-react";
import { getSessionUser, getAdminUser } from "@/lib/auth";
import { listMySubmissions } from "@/lib/data";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { cn } from "@/lib/utils";
import type { ProductStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  description: "Profil akun KaryaDiaspora Anda.",
};

/** Profil member: identitas akun Google, ringkasan pengajuan, dan aksi akun. */
export default async function ProfilPage() {
  const user = await getSessionUser();
  if (!user) return null; // guard sesi ada di layout (member)

  const [admin, submissions] = await Promise.all([
    getAdminUser(),
    listMySubmissions(user.id),
  ]);

  const count = (s: ProductStatus) => submissions.filter((p) => p.status === s).length;

  const stats = [
    { label: "Total Pengajuan", value: submissions.length, icon: ClipboardList, chip: "bg-navy/10 text-navy" },
    { label: "Sudah Tayang", value: count("published"), icon: ShieldCheck, chip: "bg-green-50 text-green-600" },
  ];

  return (
    <div className="max-w-3xl space-y-6">
      {/* Kartu identitas */}
      <section className="rounded-2xl border border-line bg-white p-6 sm:p-8">
        <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:text-left">
          <span className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-surface bg-white">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.name} className="h-full w-full object-cover" />
            ) : (
              <CircleUserRound className="h-10 w-10 text-muted" aria-hidden="true" />
            )}
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <h1 className="text-xl font-extrabold text-navy">{user.name}</h1>
              <span
                className={cn(
                  "rounded-full px-2.5 py-1 text-[11px] font-bold",
                  admin ? "bg-blue-50 text-blue-700" : "bg-green-50 text-green-700"
                )}
              >
                {admin ? "Admin Platform" : "Member"}
              </span>
            </div>
            <p className="mt-1.5 flex items-center justify-center gap-1.5 text-sm text-muted sm:justify-start">
              <Mail className="h-3.5 w-3.5" aria-hidden="true" />
              {user.email}
            </p>
            <p className="mt-3 text-xs leading-relaxed text-muted">
              Identitas akun berasal dari profil Google Anda dan dikelola oleh
              Google - KaryaDiaspora tidak menyimpan password.
            </p>
          </div>
        </div>
      </section>

      {/* Ringkasan aktivitas */}
      <section className="grid grid-cols-2 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border border-line bg-white p-4">
            <span className={cn("flex h-10 w-10 items-center justify-center rounded-xl", s.chip)}>
              <s.icon className="h-5 w-5" aria-hidden="true" />
            </span>
            <p className={cn("mt-3 text-2xl font-extrabold", s.value > 0 ? "text-navy" : "text-muted")}>
              {s.value}
            </p>
            <p className="mt-0.5 text-xs font-medium text-muted">{s.label}</p>
          </div>
        ))}
      </section>

      {/* Aksi akun */}
      <section className="rounded-2xl border border-line bg-white p-6">
        <h2 className="font-bold text-navy">Aksi Akun</h2>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Link
            href="/pengajuan"
            className="flex items-center gap-2 rounded-lg border border-line px-5 py-3 text-sm font-semibold text-navy transition hover:bg-surface"
          >
            <UserRound className="h-4.5 w-4.5" aria-hidden="true" />
            Lihat Pengajuan Saya
          </Link>
          <SignOutButton />
        </div>
        <p className="mt-4 text-xs leading-relaxed text-muted">
          Catatan: favorit tersimpan per perangkat (localStorage), sedangkan
          pengajuan produk terikat ke akun Google ini.
        </p>
      </section>
    </div>
  );
}
