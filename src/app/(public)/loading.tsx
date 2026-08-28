/**
 * Skeleton loading default untuk grup (public) - dipakai halaman tanpa
 * skeleton spesifik sendiri (home, submit, tentang, kontak).
 */
export default function LoadingPublic() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6" aria-busy="true" aria-label="Memuat halaman">
      <div className="h-10 w-72 max-w-full animate-pulse rounded-lg bg-surface" />
      <div className="mt-3 h-4 w-96 max-w-full animate-pulse rounded bg-surface" />
      <div className="mt-4 h-4 w-2/3 animate-pulse rounded bg-surface" />

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-line bg-white p-6">
            <div className="h-12 w-12 animate-pulse rounded-xl bg-surface" />
            <div className="mt-4 h-5 w-32 animate-pulse rounded bg-surface" />
            <div className="mt-3 h-3 w-full animate-pulse rounded bg-surface" />
            <div className="mt-2 h-3 w-3/4 animate-pulse rounded bg-surface" />
          </div>
        ))}
      </div>

      <div className="mt-10 h-40 animate-pulse rounded-2xl bg-surface" />
    </div>
  );
}