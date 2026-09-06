import { NextRequest, NextResponse } from "next/server";

/**
 * Proxy reverse geocoding (same-origin) - dipanggil server sehingga tidak
 * kena blokir ekstensi/setelan browser terhadap API pihak ketiga.
 * Provider berantai: Nominatim (OSM) -> BigDataCloud.
 */
export async function GET(req: NextRequest) {
  const lat = Number(req.nextUrl.searchParams.get("lat"));
  const lon = Number(req.nextUrl.searchParams.get("lon"));
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) {
    return NextResponse.json({ error: "invalid coordinates" }, { status: 400 });
  }

  type Loc = { country: string; city: string };

  const providers: Array<() => Promise<Loc>> = [
    // 1) Nominatim (OpenStreetMap)
    async () => {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=jsonv2&accept-language=id&zoom=10`,
        {
          headers: {
            "User-Agent": "KaryaDiaspora/1.0 (reverse geocode proxy)",
            Accept: "application/json",
          },
          signal: AbortSignal.timeout(8000),
        }
      );
      if (!res.ok) throw new Error(`nominatim ${res.status}`);
      const json = (await res.json()) as {
        address?: Record<string, string | undefined>;
      };
      const a = json.address ?? {};
      return {
        country: a.country ?? "",
        city:
          a.city || a.town || a.village || a.county || a.state_district || a.state || "",
      };
    },
    // 2) BigDataCloud
    async () => {
      const res = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=id`,
        { signal: AbortSignal.timeout(8000) }
      );
      if (!res.ok) throw new Error(`bdc ${res.status}`);
      const json = (await res.json()) as {
        countryName?: string;
        city?: string;
        locality?: string;
        principalSubdivision?: string;
      };
      return {
        country: json.countryName ?? "",
        city: json.city || json.locality || json.principalSubdivision || "",
      };
    },
  ];

  let lastErr: unknown = null;
  for (const provider of providers) {
    try {
      const loc = await provider();
      if (loc.country || loc.city) {
        return NextResponse.json(loc, {
          headers: { "Cache-Control": "public, max-age=3600" },
        });
      }
    } catch (err) {
      lastErr = err;
    }
  }
  console.error("[geocode/reverse] semua provider gagal:", lastErr);
  return NextResponse.json({ error: "geocode unavailable" }, { status: 502 });
}
