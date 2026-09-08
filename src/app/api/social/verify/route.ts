import { NextRequest, NextResponse } from "next/server";
import { rateLimit, rateLimitKey } from "@/lib/rate-limit";

/**
 * GET /api/social/verify?platform=x&value=... - cek apakah akun sosmed
 * benar-benar ada di platform-nya (fetch halaman profil, cek status HTTP).
 * Hasil: { ok, url, state: "ok" | "not_found" | "unknown" }
 * Best-effort: sebagian platform (Instagram/Facebook) membalas login-wall;
 * state "unknown" untuk kasus itu.
 */
const PLATFORMS: Record<string, { build: (v: string) => string | null }> = {
  instagram: {
    build: (v) => {
      const h = v.replace(/^https?:\/\/(www\.)?instagram\.com\//, "").replace(/[@/]$/g, "").trim();
      return h ? `https://www.instagram.com/${h.replace(/^@/, "")}/` : null;
    },
  },
  linkedin: {
    build: (v) => {
      const m = v.match(/linkedin\.com\/(in|company)\/([\w-]+)/);
      if (m) return `https://www.linkedin.com/${m[1]}/${m[2]}/`;
      const h = v.replace(/^@/, "").replace(/[\s/]/g, "");
      return h ? `https://www.linkedin.com/in/${h}/` : null;
    },
  },
  twitter: {
    build: (v) => {
      const m = v.match(/(?:twitter|x)\.com\/(@?\w{1,15})/);
      if (m) return `https://x.com/${m[1].replace("@", "")}`;
      const h = v.replace(/^@/, "").replace(/[\s/]/g, "");
      return /^[A-Za-z0-9_]{1,15}$/.test(h) ? `https://x.com/${h}` : null;
    },
  },
  facebook: {
    build: (v) => {
      const m = v.match(/facebook\.com\/([\w.\-]+)/);
      if (m && !/^(profile|pages|groups)$/.test(m[1])) return `https://www.facebook.com/${m[1]}/`;
      const h = v.replace(/^@/, "").replace(/[\s/]/g, "");
      return h ? `https://www.facebook.com/${h}/` : null;
    },
  },
  whatsapp: {
    build: (v) => {
      const d = v.replace(/\D/g, "");
      if (d.length < 8) return null;
      const intl = d.startsWith("0") ? `62${d.slice(1)}` : d;
      return `https://wa.me/${intl}`;
    },
  },
};

export async function GET(req: NextRequest) {
  const rl = rateLimit(rateLimitKey(req, null, "social-verify"), 30, 60_000);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Terlalu sering." }, { status: 429 });
  }

  const platform = req.nextUrl.searchParams.get("platform") ?? "";
  const value = req.nextUrl.searchParams.get("value")?.trim() ?? "";
  const builder = PLATFORMS[platform];
  if (!builder || !value) {
    return NextResponse.json({ error: "platform/value tidak valid." }, { status: 400 });
  }

  const url = builder.build(value);
  if (!url) {
    return NextResponse.json({ ok: false, url: null, state: "unknown" });
  }
  if (platform === "whatsapp") {
    // wa.me tidak bisa diverifikasi tanpa API resmi - anggap valid formatnya.
    return NextResponse.json({ ok: true, url, state: "ok" });
  }

  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 7000);
    const res = await fetch(url, {
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36",
        Accept: "text/html",
      },
    });
    clearTimeout(t);
    if (res.status >= 200 && res.status < 400) {
      return NextResponse.json({ ok: true, url, state: "ok" });
    }
    if (res.status === 404 || res.status === 410) {
      return NextResponse.json({ ok: false, url, state: "not_found" });
    }
    // 999 (LinkedIn), login-wall, dsb. - tidak bisa dipastikan.
    return NextResponse.json({ ok: null, url, state: "unknown" });
  } catch {
    return NextResponse.json({ ok: null, url, state: "unknown" });
  }
}
