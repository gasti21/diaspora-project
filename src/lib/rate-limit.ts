/**
 * Rate limiter sliding-window sederhana (in-memory).
 * Cukup untuk deployment single-instance; ganti ke Upstash Redis
 * bila nanti menjalankan banyak instance.
 */

interface Window {
  timestamps: number[];
  windowMs: number;
}

const buckets = new Map<string, Window>();

// Bersihkan bucket mati secara berkala agar memori tidak menumpuk.
let lastSweep = Date.now();
function sweep(now: number) {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [key, win] of buckets) {
    if (win.timestamps.length === 0 || now - win.timestamps[win.timestamps.length - 1] > win.windowMs) {
      buckets.delete(key);
    }
  }
}

export interface RateLimitResult {
  allowed: boolean;
  /** Detik sampai boleh lagi (untuk header Retry-After). */
  retryAfterSeconds: number;
  remaining: number;
}

/**
 * Cek apakah aksi dengan key boleh lewat: maks `limit` kali dalam `windowMs`.
 */
export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  sweep(now);

  const win: Window = buckets.get(key) ?? { timestamps: [], windowMs };
  win.timestamps = win.timestamps.filter((t) => now - t < windowMs);

  if (win.timestamps.length >= limit) {
    const oldest = win.timestamps[0];
    buckets.set(key, win);
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((oldest + windowMs - now) / 1000)),
      remaining: 0,
    };
  }

  win.timestamps.push(now);
  buckets.set(key, win);
  return { allowed: true, retryAfterSeconds: 0, remaining: limit - win.timestamps.length };
}

/** Kunci rate limit dari request: pakai userId bila ada, fallback IP. */
export function rateLimitKey(request: { headers: Headers }, userId?: string | null, scope = "") {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";
  return `${scope}:${userId ?? `ip:${ip}`}`;
}
