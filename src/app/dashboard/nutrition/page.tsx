import { requireClient } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { EmptyState } from "@/components/ui";
import {
  Apple, Flame, Drumstick, Wheat, Droplet, StickyNote, CheckCircle2, BookOpen,
  Utensils, Replace,
} from "lucide-react";
import Link from "next/link";
import { parsePlanContent, type NutritionPlanData } from "@/lib/nutritionPlan";

export default async function NutritionPage({ searchParams }: { searchParams: { planId?: string } }) {
  const u = await requireClient();
  const plans = await prisma.nutritionPlan.findMany({ where: { clientId: u.id }, orderBy: { updatedAt: "desc" } });

  if (plans.length === 0) {
    return (
      <div className="space-y-6 pb-4">
        <div>
          <h1 className="text-2xl font-bold">Харчування</h1>
          <p className="text-sm text-muted mt-0.5">План скоро зʼявиться тут</p>
        </div>
        <EmptyState icon={Apple} title="План ще не додано" text="Я додам його незабаром" />
      </div>
    );
  }

  const plan = plans.find((p) => p.id === searchParams.planId) ?? plans[0];
  const data = parsePlanContent(plan.content);

  return (
    <div className="space-y-5 pb-6">
      {/* Plan switcher */}
      {plans.length > 1 && (
        <div>
          <div className="text-xs font-semibold text-muted uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Apple className="w-3.5 h-3.5" /> План
          </div>
          <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-thin -mx-1 px-1">
            {plans.map((p) => {
              const active = p.id === plan.id;
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
                  <div className="text-xs text-muted">{p.calories ? `${p.calories} ккал` : "без калорій"}</div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="card p-5 md:p-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="min-w-0">
            <div className="text-xs uppercase tracking-widest text-muted">План харчування</div>
            <h1 className="text-2xl md:text-3xl font-black mt-1 break-words">{plan.title}</h1>
            <p className="text-sm text-muted mt-1.5">Індивідуальний план під твої цілі та активність.</p>
          </div>
          <div className="grid grid-cols-3 gap-2 md:gap-3 md:shrink-0">
            <HeaderChip k="Ціль" v={data?.goal ?? "—"} />
            <HeaderChip k="Фаза" v={data?.phase ?? "—"} />
            <HeaderChip k="Оновлено" v={plan.updatedAt.toLocaleDateString("uk-UA")} />
          </div>
        </div>
      </div>

      {/* Top stats */}
      <StatRow plan={plan} data={data} />

      {data ? (
        <StructuredView data={data} />
      ) : (
        plan.content && (
          <div className="card overflow-hidden">
            <div className="h-[3px] bg-gradient-to-r from-[rgb(var(--accent2))] to-[rgb(var(--accent))]" />
            <div className="p-5">
              <div className="flex items-center gap-2 text-xs font-semibold text-muted uppercase tracking-wider mb-4">
                <BookOpen className="w-3.5 h-3.5 text-accent" /> Меню
              </div>
              <div className="text-sm leading-relaxed whitespace-pre-wrap text-text/90">{plan.content}</div>
            </div>
          </div>
        )
      )}

      {/* Legacy free-form trainer note (old plans) */}
      {plan.notes && (
        <div className="card p-5 border-accent/20 bg-accent/5">
          <div className="flex items-center gap-2 text-xs font-semibold text-accent uppercase tracking-wider mb-2">
            <StickyNote className="w-3.5 h-3.5" /> Нотатка від тренера
          </div>
          <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">{plan.notes}</div>
        </div>
      )}

      <div className="card p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-muted">
        <div>Пийте достатньо води протягом дня та слідкуйте за самопочуттям.</div>
        {data?.waterL && (
          <div className="chip border-accent/30 text-accent shrink-0">💧 {data.waterL} л / день</div>
        )}
      </div>
    </div>
  );
}

/* ───────────────── helpers ───────────────── */

function HeaderChip({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface px-3 py-2 text-center">
      <div className="text-[10px] uppercase tracking-widest text-muted">{k}</div>
      <div className="font-bold text-sm mt-0.5 truncate">{v}</div>
    </div>
  );
}

function StatRow({ plan, data }: { plan: any; data: NutritionPlanData | null }) {
  const meals = data?.meals.length ?? 0;
  const items: { k: string; v: string; sub?: string; Icon: any; color?: string }[] = [
    { k: "Калораж", v: plan.calories ? String(plan.calories) : "—", sub: "kcal", Icon: Flame, color: "text-orange-400" },
    { k: "Білки", v: plan.protein ? String(plan.protein) : "—", sub: "г", Icon: Drumstick, color: "text-accent" },
    { k: "Жири", v: plan.fats ? String(plan.fats) : "—", sub: "г", Icon: Droplet, color: "text-rose-400" },
    { k: "Вуглеводи", v: plan.carbs ? String(plan.carbs) : "—", sub: "г", Icon: Wheat, color: "text-amber-400" },
    { k: "Прийомів їжі", v: meals ? String(meals) : "—", sub: "разів", Icon: Utensils, color: "text-accent2" },
    { k: "Вода", v: data?.waterL ? String(data.waterL) : "—", sub: "л", Icon: Droplet, color: "text-sky-400" },
  ];
  return (
    <div className="grid grid-cols-3 md:grid-cols-6 gap-2 md:gap-3">
      {items.map((i) => (
        <div key={i.k} className="card p-3 md:p-4 text-center">
          <div className={`mx-auto w-7 h-7 md:w-8 md:h-8 rounded-lg bg-accent/10 flex items-center justify-center ${i.color}`}>
            <i.Icon className="w-4 h-4" />
          </div>
          <div className="text-[10px] uppercase tracking-widest text-muted mt-2">{i.k}</div>
          <div className="text-lg md:text-2xl font-black mt-0.5 leading-tight">{i.v}</div>
          {i.sub && <div className="text-[10px] text-muted">{i.sub}</div>}
        </div>
      ))}
    </div>
  );
}

function StructuredView({ data }: { data: NutritionPlanData }) {
  return (
    <div className="space-y-5">
      {data.meals.length > 0 && <MealsBlock data={data} />}
      {data.swaps.length > 0 && <SwapsBlock data={data} />}
      {data.notes.length > 0 && <NotesBlock data={data} />}
    </div>
  );
}

function MealsBlock({ data }: { data: NutritionPlanData }) {
  const totals = data.meals.reduce(
    (a, m) => ({
      protein: a.protein + (m.protein ?? 0),
      fats: a.fats + (m.fats ?? 0),
      carbs: a.carbs + (m.carbs ?? 0),
      calories: a.calories + (m.calories ?? 0),
    }),
    { protein: 0, fats: 0, carbs: 0, calories: 0 }
  );

  return (
    <div className="card overflow-hidden">
      <div className="h-[3px] bg-gradient-to-r from-[rgb(var(--accent))] to-[rgb(var(--accent2))]" />
      <div className="p-4 md:p-5">
        <div className="flex items-center gap-2 text-xs font-semibold text-muted uppercase tracking-wider mb-4">
          <Utensils className="w-3.5 h-3.5 text-accent" /> План харчування
        </div>

        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto -mx-1">
          <table className="w-full text-sm border-separate border-spacing-y-1">
            <thead>
              <tr className="text-[10px] uppercase tracking-widest text-muted">
                <th className="text-left font-semibold pl-3 pr-2 py-2">Прийом їжі</th>
                <th className="text-left font-semibold px-2 py-2">Продукти</th>
                <th className="text-right font-semibold px-2 py-2 w-14">Б (г)</th>
                <th className="text-right font-semibold px-2 py-2 w-14">Ж (г)</th>
                <th className="text-right font-semibold px-2 py-2 w-14">В (г)</th>
                <th className="text-right font-semibold px-2 py-2 w-20">Ккал</th>
              </tr>
            </thead>
            <tbody>
              {data.meals.map((m, i) => (
                <tr key={i} className="bg-surface/60">
                  <td className="rounded-l-xl pl-3 pr-2 py-3 align-top w-44">
                    <div className="flex items-center gap-2">
                      <span className="font-display text-2xl font-black text-accent">{i + 1}</span>
                      <div className="min-w-0">
                        <div className="font-semibold uppercase text-[13px] tracking-wide truncate">{m.name}</div>
                        {m.time && <div className="text-xs text-muted">{m.time}</div>}
                      </div>
                    </div>
                  </td>
                  <td className="px-2 py-3 align-top">
                    <ul className="space-y-1">
                      {m.items.map((it, ii) => (
                        <li key={ii} className="flex justify-between gap-3">
                          <span className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-accent" /> {it.name}</span>
                          <span className="text-muted shrink-0">{it.amount}</span>
                        </li>
                      ))}
                    </ul>
                  </td>
                  <td className="px-2 py-3 align-top text-right tabular-nums">{m.protein ?? "—"}</td>
                  <td className="px-2 py-3 align-top text-right tabular-nums">{m.fats ?? "—"}</td>
                  <td className="px-2 py-3 align-top text-right tabular-nums">{m.carbs ?? "—"}</td>
                  <td className="rounded-r-xl px-2 py-3 align-top text-right tabular-nums font-bold text-accent">{m.calories ?? "—"}</td>
                </tr>
              ))}
              <tr className="text-sm">
                <td className="pl-3 pr-2 py-3 font-semibold uppercase text-xs tracking-widest text-muted">Разом за день</td>
                <td className="px-2 py-3" />
                <td className="px-2 py-3 text-right font-bold tabular-nums">{totals.protein}</td>
                <td className="px-2 py-3 text-right font-bold tabular-nums">{totals.fats}</td>
                <td className="px-2 py-3 text-right font-bold tabular-nums">{totals.carbs}</td>
                <td className="px-2 py-3 text-right font-black text-accent tabular-nums">{totals.calories}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden space-y-3">
          {data.meals.map((m, i) => (
            <div key={i} className="rounded-2xl border border-border bg-surface/60 p-4">
              <div className="flex items-center gap-3">
                <span className="h-9 w-9 rounded-xl accent-shine grid place-items-center text-white font-black shrink-0">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold uppercase text-sm tracking-wide truncate">{m.name}</div>
                  {m.time && <div className="text-xs text-muted">{m.time}</div>}
                </div>
                {m.calories != null && (
                  <div className="text-right shrink-0">
                    <div className="font-black text-accent text-lg leading-none">{m.calories}</div>
                    <div className="text-[10px] text-muted uppercase">ккал</div>
                  </div>
                )}
              </div>
              <ul className="mt-3 space-y-1.5 text-sm">
                {m.items.map((it, ii) => (
                  <li key={ii} className="flex justify-between gap-3">
                    <span className="flex items-center gap-2 min-w-0"><span className="w-1 h-1 rounded-full bg-accent shrink-0" /> <span className="truncate">{it.name}</span></span>
                    <span className="text-muted shrink-0 tabular-nums">{it.amount}</span>
                  </li>
                ))}
              </ul>
              {(m.protein != null || m.fats != null || m.carbs != null) && (
                <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                  <Mini label="Б" v={m.protein} />
                  <Mini label="Ж" v={m.fats} />
                  <Mini label="В" v={m.carbs} />
                </div>
              )}
            </div>
          ))}
          {/* Totals on mobile */}
          <div className="rounded-2xl border border-accent/30 bg-accent/5 p-4">
            <div className="text-[10px] uppercase tracking-widest text-muted mb-2">Разом за день</div>
            <div className="grid grid-cols-4 gap-2 text-center">
              <Mini label="Б" v={totals.protein} />
              <Mini label="Ж" v={totals.fats} />
              <Mini label="В" v={totals.carbs} />
              <Mini label="Ккал" v={totals.calories} accent />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Mini({ label, v, accent }: { label: string; v?: number; accent?: boolean }) {
  return (
    <div className="rounded-lg border border-border bg-bg/40 py-2 px-1">
      <div className="text-[10px] uppercase tracking-widest text-muted">{label}</div>
      <div className={`text-base font-bold tabular-nums ${accent ? "text-accent" : ""}`}>{v ?? "—"}</div>
    </div>
  );
}

function SwapsBlock({ data }: { data: NutritionPlanData }) {
  return (
    <div className="card p-4 md:p-5">
      <div className="flex items-center gap-2 text-xs font-semibold text-muted uppercase tracking-wider mb-3">
        <Replace className="w-3.5 h-3.5 text-accent" /> Заміни продуктів
      </div>
      <div className="overflow-hidden rounded-xl border border-border">
        <div className="grid grid-cols-2 text-[10px] uppercase tracking-widest text-muted bg-surface/60 px-3 py-2">
          <div>Можна замінити</div>
          <div>На</div>
        </div>
        <div className="divide-y divide-border">
          {data.swaps.map((s, i) => (
            <div key={i} className="grid grid-cols-2 px-3 py-2.5 text-sm">
              <div className="break-words">{s.from || "—"}</div>
              <div className="break-words">{s.to || "—"}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function NotesBlock({ data }: { data: NutritionPlanData }) {
  return (
    <div className="card p-4 md:p-5 border-accent/20 bg-accent/5">
      <div className="flex items-center gap-2 text-xs font-semibold text-accent uppercase tracking-wider mb-3">
        <StickyNote className="w-3.5 h-3.5" /> Нотатки тренера
      </div>
      <ul className="space-y-2 text-sm">
        {data.notes.map((n, i) => (
          <li key={i} className="flex items-start gap-2">
            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
            <span className="break-words">{n}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
