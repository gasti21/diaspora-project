import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/supabase/config";

/**
 * robots.txt: mesin pencari bebas meng-crawl halaman publik;
 * area member & panel admin diblokir penuh.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/admin/", "/dashboard", "/pengajuan", "/submit", "/favorit", "/profil", "/login", "/api/"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
