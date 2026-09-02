import type { Metadata } from "next";
import { getAdminUser } from "@/lib/auth";
import AdminAccessDenied from "@/components/admin/AdminAccessDenied";
import { SupportInbox } from "@/components/admin/SupportInbox";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Chat Support" };

/** Inbox chat support: admin membalas pesan member dari sini. */
export default async function AdminSupportPage() {
  const admin = await getAdminUser();
  if (!admin) return <AdminAccessDenied />;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-extrabold text-navy">Chat Support</h1>
        <p className="mt-1 text-sm text-muted">
          Balas pertanyaan member. Sesi tanpa aktivitas 48 jam ditutup otomatis.
        </p>
      </div>
      <SupportInbox selfId={admin.id} />
    </div>
  );
}
