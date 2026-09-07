import { NextRequest, NextResponse } from "next/server";
import { rateLimit, rateLimitKey } from "@/lib/rate-limit";

/**
 * GET /api/link-preview?url= - ambil metadata og:image/og:title dari sebuah
 * URL (server-side; og meta tidak bisa dibaca dari browser karena CORS).
 * Mendukung YouTube (thumbnail langsung), TikTok, Instagram, Facebook, dan
 * situm apa pun yang punya tag og:image. Hasil di-cache 1 jam.
 */
export async function GET(req: NextRequest) {
  const rl = rateLimit(rateLimitKey(req, null, "link-preview"), 30, 60_000);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Terlalu sering." }, { status: 429 });
  }

  const raw = req.nextUrl.searchParams.get("url")?.trim();
  if (!raw) return NextResponse.json({ error: "url wajib" }, { status: 400 });
  let target: URL;
  try {
    target = new URL(raw.startsWith("http") ? raw : `https://${raw}`);
  } catch {
    return NextResponse.json({ error: "url tidak valid" }, { status: 400 });
  }
  if (!/^https?:$/.test(target.protocol)) {
    return NextResponse.json({ error: "url tidak valid" }, { status: 400 });
  }

  // Anti-SSRF: tolak host internal/privat (localhost, IP privat, link-local,
  // metadata cloud) - konsisten dengan guard di route screenshot & image.
  const host = target.hostname.toLowerCase();
  const isPrivate =
    host === "localhost" ||
    host.endsWith(".local") ||
    host.endsWith(".internal") ||
    host === "metadata.google.internal" ||
    /^(10|127)\./.test(host) ||
    /^169\.254\./.test(host) ||
    /^192\.168\./.test(host) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(host) ||
    host === "0.0.0.0" ||
    host === "[::1]";
  if (isPrivate) {
    return NextResponse.json({ error: "Host tidak diizinkan." }, { status: 403 });
  }

  // YouTube: thumbnail bisa langsung dibentuk tanpa scraping
  const yt = raw.match(
    /(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{6,})/
  );
  if (yt) {
    return NextResponse.json(
      {
        image: `https://img.youtube.com/vi/${yt[1]}/hqdefault.jpg`,
        title: "Video YouTube",
        host: target.hostname.replace(/^www\./, ""),
      },
      { headers: { "Cache-Control": "public, max-age=3600" } }
    );
  }

  // TikTok: og:image hanya dirender via JS - pakai oEmbed resminya
  if (/tiktok\.com\//.test(raw)) {
    try {
      const oe = await fetch(
        `https://www.tiktok.com/oembed?url=${encodeURIComponent(target.toString())}`,
        { signal: AbortSignal.timeout(8000) }
      );
      if (oe.ok) {
        const j = (await oe.json()) as {
          thumbnail_url?: string;
          title?: string;
          author_name?: string;
        };
        return NextResponse.json(
          {
            image: j.thumbnail_url ?? null,
            title: j.title || j.author_name || "Video TikTok",
            host: "tiktok.com",
          },
          { headers: { "Cache-Control": "public, max-age=3600" } }
        );
      }
    } catch {
      // lanjut ke scraping umum di bawah
    }
  }

  try {
    const res = await fetch(target.toString(), {
      headers: {
        // UA browser agar og:image tetap disajikan oleh platform sosmed
        "User-Agent":
          "Mozilla/5.0 (compatible; KaryaDiasporaLinkPreview/1.0; +https://karyadiaspora.example)",
        Accept: "text/html,application/json",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`status ${res.status}`);

    // Batasi pembacaan body (cukup bagian <head>) agar hemat bandwidth.
    const reader = res.body?.getReader();
    let html = "";
    if (reader) {
      const decoder = new TextDecoder();
      while (html.length < 200_000) {
        const { done, value } = await reader.read();
        if (done) break;
        html += decoder.decode(value, { stream: true });
      }
      await reader.cancel();
    } else {
      html = await res.text();
    }

    const meta = (prop: string) => {
      const m =
        html.match(
          new RegExp(`<meta[^>]+(?:property|name)=["']${prop}["'][^>]+content=["']([^"']+)`, "i")
        ) ||
        html.match(
          new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${prop}["']`, "i")
        );
      return m?.[1] ?? "";
    };

    const image = meta("og:image") || meta("twitter:image");
    const title =
      meta("og:title") || html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] || "";
    const host = target.hostname.replace(/^www\./, "");

    return NextResponse.json(
      { image: image || null, title: title.trim(), host },
      { headers: { "Cache-Control": "public, max-age=3600" } }
    );
  } catch {
    return NextResponse.json(
      { image: null, title: "", host: target.hostname.replace(/^www\./, "") },
      { headers: { "Cache-Control": "public, max-age=600" } }
    );
  }
}
