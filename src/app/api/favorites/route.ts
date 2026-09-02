import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { listMyFavoriteProductIds } from "@/lib/data";
import { getSessionUser } from "@/lib/auth";

/**
 * GET /api/favorites?ids=id1,id2,... - status favorit banyak produk sekaligus.
 * Satu request per halaman katalog menggantikan N+1 request per kartu.
 */
export async function GET(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Belum masuk." }, { status: 401 });
  const ids = (request.nextUrl.searchParams.get("ids") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 100);
  if (ids.length === 0) return NextResponse.json({ favorited: {} });
  try {
    const favSet = await listMyFavoriteProductIds(user.id);
    const favorited: Record<string, boolean> = {};
    for (const id of ids) favorited[id] = favSet.has(id);
    return NextResponse.json({ favorited });
  } catch {
    return NextResponse.json(
      { error: "Terjadi kesalahan pada server. Silakan coba lagi." },
      { status: 500 }
    );
  }
}
