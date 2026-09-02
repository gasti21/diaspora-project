import type { Metadata } from "next";
import { getSessionUser } from "@/lib/auth";
import { getMyProfile } from "@/lib/data";
import { ProfileEditor } from "@/components/member/ProfileEditor";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  description: "Atur profil akun KaryaDiaspora Anda.",
};

/** Profil member: halaman pengaturan profil (identitas tampil di popup avatar). */
export default async function ProfilPage() {
  const user = await getSessionUser();
  if (!user) return null; // guard sesi ada di layout (member)

  const profile = await getMyProfile(user.id);

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-extrabold text-navy">Profil Saya</h1>
        <p className="mt-1 text-sm text-muted">
          Atur foto, nama, dan tautan media sosial Anda - informasi ini tampil
          bersama produk yang Anda ajukan.
        </p>
      </div>

      {profile && <ProfileEditor profile={profile} />}
    </div>
  );
}
