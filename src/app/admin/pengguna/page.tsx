import { adminListUsers } from "@/lib/data";
import { getAdminUser } from "@/lib/auth";
import { MembersView } from "@/components/admin/MembersView";
import AdminAccessDenied from "@/components/admin/AdminAccessDenied";

export const dynamic = "force-dynamic";

/** Kelola semua pengguna platform: daftar member, promote/demote admin. */
export default async function AdminUsersPage() {
  // Guard page (bukan cuma layout) supaya daftar pengguna tidak bocor.
  if (!(await getAdminUser())) return <AdminAccessDenied />;

  const users = await adminListUsers();
  return <MembersView users={users} />;
}
