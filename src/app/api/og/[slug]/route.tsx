import { ImageResponse } from "next/og";
import { getProductBySlug } from "@/lib/data";

export const contentType = "image/png";

/**
 * OG image dinamis per produk.
 *
 * CATATAN: memakai Route Handler biasa (bukan konvensi file
 * opengraph-image.tsx) karena Next.js saat ini bermasalah dengan metadata
 * route di dalam route group (issue vercel/next.js #96603) - endpoint ini
 * selalu bisa diakses dan dirujuk eksplisit lewat generateMetadata.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const product = await getProductBySlug(slug).catch(() => null);
  const name = product?.name ?? "KaryaDiaspora";
  const category = product?.categoryName ?? "Katalog Diaspora";
  const location = product
    ? [product.city, product.country].filter(Boolean).join(", ")
    : "";
  const image = product?.images?.[0] ?? null;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          background: "linear-gradient(135deg, #16274e 0%, #0b1f3b 100%)",
          padding: 64,
        }}
      >
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt=""
            width={500}
            height={500}
            style={{
              borderRadius: 24,
              objectFit: "cover",
              border: "4px solid rgba(255,255,255,0.15)",
            }}
          />
        ) : (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 500,
              height: 500,
              borderRadius: 24,
              background: "rgba(255,255,255,0.06)",
              fontSize: 160,
            }}
          >
            🎨
          </div>
        )}

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            flex: 1,
            paddingLeft: 56,
            color: "white",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div
              style={{
                display: "flex",
                width: 56,
                height: 56,
                borderRadius: 14,
                background: "#d32f2f",
                transform: "rotate(45deg)",
              }}
            />
            <div style={{ display: "flex", fontSize: 30, fontWeight: 700, opacity: 0.85 }}>
              KaryaDiaspora
            </div>
          </div>

          <div
            style={{
              display: "flex",
              fontSize: name.length > 60 ? 44 : 56,
              fontWeight: 800,
              lineHeight: 1.15,
              marginTop: 28,
            }}
          >
            {name}
          </div>

          <div
            style={{
              display: "flex",
              gap: 14,
              marginTop: 32,
              fontSize: 26,
              opacity: 0.8,
            }}
          >
            <div
              style={{
                display: "flex",
                padding: "8px 20px",
                borderRadius: 999,
                background: "rgba(211,47,47,0.9)",
                color: "white",
                fontWeight: 600,
              }}
            >
              {category}
            </div>
            {location ? (
              <div style={{ display: "flex", padding: "8px 0" }}>{location}</div>
            ) : null}
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
