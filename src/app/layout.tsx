import type { Metadata } from "next";
import type { Viewport } from "next";
import { Inter } from "next/font/google";
import { ToastProvider } from "@/components/toast/ToastProvider";
import { RouteProgress } from "@/components/layout/RouteProgress";
import { WelcomeNotifier } from "@/components/toast/WelcomeNotifier";
import { Analytics } from "@vercel/analytics/react";
import { SITE_URL } from "@/lib/supabase/config";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });

export const metadata: Metadata = {
  manifest: "/manifest.json",
  metadataBase: new URL(SITE_URL),
  title: {
    default: "KaryaDiaspora",
    template: "%s - KaryaDiaspora",
  },
  description:
    "Platform Konektivitas Bisnis Diaspora Indonesia. Jelajahi produk, bisnis, aplikasi, riset, dan karya kreatif buatan diaspora Indonesia di seluruh dunia.",
};

export const viewport: Viewport = {
  themeColor: "#0f1e3d",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className={`${inter.variable} font-sans`}>
        <ToastProvider>
          <RouteProgress />
          {children}
          <WelcomeNotifier />
        </ToastProvider>
        <Analytics />
      </body>
    </html>
  );
}
