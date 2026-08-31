import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isProductFavorited, toggleFavoriteProduct } from "@/lib/data";
import { getSessionUser } from "@/lib/auth";
import { rateLimit, rateLimitKey } from "@/lib/rate-limit";

/** GET /api/favorites/[productId] - status favorit produk ini untuk user. */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Belum masuk." }, { status: 401 });
  }
  const { productId } = await params;
  try {
    return NextResponse.json({ favorited: await isProductFavorited(user.id, productId) });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

/** POST /api/favorites/[productId] - toggle favorit (butuh login). */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json(
      { error: "Masuk untuk menyimpan favoritmu." },
      { status: 401 }
    );
  }

  // Rate limit: maks 60 toggle per menit (anti-spam klik).
  const rl = rateLimit(rateLimitKey(request, user.id, "fav-toggle"), 60, 60_000);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Terlalu sering. Coba sebentar lagi." }, {
      status: 429,
      headers: { "Retry-After": String(rl.retryAfterSeconds) },
    });
  }

  const { productId } = await params;
  try {
    const result = await toggleFavoriteProduct(user.id, productId);
    if (result.error) return NextResponse.json({ error: result.error }, { status: 400 });
    return NextResponse.json({ favorited: result.favorited });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
