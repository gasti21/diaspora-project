import { NextRequest, NextResponse } from "next/server";

const ALLOWED_HOSTS = [
  "img.youtube.com",
  "i.ytimg.com",
  "i9.ytimg.com",
  "p16-sign-va.tiktokcdn.com",
  "p19-sign-va.tiktokcdn.com",
  "scontent.cdninstagram.com",
  "www.instagram.com",
  "pbs.twimg.com",
];

const UAH =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

function isPrivateHost(hostname: string) {
  return (
    hostname === "localhost" ||
    hostname === "0.0.0.0" ||
    /^127\./.test(hostname) ||
    /^10\./.test(hostname) ||
    /^192\.168\./.test(hostname) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(hostname) ||
    hostname.endsWith(".local") ||
    hostname.endsWith(".internal")
  );
}

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("url");
  if (!raw) return new NextResponse("Missing url", { status: 400 });

  let target: URL;
  try {
    target = new URL(raw);
  } catch {
    return new NextResponse("Invalid url", { status: 400 });
  }
  if (target.protocol !== "https:" && target.protocol !== "http:") {
    return new NextResponse("Invalid protocol", { status: 400 });
  }
  if (isPrivateHost(target.hostname)) {
    return new NextResponse("Blocked host", { status: 403 });
  }
  // Hanya host CDN yang dikenal agar route tidak dipakai sebagai proxy terbuka.
  const ok =
    ALLOWED_HOSTS.some((h) => target.hostname === h || target.hostname.endsWith("." + h)) ||
    target.hostname.endsWith("ytimg.com") ||
    target.hostname.endsWith("tiktokcdn.com") ||
    target.hostname.endsWith("cdninstagram.com") ||
    target.hostname.endsWith("fbcdn.net") ||
    target.hostname.endsWith("twimg.com");
  if (!ok) return new NextResponse("Host not allowed", { status: 403 });

  try {
    const upstream = await fetch(target.toString(), {
      headers: { "User-Agent": UAH, Referer: target.origin + "/" },
      signal: AbortSignal.timeout(8000),
      cache: "no-store",
    });
    if (!upstream.ok || !upstream.body) {
      return new NextResponse("Upstream error", { status: 502 });
    }
    const type = upstream.headers.get("content-type") ?? "";
    if (!type.startsWith("image/")) {
      return new NextResponse("Not an image", { status: 415 });
    }
    const buf = await upstream.arrayBuffer();
    if (buf.byteLength > 3 * 1024 * 1024) {
      return new NextResponse("Image too large", { status: 413 });
    }
    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Type": type,
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch {
    return new NextResponse("Fetch failed", { status: 502 });
  }
}
