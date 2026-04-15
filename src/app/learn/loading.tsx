import { LibrarySkeleton, StatsSkeleton, StudySkeleton } from "@/components/StudySkeleton";

// Next.js renders this synchronously on navigation *before* the client
// bundle is parsed. Zero-JS first paint of the final layout shape.
export default function LearnLoading() {
  return (
    <div className="space-y-10 py-6">
      <StatsSkeleton />
      <StudySkeleton />
      <LibrarySkeleton rows={6} />
    </div>
  );
}
