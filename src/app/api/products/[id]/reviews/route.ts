import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getProductReviews, createProductReview, updateMyProductReview, deleteMyProductReview } from "@/lib/data";
import { getSessionUser } from "@/lib/auth";
import {
  REVIEW_MAX_LENGTH,
  MAX_REVIEW_MEDIA,
  REVIEW_RATE_LIMIT,
  REVIEW_RATE_WINDOW_MINUTES,
} from "@/lib/constants";
import { rateLimit, rateLimitKey } from "@/lib/rate-limit";
import { serverError } from "@/lib/api-error";

type RouteContext = { params: Promise<{ id: string }> };

/** Validasi body ulasan bersama untuk POST dan PUT. */
function parseReviewBody(body: {
  rating?: unknown;
  content?: unknown;
  media?: unknown;
}): { rating: number; content: string; media: { type: "image" | "video"; url: string }[] } | { error: string } {
  const rating = Number(body.rating);
  const content = typeof body.content === "string" ? body.content.trim() : "";
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { error: "Rating harus 1-5 bintang." };
  }
  if (content.length < 1 || content.length > REVIEW_MAX_LENGTH) {
    return { error: `Ulasan harus 1-${REVIEW_MAX_LENGTH} karakter.` };
  }

  const media = Array.isArray(body.media) ? body.media : [];
  if (media.length > MAX_REVIEW_MEDIA) {
    return { error: `Maksimal ${MAX_REVIEW_MEDIA} foto/video per ulasan.` };
  }
  const cleanMedia: { type: "image" | "video"; url: string }[] = [];
  for (const m of media) {
    const url = typeof (m as { url?: unknown })?.url === "string" ? (m as { url: string }).url : "";
    const type = (m as { type?: unknown })?.type;
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      return { error: "URL media tidak valid." };
    }
    if (type !== "image" && type !== "video") {
      return { error: "Tipe media tidak valid." };
    }
    cleanMedia.push({ type, url });
  }
  return { rating, content, media: cleanMedia };
}

/** GET /api/products/[id]/reviews - publik, tidak butuh login. */
export async function GET(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  try {
    const reviews = await getProductReviews(id);
    return NextResponse.json({ reviews });
  } catch (e) {
    return serverError(e, "GET /api/products/[id]/reviews", "Gagal memuat ulasan.");
  }
}

/** POST /api/products/[id]/reviews - hanya user login. */
export async function POST(request: NextRequest, context: RouteContext) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Silakan masuk terlebih dahulu." }, { status: 401 });
  }

  const { id } = await context.params;

  const rl = rateLimit(
    rateLimitKey(request, user.id, "review"),
    REVIEW_RATE_LIMIT,
    REVIEW_RATE_WINDOW_MINUTES * 60_000
  );
  if (!rl.allowed) {
    return NextResponse.json(
      { error: `Terlalu sering mengirim ulasan. Coba lagi dalam ${Math.ceil(rl.retryAfterSeconds / 60)} menit.` },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } }
    );
  }

  let body: {
    rating?: unknown;
    content?: unknown;
    media?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body tidak valid." }, { status: 400 });
  }

  const parsed = parseReviewBody(body);
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  try {
    const result = await createProductReview({
      productId: id,
      userId: user.id,
      authorName: user.name,
      authorAvatar: user.avatarUrl ?? null,
      rating: parsed.rating,
      content: parsed.content,
      media: parsed.media,
    });
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 409 });
    }
    return NextResponse.json({ review: result.review }, { status: 201 });
  } catch (e) {
    return serverError(e, "POST /api/products/[id]/reviews", "Gagal menyimpan ulasan.");
  }
}

/** PUT /api/products/[id]/reviews - ubah ulasan milik sendiri. */
export async function PUT(request: NextRequest, context: RouteContext) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Silakan masuk terlebih dahulu." }, { status: 401 });
  }

  const { id } = await context.params;

  let body: {
    rating?: unknown;
    content?: unknown;
    media?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body tidak valid." }, { status: 400 });
  }

  const parsed = parseReviewBody(body);
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  try {
    const result = await updateMyProductReview({
      productId: id,
      userId: user.id,
      rating: parsed.rating,
      content: parsed.content,
      media: parsed.media,
    });
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ review: result.review });
  } catch (e) {
    return serverError(e, "PUT /api/products/[id]/reviews", "Gagal mengubah ulasan.");
  }
}

/** DELETE /api/products/[id]/reviews - hapus ulasan milik sendiri. */
export async function DELETE(_request: NextRequest, context: RouteContext) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Silakan masuk terlebih dahulu." }, { status: 401 });
  }
  const { id } = await context.params;
  try {
    const result = await deleteMyProductReview(id, user.id);
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return serverError(e, "DELETE /api/products/[id]/reviews", "Gagal menghapus ulasan.");
  }
}