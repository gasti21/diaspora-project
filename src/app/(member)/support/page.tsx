import type { Metadata } from "next";
import { getSessionUser } from "@/lib/auth";
import { SupportView } from "@/components/support/SupportView";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Chat Support",
  description: "Hubungi tim KaryaDiaspora langsung dari dalam platform.",
};

/** Halaman Chat Support member: sesi percakapan dengan tim admin. */
export default async function SupportPage() {
  const user = await getSessionUser();
  if (!user) return null; // guard sesi ada di layout (member)

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-extrabold text-navy">Chat Support</h1>
        <p className="mt-1 text-sm text-muted">
          Tanyakan apa saja ke tim kami - tanpa keluar dari platform.
        </p>
      </div>
      <SupportView selfId={user.id} />
    </div>
  );
}
