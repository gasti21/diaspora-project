import Link from "next/link";
import { BRAND, BrandIcon } from "@/components/branding/BrandIcon";
import { LogoMark } from "@/components/branding/Logo";
import { getSessionUser } from "@/lib/auth";

export async function Footer() {
  // Menu publik (Tentang/Contact) hanya untuk tamu; member login tidak perlu
  // - kontak admin nanti lewat fitur Support Center.
  const user = await getSessionUser();
  return (
    <footer className="bg-navy-deep text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2.5">
            <LogoMark />
            <span className="text-lg font-extrabold">
              Karya<span className="text-red-400">Diaspora</span>
            </span>
          </div>
          <p className="mt-4 text-justify text-sm leading-relaxed text-white/70">
            Platform terdepan untuk produk dan karya diaspora Indonesia di seluruh
            dunia.
          </p>
        </div>

        <div>
          <h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-white/90">
            Navigasi
          </h4>
          <ul className="space-y-2.5 text-sm text-white/70">
            <li><Link href="/explore" className="transition-colors duration-200 hover:text-white">Explore Produk</Link></li>
            <li><Link href="/submit" className="transition-colors duration-200 hover:text-white">Submit Produk</Link></li>
            {!user && (
              <>
                <li><Link href="/tentang" className="transition-colors duration-200 hover:text-white">Tentang Kami</Link></li>
                <li><Link href="/kontak" className="transition-colors duration-200 hover:text-white">Kontak</Link></li>
              </>
            )}
          </ul>
        </div>

        <div>
          <h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-white/90">
            Kategori
          </h4>
          <ul className="space-y-2.5 text-sm text-white/70">
            <li><Link href="/explore?kategori=makanan-minuman" className="transition-colors duration-200 hover:text-white">Makanan &amp; Minuman</Link></li>
            <li><Link href="/explore?kategori=aplikasi-software" className="transition-colors duration-200 hover:text-white">Aplikasi &amp; Software</Link></li>
            <li><Link href="/explore?kategori=umkm-kerajinan" className="transition-colors duration-200 hover:text-white">UMKM &amp; Kerajinan</Link></li>
            <li><Link href="/explore" className="transition-colors duration-200 hover:text-white">Lainnya</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-white/90">
            Ikuti Kami
          </h4>
          <div className="flex gap-3">
            {[
              { label: "Facebook", path: BRAND.facebook },
              { label: "Instagram", path: BRAND.instagram },
              { label: "LinkedIn", path: BRAND.linkedin },
              { label: "YouTube", path: BRAND.youtube },
            ].map(({ label, path }) => (
              <a
                key={label}
                href="#"
                aria-label={label}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 transition hover:bg-brand"
              >
                <BrandIcon path={path} className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 py-5 text-center text-xs text-white/50">
        © {new Date().getFullYear()} KaryaDiaspora
      </div>
    </footer>
  );
}
