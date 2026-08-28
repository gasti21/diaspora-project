import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ToastProvider } from "@/components/toast/ToastProvider";
import { WelcomeNotifier } from "@/components/toast/WelcomeNotifier";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "KaryaDiaspora",
  description:
    "Platform Konektivitas Bisnis Diaspora Indonesia. Jelajahi produk, bisnis, aplikasi, riset, dan karya kreatif buatan diaspora Indonesia di seluruh dunia.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className={`${inter.variable} font-sans`}>
        <ToastProvider>
          {children}
          <WelcomeNotifier />
        </ToastProvider>
      </body>
    </html>
  );
}
