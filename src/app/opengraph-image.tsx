import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "KaryaDiaspora - Platform Konektivitas Bisnis Diaspora Indonesia";

/** OG image default situs: branding + tagline (dipakai halaman tanpa OG sendiri). */
export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #16274e 0%, #0b1f3b 100%)",
          color: "white",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <div
            style={{
              width: 88,
              height: 88,
              borderRadius: 20,
              background: "#d32f2f",
              transform: "rotate(45deg)",
            }}
          />
          <div style={{ display: "flex", fontSize: 72, fontWeight: 800 }}>
            Karya<span style={{ color: "#ef5350" }}>Diaspora</span>
          </div>
        </div>
        <div style={{ display: "flex", marginTop: 40, fontSize: 34, opacity: 0.85 }}>
          Platform Konektivitas Bisnis Diaspora Indonesia
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 28,
            padding: "12px 32px",
            borderRadius: 999,
            background: "rgba(255,255,255,0.1)",
            border: "1px solid rgba(255,255,255,0.2)",
            fontSize: 24,
          }}
        >
          Temukan karya diaspora dari seluruh dunia
        </div>
      </div>
    ),
    size
  );
}
