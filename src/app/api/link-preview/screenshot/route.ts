import { NextRequest, NextResponse } from "next/server";

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

// Screenshot landing page via thum.io (tanpa API key) - disajikan same-origin
// agar tidak tertahan CSP img-src.
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

  const shot = `https://image.thum.io/get/width/1200/crop/800/${target.toString()}`;
  try {
    const upstream = await fetch(shot, {
      headers: { "User-Agent": UAH },
      signal: AbortSignal.timeout(25000),
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
    if (buf.byteLength > 4 * 1024 * 1024) {
      return new NextResponse("Too large", { status: 413 });
    }
    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Type": type,
        "Cache-Control": "public, max-age=21600",
      },
    });
  } catch {
    return new NextResponse("Fetch failed", { status: 502 });
  }
}
