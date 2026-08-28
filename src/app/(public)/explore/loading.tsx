/** Skeleton loading halaman Explore - meniru layout: judul, search, filter, grid kartu. */
export default function LoadingExplore() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6" aria-busy="true" aria-label="Memuat produk">
      <div className="h-9 w-52 animate-pulse rounded-lg bg-surface" />
      <div className="mt-3 h-4 w-80 max-w-full animate-pulse rounded bg-surface" />

      <div className="mt-6 h-13 w-full animate-pulse rounded-xl bg-surface" />

      <div className="mt-4 flex flex-wrap gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-11 w-32 animate-pulse rounded-xl bg-surface" />
        ))}
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-xl border border-line bg-white">
            <div className="h-48 animate-pulse bg-surface" />
            <div className="space-y-3 p-5">
              <div className="h-5 w-24 animate-pulse rounded-full bg-surface" />
              <div className="h-4 w-40 animate-pulse rounded bg-surface" />
              <div className="h-3 w-full animate-pulse rounded bg-surface" />
              <div className="h-3 w-3/4 animate-pulse rounded bg-surface" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}