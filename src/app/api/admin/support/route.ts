import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { adminListSupportSessions, adminCountUnreadSupport } from "@/lib/data";
import { getAdminUser } from "@/lib/auth";
import { serverError } from "@/lib/api-error";

/** GET /api/admin/support?tab=active|history - inbox chat support (khusus admin). */
export async function GET(request: NextRequest) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
  const tab = request.nextUrl.searchParams.get("tab") === "history" ? "history" : "active";
  try {
    const [sessions, unreadCount] = await Promise.all([
      adminListSupportSessions(tab),
      adminCountUnreadSupport(),
    ]);
    return NextResponse.json({ sessions, unreadCount });
  } catch (e) {
    return serverError(e, "GET /api/admin/support", "Gagal memuat inbox support.");
  }
}
