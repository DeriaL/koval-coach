export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`bg-card/60 rounded-xl animate-pulse ${className}`} />;
}

export function SkeletonCard({ h = "h-24" }: { h?: string }) {
  return <div className={`card p-4 animate-pulse ${h}`}><Skeleton className="h-3 w-1/3 mb-3" /><Skeleton className="h-6 w-1/2" /></div>;
}

export function PageSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-32" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
        {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
        <SkeletonCard h="h-48" />
        <SkeletonCard h="h-48" />
      </div>
    </div>
  );
}
