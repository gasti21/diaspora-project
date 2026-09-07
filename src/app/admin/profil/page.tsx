import { getAdminUser } from "@/lib/auth";
import { getMyProfile } from "@/lib/data";
import { ProfileEditor } from "@/components/member/ProfileEditor";
import AdminAccessDenied from "@/components/admin/AdminAccessDenied";

export const dynamic = "force-dynamic";

/** Edit profil admin: editor lengkap yang sama dengan member, di dalam chrome admin. */
export default async function AdminProfilePage() {
  const admin = await getAdminUser();
  if (!admin) return <AdminAccessDenied />;

  const profile = await getMyProfile(admin.id);

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-extrabold text-navy">Profil Saya</h1>
        <p className="mt-1 text-sm text-muted">
          Atur foto, nama, bio, dan tautan media sosial akun admin Anda.
        </p>
      </div>
      {profile && <ProfileEditor profile={profile} />}
    </div>
  );
}
