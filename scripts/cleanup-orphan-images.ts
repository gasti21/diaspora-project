/**
 * Laporan foto orphan di bucket product-images: file yang ada di Storage
 * tapi tidak dirujuk kolom images di tabel products.
 *
 * Jalankan (butuh SUPABASE_SERVICE_ROLE_KEY + NEXT_PUBLIC_SUPABASE_URL):
 *   npx tsx scripts/cleanup-orphan-images.ts
 *
 * Mode laporan saja (default): TIDAK menghapus apa pun.
 * Hapus manual via Supabase Dashboard setelah review, atau tambahkan --delete.
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error("Butuh NEXT_PUBLIC_SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY di env.");
  process.exit(1);
}
const deleteMode = process.argv.includes("--delete");

const admin = createClient(url, serviceKey);

// 1. Kumpulkan semua URL yang dirujuk DB.
const { data: products, error: dbError } = await admin
  .from("products")
  .select("images");
if (dbError) {
  console.error(dbError.message);
  process.exit(1);
}
const referenced = new Set<string>();
for (const row of products ?? []) {
  for (const imgUrl of (row.images as string[]) ?? []) {
    const marker = "/storage/v1/object/public/product-images/";
    const idx = imgUrl.indexOf(marker);
    if (idx !== -1) referenced.add(imgUrl.slice(idx + marker.length));
  }
}

// 2. Kumpulkan semua file di bucket.
const orphans: string[] = [];
let page = 0;
for (;;) {
  const { data: users, error } = await admin.storage
    .from("product-images")
    .list("", { limit: 1000, offset: page * 1000, sortBy: { column: "name" } });
  if (error) {
    console.error(error.message);
    process.exit(1);
  }
  if (!users || users.length === 0) break;
  for (const folder of users) {
    const { data: files } = await admin.storage
      .from("product-images")
      .list(folder.name, { limit: 1000 });
    for (const f of files ?? []) {
      const path = `${folder.name}/${f.name}`;
      if (!referenced.has(path)) orphans.push(path);
    }
  }
  page++;
}

console.log(`File dirujuk DB : ${referenced.size}`);
console.log(`Orphan ditemukan: ${orphans.length}`);
for (const path of orphans) console.log(`  - ${path}`);

if (deleteMode && orphans.length > 0) {
  const { error } = await admin.storage.from("product-images").remove(orphans);
  if (error) console.error("Gagal menghapus:", error.message);
  else console.log(`${orphans.length} file orphan dihapus.`);
} else if (orphans.length > 0) {
  console.log("\nMode laporan - tidak ada yang dihapus. Tambahkan --delete untuk menghapus.");
}
