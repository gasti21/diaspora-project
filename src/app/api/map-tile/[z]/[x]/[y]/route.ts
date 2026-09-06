import { NextRequest, NextResponse } from "next/server";

/**
 * Proxy tile peta (same-origin) agar tidak diblokir browser/ekstensi
 * sebagai request pihak ketiga. Menyajikan tile OpenStreetMap via CARTO.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ z: string; x: string; y: string }> }
) {
  const { z, x, y } = await params;
  const src = _req.nextUrl.searchParams.get("src") === "esri" ? "esri" : "osm";
  const zN = Number(z);
  const xN = Number(x);
  const yN = Number(y.replace(/\.png$/, ""));
  if (
    !Number.isInteger(zN) || zN < 0 || zN > 19 ||
    !Number.isInteger(xN) || xN < 0 || xN >= 2 ** zN ||
    !Number.isInteger(yN) || yN < 0 || yN >= 2 ** zN
  ) {
    return NextResponse.json({ error: "invalid tile" }, { status: 400 });
  }

  // osm = peta jalan; esri = citra satelit resolusi tinggi (via proxy juga,
  // anti-blokir). Perhatikan urutan tile Esri: {z}/{y}/{x}.
  const upstreams =
    src === "esri"
      ? [`https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${zN}/${yN}/${xN}`]
      : [`https://tile.openstreetmap.org/${zN}/${xN}/${yN}.png`];

  for (const url of upstreams) {
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent": "KaryaDiaspora/1.0 (map tile proxy)",
          Accept: "image/png",
        },
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) continue;
      const buf = await res.arrayBuffer();
      if (buf.byteLength < 100) continue;
      return new NextResponse(buf, {
        status: 200,
        headers: {
          "Content-Type": src === "esri" ? "image/jpeg" : "image/png",
          "Cache-Control": "public, max-age=86400, immutable",
        },
      });
    } catch {
      // coba upstream berikutnya
    }
  }
  return NextResponse.json({ error: "tile unavailable" }, { status: 502 });
}