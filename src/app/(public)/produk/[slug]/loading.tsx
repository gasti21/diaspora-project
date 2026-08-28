/** Skeleton loading halaman detail produk - meniru layout: galeri, info, tabs. */
export default function LoadingProductDetail() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6" aria-busy="true" aria-label="Memuat produk">
      <div className="h-4 w-40 animate-pulse rounded bg-surface" />

      <div className="mt-6 grid gap-8 lg:grid-cols-2">
        <div className="h-80 animate-pulse rounded-2xl bg-surface" />
        <div className="space-y-4">
          <div className="flex gap-2">
            <div className="h-6 w-28 animate-pulse rounded-full bg-surface" />
            <div className="h-6 w-24 animate-pulse rounded-full bg-surface" />
          </div>
          <div className="h-8 w-3/4 animate-pulse rounded-lg bg-surface" />
          <div className="h-4 w-36 animate-pulse rounded bg-surface" />
          <div className="space-y-2 pt-2">
            <div className="h-3 w-full animate-pulse rounded bg-surface" />
            <div className="h-3 w-11/12 animate-pulse rounded bg-surface" />
            <div className="h-3 w-4/5 animate-pulse rounded bg-surface" />
          </div>
          <div className="h-12 w-full animate-pulse rounded-lg bg-surface" />
        </div>
      </div>

      <div className="mt-10 border-b border-line pb-3">
        <div className="flex gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-4 w-24 animate-pulse rounded bg-surface" />
          ))}
        </div>
      </div>
      <div className="mt-6 h-48 animate-pulse rounded-xl bg-surface" />
    </div>
  );
}