/** Skeleton loading dashboard admin - meniru layout: kartu statistik + tabel. */
export default function LoadingAdmin() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6" aria-busy="true" aria-label="Memuat dashboard">
      <div className="h-8 w-48 animate-pulse rounded-lg bg-surface" />
      <div className="mt-2 h-4 w-72 max-w-full animate-pulse rounded bg-surface" />

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-line bg-white p-6">
            <div className="h-3 w-20 animate-pulse rounded bg-surface" />
            <div className="mt-3 h-8 w-14 animate-pulse rounded-lg bg-surface" />
          </div>
        ))}
      </div>

      <div className="mt-8 overflow-hidden rounded-2xl border border-line bg-white">
        <div className="space-y-4 border-b border-line p-5">
          <div className="h-5 w-40 animate-pulse rounded bg-surface" />
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 border-b border-line px-5 py-4 last:border-b-0">
            <div className="h-10 w-10 shrink-0 animate-pulse rounded-lg bg-surface" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-1/3 animate-pulse rounded bg-surface" />
              <div className="h-3 w-1/4 animate-pulse rounded bg-surface" />
            </div>
            <div className="h-6 w-20 animate-pulse rounded-full bg-surface" />
          </div>
        ))}
      </div>
    </div>
  );
}