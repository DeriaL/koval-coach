export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`bg-card/60 rounded-xl animate-pulse ${className}`} />;
}

export function SkeletonCard({ h = "h-24" }: { h?: string }) {
  return <div className={`card p-4 animate-pulse ${h}`}><Skeleton className="h-3 w-1/3 mb-3" /><Skeleton className="h-6 w-1/2" /></div>;
}

/* Top-of-viewport gradient progress bar — kept as a helper for tight spots. */
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

/* Page loading state — same look as the app splash screen.
   Reuses global @keyframes splash-* defined in layout.tsx so the logo
   pops + pulses, the halo breathes, and the indicator bar slides. */
export function PageSkeleton() {
  return (
    <div className="relative flex flex-col items-center justify-center gap-5 py-24 md:py-36 min-h-[60vh]">
      {/* breathing halo behind the logo */}
      <span
        aria-hidden
        className="absolute pointer-events-none rounded-full blur-3xl"
        style={{
          width: 360,
          height: 360,
          background: "radial-gradient(circle, rgb(var(--accent) / 0.35), transparent 60%)",
          opacity: 0.7,
          animation: "splash-glow 4s ease-in-out infinite",
        }}
      />

      {/* logo bubble */}
      <span
        className="relative grid place-items-center text-white"
        style={{
          width: 84,
          height: 84,
          borderRadius: 24,
          background: "linear-gradient(135deg, rgb(var(--accent2)), rgb(var(--accent)))",
          boxShadow:
            "0 12px 40px -8px rgb(var(--accent) / 0.55), 0 4px 16px -4px rgb(var(--accent2) / 0.45), inset 0 1px 0 rgba(255,255,255,0.18)",
          animation: "splash-pop .6s cubic-bezier(.2,.9,.3,1.4) both, splash-pulse 2.4s ease-in-out infinite .6s",
        }}
      >
        <svg viewBox="0 0 24 24" width="42" height="42" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14.4 14.4 9.6 9.6" />
          <path d="M18.657 21.485a2 2 0 1 1-2.829-2.828l-1.767 1.768a2 2 0 1 1-2.829-2.829l6.364-6.364a2 2 0 1 1 2.829 2.829l-1.768 1.767a2 2 0 1 1 2.828 2.829z" />
          <path d="m21.5 21.5-1.4-1.4" />
          <path d="M3.9 3.9 2.5 2.5" />
          <path d="M6.404 12.768a2 2 0 1 1-2.829-2.829l1.768-1.767a2 2 0 1 1-2.828-2.829l2.828-2.828a2 2 0 1 1 2.829 2.828l1.767-1.768a2 2 0 1 1 2.829 2.829z" />
        </svg>
      </span>

      {/* wordmark */}
      <div
        className="text-3xl font-black tracking-tight"
        style={{ animation: "splash-fade-up .55s ease-out both .15s" }}
      >
        Koval<span className="text-gradient">Fit</span>
      </div>

      {/* sliding indicator bar */}
      <div
        className="relative h-1 w-32 overflow-hidden rounded-full bg-border"
        style={{ animation: "splash-fade-up .55s ease-out both .35s" }}
      >
        <span
          className="absolute inset-y-0 w-2/5 rounded-full"
          style={{
            background: "linear-gradient(90deg, rgb(var(--accent)), rgb(var(--accent2)))",
            animation: "splash-bar 1.2s ease-in-out infinite",
          }}
        />
      </div>
    </div>
  );
}
