export function SkeletonCard() {
  return (
    <div className="obsidian-card overflow-hidden">
      <div className="h-[200px] skeleton-pulse" />
      <div className="p-4 space-y-3">
        <div className="h-4 skeleton-pulse rounded w-3/4" />
        <div className="h-3 skeleton-pulse rounded w-1/2" />
        <div className="flex gap-2 pt-2">
          <div className="h-8 skeleton-pulse rounded flex-1" />
          <div className="h-8 skeleton-pulse rounded flex-1" />
        </div>
      </div>
    </div>
  );
}
