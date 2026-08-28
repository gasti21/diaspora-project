import { adminListUsers } from "@/lib/data";
import { MembersView } from "@/components/admin/MembersView";

export const dynamic = "force-dynamic";

/** Kelola semua pengguna platform: daftar member, promote/demote admin. */
export default async function AdminUsersPage() {
  const users = await adminListUsers();
  return <MembersView users={users} />;
}
