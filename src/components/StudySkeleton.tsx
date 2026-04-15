/**
 * StudySkeleton
 * ─────────────
 * Pure CSS skeletons for the /learn surface. Rendered synchronously on
 * first paint so the Cumulative Layout Shift score stays at 0 and the
 * user sees the eventual layout in <100ms even on a cold navigation.
 */

export function StudySkeleton() {
  return (
    <div aria-label="Loading study session" className="animate-pulse space-y-5">
      {/* Progress strip */}
      <div className="flex items-center justify-between">
        <Bar className="h-4 w-28" />
        <Bar className="h-4 w-20" />
      </div>
      <Bar className="h-1.5 w-full rounded-full" />

      {/* Hero card frame */}
      <div className="mx-auto aspect-[3/4] w-full max-w-md space-y-4 rounded-3xl border border-gray-200 bg-white p-5 shadow-card">
        <div className="flex items-center justify-between">
          <Bar className="h-5 w-24 rounded-full" />
          <Bar className="h-7 w-20 rounded-full" />
        </div>
        <Bar className="aspect-[16/11] w-full rounded-2xl" />
        <div className="space-y-2">
          <Bar className="mx-auto h-10 w-40" />
          <Bar className="mx-auto h-3 w-32" />
        </div>
      </div>

      {/* Grade buttons */}
      <div className="mx-auto grid max-w-md grid-cols-3 gap-2">
        <Bar className="h-12 rounded-2xl" />
        <Bar className="h-12 rounded-2xl" />
        <Bar className="h-12 rounded-2xl" />
      </div>
    </div>
  );
}

export function LibrarySkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div
      aria-label="Loading word library"
      className="grid animate-pulse gap-4 sm:grid-cols-2 lg:grid-cols-3"
    >
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="card space-y-3 p-5">
          <Bar className="h-5 w-24 rounded-full" />
          <Bar className="h-9 w-32" />
          <Bar className="h-3 w-20" />
          <Bar className="h-4 w-40" />
        </div>
      ))}
    </div>
  );
}

export function StatsSkeleton() {
  return (
    <div
      aria-label="Loading stats"
      className="grid animate-pulse gap-4 sm:grid-cols-3"
    >
      {[0, 1, 2].map((i) => (
        <div key={i} className="card space-y-2 p-5">
          <Bar className="h-3 w-16" />
          <Bar className="h-8 w-20" />
        </div>
      ))}
    </div>
  );
}

function Bar({ className = "" }: { className?: string }) {
  return <div className={`rounded bg-gray-200 ${className}`} />;
}
