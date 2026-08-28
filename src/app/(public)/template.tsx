/**
 * Template grup (public) - remount tiap navigasi, jadi konten halaman
 * selalu fade-in halus saat berpindah fitur (navbar & footer tidak ikut fade).
 */
export default function PublicTemplate({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="animate-fade-in">{children}</div>;
}