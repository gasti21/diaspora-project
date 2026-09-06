import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** Geocoding pencarian alamat (server-side, anti-blokir browser). */
export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const q = sp.get("q")?.trim();
  const lat = parseFloat(sp.get("lat") ?? "");
  const lng = parseFloat(sp.get("lng") ?? "");
  if (!q || q.length < 3) {
    return NextResponse.json({ results: [] });
  }
  try {
    // Deteksi negara dari posisi user (cached in-memory per ~10km) supaya hasil
    // pencarian di-bias ke negara user, bukan didominasi lokasi global
    const ccCache = (globalThis as { __geoCcCache?: Map<string, string> }).__geoCcCache ?? new Map<string, string>();
    (globalThis as { __geoCcCache?: Map<string, string> }).__geoCcCache = ccCache;
    const ccKey = Number.isFinite(lat) ? `${lat.toFixed(1)},${lng.toFixed(1)}` : "";
    let cc = ccKey ? ccCache.get(ccKey) ?? "" : "";
    if (ccKey && !cc) {
      try {
        const r = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=3`,
          { headers: { "User-Agent": "KaryaDiaspora/1.0 (contact@karyadiaspora.example)" }, signal: AbortSignal.timeout(6000) }
        );
        if (r.ok) {
          const j = (await r.json()) as { address?: { country_code?: string } };
          cc = j.address?.country_code?.toLowerCase() ?? "";
          if (cc) ccCache.set(ccKey, cc);
        }
      } catch {}
    }

    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("q", q);
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("limit", "8");
    url.searchParams.set("addressdetails", "0");
    if (cc) url.searchParams.set("countrycodes", cc);
    // Tiga tingkat: 1) ketat di sekitar posisi (bounded), 2) satu negara user, 3) dunia
    let nearby: Array<{ lat: string; lon: string; display_name: string; type: string }> = [];
    let countryRes: Array<{ lat: string; lon: string; display_name: string; type: string }> = [];
    let worldRes: Array<{ lat: string; lon: string; display_name: string; type: string }> = [];
    const ua = { "User-Agent": "KaryaDiaspora/1.0 (contact@karyadiaspora.example)" };
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      const d = 1.2; // ~130 km di sekitar posisi
      const nearUrl = new URL(url);
      nearUrl.searchParams.set("viewbox", `${lng - d},${lat + d},${lng + d},${lat - d}`);
      nearUrl.searchParams.set("bounded", "1");
      nearUrl.searchParams.set("limit", "5");
      // Tier dunia tanpa filter negara (jaring pengaman terakhir)
      const worldUrl = new URL(url);
      worldUrl.searchParams.delete("countrycodes");
      const [nearR, ccR, worldR] = await Promise.all([
        fetch(nearUrl, { headers: ua, signal: AbortSignal.timeout(8000) }),
        fetch(url, { headers: ua, signal: AbortSignal.timeout(8000) }),
        fetch(worldUrl, { headers: ua, signal: AbortSignal.timeout(8000) }),
      ]);
      if (nearR.ok) nearby = (await nearR.json()) ?? [];
      if (ccR.ok) countryRes = (await ccR.json()) ?? [];
      if (worldR.ok) worldRes = (await worldR.json()) ?? [];
    } else {
      const worldUrl = new URL(url);
      worldUrl.searchParams.delete("countrycodes");
      const res = await fetch(worldUrl, { headers: ua, signal: AbortSignal.timeout(8000) });
      if (res.ok) worldRes = (await res.json()) ?? [];
    }
    // Tier ranking ala Google Maps: tier-1 dekat (relevansi Nominatim di dalam
    // radius, diurutkan jarak), tier-2 sesenegara (relevansi), tier-3 global.
    // JANGAN sort ulang semua berdasarkan jarak — POI persis-matching di kota
    // lain harus bisa mengalahkan jalan kecil yang sekadar lebih dekat.
    const seen = new Set<string>();
    const toResult = (d: { lat: string; lon: string; display_name: string }) => ({
      lat: parseFloat(d.lat),
      lng: parseFloat(d.lon),
      label: d.display_name,
    });
    const dist = (p: { lat: number; lng: number }) =>
      Number.isFinite(lat) && Number.isFinite(lng)
        ? Math.hypot(p.lat - lat, p.lng - lng)
        : 0;
    const dedupe = (arr: ReturnType<typeof toResult>[]) =>
      arr.filter((r) => {
        const k = `${r.lat.toFixed(4)},${r.lng.toFixed(4)}`;
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      });
    const nearSorted = [...nearby]
      .map(toResult)
      .sort((a, b) => dist(a) - dist(b));
    const results = [
      ...dedupe(nearSorted),
      ...dedupe(countryRes.map(toResult)),
      ...dedupe(worldRes.map(toResult)),
    ];
    return NextResponse.json(
      { results },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    return NextResponse.json({ results: [] });
  }
}
