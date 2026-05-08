import { requireClient } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { EmptyState } from "@/components/ui";
import { Apple, Flame, Drumstick, Wheat, Droplet, StickyNote, CheckCircle2, BookOpen } from "lucide-react";
import Link from "next/link";

export default async function NutritionPage({ searchParams }: { searchParams: { planId?: string } }) {
  const u = await requireClient();
  const plans = await prisma.nutritionPlan.findMany({ where: { clientId: u.id }, orderBy: { updatedAt: "desc" } });

  if (plans.length === 0) {
    return (
      <div className="space-y-6 pb-4">
        <div>
          <h1 className="text-2xl font-bold">Харчування</h1>
          <p className="text-sm text-muted mt-0.5">Plan скоро зʼявиться тут</p>
        </div>
        <EmptyState icon={Apple} title="План ще не додано" text="Я додам його незабаром" />
      </div>
    );
  }

  const plan = plans.find((p) => p.id === searchParams.planId) ?? plans[0];

  return (
    <div className="space-y-6 pb-4">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Харчування</h1>
          <p className="text-sm text-muted mt-0.5">План, який я склав для тебе</p>
        </div>
      </div>

      {/* ── Plan selector (if > 1) ── */}
      {plans.length > 1 && (
        <div>
          <div className="text-xs font-semibold text-muted uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Apple className="w-3.5 h-3.5" /> План
          </div>
          <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-thin -mx-1 px-1">
            {plans.map((p) => {
              const active = p.id === plan?.id;
              return (
                <Link
                  key={p.id}
                  href={`/dashboard/nutrition?planId=${p.id}`}
                  className={[
                    "flex-shrink-0 rounded-2xl border p-4 min-w-[180px] max-w-[220px] transition-all",
                    active
                      ? "border-accent bg-accent/10 shadow-[0_0_24px_-6px_rgb(var(--accent)/0.4)]"
                      : "border-border bg-card/80 hover:border-accent/40",
                  ].join(" ")}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="font-semibold text-sm leading-snug line-clamp-2">{p.title}</div>
                    {active && <CheckCircle2 className="w-4 h-4 text-accent shrink-0 mt-0.5" />}
                  </div>
                  <div className="text-xs text-muted">
                    {p.calories ? `${p.calories} ккал` : "без калорій"}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Plan title (single) ── */}
      {plans.length === 1 && (
        <div className="flex items-center gap-3 flex-wrap">
          <div className="chip font-semibold">{plan.title}</div>
          <div className="text-xs text-muted">
            Оновлено {plan.updatedAt.toLocaleDateString("uk-UA")}
          </div>
        </div>
      )}

      {/* ── Macros ── */}
      {(plan.calories || plan.protein || plan.carbs || plan.fats) && (
        <div className="card overflow-hidden">
          <div className="h-[3px] bg-gradient-to-r from-[rgb(var(--accent))] to-[rgb(var(--accent2))]" />
          <div className="p-5">
            <div className="text-xs font-semibold text-muted uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-accent" /> КБЖУ на день
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {plan.calories && <Macro icon={Flame} label="Калорії" value={plan.calories} unit="ккал" color="accent" />}
              {plan.protein && <Macro icon={Drumstick} label="Білки" value={plan.protein} unit="г" color="accent2" />}
              {plan.carbs && <Macro icon={Wheat} label="Вуглеводи" value={plan.carbs} unit="г" />}
              {plan.fats && <Macro icon={Droplet} label="Жири" value={plan.fats} unit="г" />}
            </div>
          </div>
        </div>
      )}

      {/* ── Content / Menu ── */}
      {plan.content && (
        <div className="card overflow-hidden">
          <div className="h-[3px] bg-gradient-to-r from-[rgb(var(--accent2))] to-[rgb(var(--accent))]" />
          <div className="p-5">
            <div className="flex items-center gap-2 text-xs font-semibold text-muted uppercase tracking-wider mb-4">
              <BookOpen className="w-3.5 h-3.5 text-accent" /> Меню
            </div>
            <div className="text-sm leading-relaxed whitespace-pre-wrap text-text/90">
              {plan.content}
            </div>
          </div>
        </div>
      )}

      {/* ── Notes ── */}
      {plan.notes && (
        <div className="card p-5 border-accent/20 bg-accent/5">
          <div className="flex items-center gap-2 text-xs font-semibold text-accent uppercase tracking-wider mb-2">
            <StickyNote className="w-3.5 h-3.5" /> Нотатка від тренера
          </div>
          <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">{plan.notes}</div>
        </div>
      )}
    </div>
  );
}

function Macro({ icon: Icon, label, value, unit, color }: { icon: any; label: string; value: number; unit: string; color?: string }) {
  const colorCls = color === "accent"
    ? "text-accent border-accent/25 bg-accent/8"
    : color === "accent2"
    ? "text-accent2 border-accent2/25 bg-accent2/8"
    : "";
  return (
    <div className={`p-4 rounded-xl border ${colorCls || "border-border bg-surface"}`}>
      <div className={`flex items-center gap-1.5 text-[11px] uppercase tracking-wider mb-1.5 ${color ? (color === "accent" ? "text-accent" : "text-accent2") : "text-muted"}`}>
        <Icon className="w-3.5 h-3.5" /> {label}
      </div>
      <div className="text-xl font-black">
        {value} <span className="text-sm text-muted font-normal">{unit}</span>
      </div>
    </div>
  );
}
