export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`bg-card/60 rounded-xl animate-pulse ${className}`} />;
}

export function SkeletonCard({ h = "h-24" }: { h?: string }) {
  return <div className={`card p-4 animate-pulse ${h}`}><Skeleton className="h-3 w-1/3 mb-3" /><Skeleton className="h-6 w-1/2" /></div>;
}

/* Top-of-viewport gradient progress bar — shown on every page transition.
   Visually feels like NProgress: a slim animated bar that signals navigation
   without blanking the layout chrome. */
export function TopLoader() {
  return (
    <div className="fixed inset-x-0 top-0 z-[100] h-[3px] overflow-hidden pointer-events-none" aria-hidden>
      <div
        className="h-full w-1/3 rounded-full bg-gradient-to-r from-accent via-accent2 to-accent-soft"
        style={{ animation: "topLoader 1.1s cubic-bezier(.4,0,.2,1) infinite" }}
      />
    </div>
  );
}

/* Minimal, theme-matching page placeholder used by loading.tsx files.
   Renders the top loader bar + a clean header/card stub so the transition
   feels smooth instead of jarring. */
export function PageSkeleton() {
  return (
    <>
      <TopLoader />
      <div className="space-y-4 animate-pulse">
        <Skeleton className="h-7 w-1/3" />
        <Skeleton className="h-3.5 w-1/4" />
        <Skeleton className="h-40 rounded-2xl mt-2" />
        <div className="grid grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-32 rounded-2xl" />
      </div>
    </>
  );
}
