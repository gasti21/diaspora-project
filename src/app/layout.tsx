import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "KaryaDiaspora - Temukan Produk & Karya Diaspora Indonesia",
    template: "%s | KaryaDiaspora",
  },
  description:
    "Platform Konektivitas Bisnis Diaspora Indonesia. Jelajahi produk, bisnis, aplikasi, riset, dan karya kreatif buatan diaspora Indonesia di seluruh dunia.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className={`${inter.variable} font-sans`}>{children}</body>
    </html>
  );
}
