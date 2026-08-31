import type { MetadataRoute } from "next";
import { listPublishedForSitemap } from "@/lib/data";
import { SITE_URL } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

/** Sitemap dinamis: halaman statis + semua produk published + profil membernya. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/explore`, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/tentang`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/kontak`, changeFrequency: "monthly", priority: 0.5 },
  ];

  try {
    const products = await listPublishedForSitemap();
    const productEntries: MetadataRoute.Sitemap = products.map((p) => ({
      url: `${SITE_URL}/produk/${p.slug}`,
      lastModified: new Date(p.updatedAt),
      changeFrequency: "weekly",
      priority: 0.8,
    }));
    const memberIds = [...new Set(products.map((p) => p.submittedBy).filter(Boolean))] as string[];
    const memberEntries: MetadataRoute.Sitemap = memberIds.map((id) => ({
      url: `${SITE_URL}/u/${id}`,
      changeFrequency: "weekly",
      priority: 0.4,
    }));
    return [...staticPages, ...productEntries, ...memberEntries];
  } catch {
    // Database gagal - sitemap statis saja lebih baik daripada error 500.
    return staticPages;
  }
}
