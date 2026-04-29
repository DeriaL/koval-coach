import { LucideIcon } from "lucide-react";

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 mb-6 animate-fade-down">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
          {(() => {
            const s = String(title);
            const parts = s.split(/(\p{Extended_Pictographic}+)/gu).filter(Boolean);
            const isEmoji = (p: string) => /^\p{Extended_Pictographic}+$/u.test(p);
            return parts.map((p, i) => isEmoji(p)
              ? <span key={i}>{p}</span>
              : <span key={i} className="text-gradient">{p}</span>);
          })()}
        </h1>
        {subtitle && <p className="text-muted mt-1 text-sm md:text-base">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Stat({ icon: Icon, label, value, sub, accent }: {
  icon: LucideIcon; label: string; value: string | number; sub?: string; accent?: boolean;
}) {
  return (
    <div className={`card p-5 card-hover ${accent ? "border-accent/40 shadow-glow" : ""}`}>
      <div className="flex items-center gap-2 text-muted text-xs uppercase tracking-wider">
        <Icon className="w-4 h-4" /> {label}
      </div>
      <div className="mt-2 text-2xl font-bold">{value}</div>
      {sub && <div className="text-xs text-muted mt-1">{sub}</div>}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, text }: { icon: LucideIcon; title: string; text?: string }) {
  return (
    <div className="card p-10 text-center animate-pop">
      <div className="inline-flex w-16 h-16 items-center justify-center rounded-2xl accent-shine text-white mx-auto mb-3">
        <Icon className="w-7 h-7" />
      </div>
      <div className="mt-1 font-semibold">{title}</div>
      {text && <div className="text-muted text-sm mt-1">{text}</div>}
    </div>
  );
}
