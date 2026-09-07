/** Skeleton loading halaman profil admin. */
export default function LoadingAdminProfile() {
  return (
    <div className="max-w-3xl space-y-6" aria-busy="true" aria-label="Memuat profil">
      <div className="h-6 w-40 animate-pulse rounded-lg bg-surface" />
      <div className="h-3 w-72 animate-pulse rounded bg-surface" />
      <div className="space-y-4 rounded-2xl border border-line bg-white p-6">
        <div className="h-20 w-20 animate-pulse rounded-full bg-surface" />
        <div className="h-4 w-1/3 animate-pulse rounded bg-surface" />
        <div className="h-10 w-full animate-pulse rounded-lg bg-surface" />
        <div className="h-10 w-full animate-pulse rounded-lg bg-surface" />
        <div className="h-20 w-full animate-pulse rounded-lg bg-surface" />
      </div>
    </div>
  );
}
