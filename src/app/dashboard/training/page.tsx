import { requireClient } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { EmptyState } from "@/components/ui";
import { Dumbbell, StickyNote, CheckCircle2, CalendarDays, Layers, Clock, ChevronRight, BookOpen } from "lucide-react";
import Link from "next/link";

const DAY_ORDER = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Нд"];

function pluralExercise(n: number) {
  if (n === 1) return "вправа";
  if (n < 5) return "вправи";
  return "вправ";
}

export default async function TrainingPage({ searchParams }: { searchParams: { planId?: string } }) {
  const u = await requireClient();
  const [plans, recent] = await Promise.all([
    prisma.trainingPlan.findMany({
      where: { clientId: u.id },
      include: { exercises: { orderBy: [{ day: "asc" }, { order: "asc" }] } },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.workoutLog.findMany({
      where: { clientId: u.id },
      orderBy: { date: "desc" },
      take: 8,
    }),
  ]);

  if (plans.length === 0) {
    return (
      <div className="space-y-6 pb-4">
        <div>
          <h1 className="text-2xl font-bold">Програма</h1>
          <p className="text-sm text-muted mt-0.5">Твій тренувальний план</p>
        </div>
        <EmptyState icon={Dumbbell} title="Програму ще не додано" text="Я додам її незабаром" />
      </div>
    );
  }

  const plan = plans.find((p) => p.id === searchParams.planId) ?? plans[0];

  // Group exercises by day
  const days: Record<string, typeof plan.exercises> = {};
  plan.exercises.forEach((e) => { (days[e.day] ||= []).push(e); });
  const sortedDays = Object.entries(days).sort(
    ([a], [b]) => (DAY_ORDER.indexOf(a) ?? 99) - (DAY_ORDER.indexOf(b) ?? 99)
  );

  const hasExercises = plan.exercises.length > 0;

  return (
    <div className="space-y-6 pb-4">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Програма</h1>
          <p className="text-sm text-muted mt-0.5">Твій тренувальний план від тренера</p>
        </div>
        {plan.daysPerWeek && (
          <div className="hidden sm:flex items-center gap-2 chip">
            <CalendarDays className="w-3.5 h-3.5 text-accent" />
            <span>{plan.daysPerWeek}× на тиждень</span>
          </div>
        )}
      </div>

      {/* ── Plan selector (if > 1) ── */}
      {plans.length > 1 && (
        <div>
          <div className="text-xs font-semibold text-muted uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5" /> Програма
          </div>
          <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-thin -mx-1 px-1">
            {plans.map((p) => {
              const active = p.id === plan?.id;
              const exCount = p.exercises.length;
              return (
                <Link
                  key={p.id}
                  href={`/dashboard/training?planId=${p.id}`}
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
                    {p.daysPerWeek ? `${p.daysPerWeek} дні/тиж · ` : ""}{exCount > 0 ? `${exCount} ${pluralExercise(exCount)}` : "опис"}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Plan title chip (if single plan) ── */}
      {plans.length === 1 && (
        <div className="flex items-center gap-3 flex-wrap">
          <div className="chip font-semibold">{plan.title}</div>
          {plan.daysPerWeek && (
            <div className="chip text-xs sm:hidden">
              <CalendarDays className="w-3 h-3 text-accent" />
              {plan.daysPerWeek}× на тиждень
            </div>
          )}
          {hasExercises && (
            <div className="chip text-xs">
              <Dumbbell className="w-3 h-3 text-accent" />
              {plan.exercises.length} {pluralExercise(plan.exercises.length)}
            </div>
          )}
        </div>
      )}

      {/* ── Exercise day blocks ── */}
      {hasExercises ? (
        <div className="space-y-3">
          {sortedDays.map(([day, exs]) => (
            <div key={day} className="card overflow-hidden">
              {/* Accent top strip */}
              <div className="h-[3px] bg-gradient-to-r from-[rgb(var(--accent))] to-[rgb(var(--accent2))]" />

              <div className="p-5">
                {/* Day header */}
                <div className="flex items-center gap-3">
                  <span className="shrink-0 text-xs font-bold px-3 py-1.5 rounded-lg bg-accent/10 text-accent border border-accent/25 tracking-widest uppercase">
                    {day}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="font-bold leading-tight">
                      {exs.length} {pluralExercise(exs.length)}
                    </div>
                    <div className="text-xs text-muted mt-0.5">
                      {exs.reduce((s: number, e: any) => s + (e.targetSets ?? 3), 0)} підходів
                    </div>
                  </div>
                </div>

                {/* Exercise list */}
                <div className="mt-4 space-y-0">
                  {exs.map((e, i) => (
                    <div
                      key={e.id}
                      className="flex items-center gap-3 py-2.5 border-b border-border/40 last:border-0"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <span className="shrink-0 w-5 h-5 rounded-full bg-surface border border-border text-[10px] font-bold flex items-center justify-center text-muted">
                          {i + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <span className="text-sm truncate block">{e.name}</span>
                          {e.notes && (
                            <span className="text-[10px] text-muted truncate block">{e.notes}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {e.restSec && e.restSec !== 90 && (
                          <span className="chip text-[10px] py-0.5 px-1.5 font-mono text-muted">
                            {e.restSec}с
                          </span>
                        )}
                        <span className="chip text-xs font-mono">
                          {e.targetSets}×{e.targetReps}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* ── Fallback: text content ── */
        <div className="card overflow-hidden">
          <div className="h-[3px] bg-gradient-to-r from-[rgb(var(--accent))] to-[rgb(var(--accent2))]" />
          <div className="p-5">
            <div className="flex items-center gap-2 text-xs font-semibold text-muted uppercase tracking-wider mb-4">
              <BookOpen className="w-3.5 h-3.5 text-accent" /> Опис програми
            </div>
            <div className="text-sm leading-relaxed whitespace-pre-wrap text-text/90">
              {plan.content}
            </div>
          </div>
        </div>
      )}

      {/* ── Notes ── */}
      {plan.notes && (
        <div className="card p-5 border-accent/20 bg-accent/3">
          <div className="flex items-center gap-2 text-xs font-semibold text-accent uppercase tracking-wider mb-2">
            <StickyNote className="w-3.5 h-3.5" /> Нотатка від тренера
          </div>
          <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">{plan.notes}</div>
        </div>
      )}

      {/* ── Recent workout logs ── */}
      {recent.length > 0 && (
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Clock className="w-4 h-4 text-accent" /> Останні тренування
            </h3>
            <Link href="/dashboard/sessions" className="text-xs text-accent hover:underline flex items-center gap-0.5">
              Всі <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {recent.map((w) => (
              <div key={w.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-surface border border-border">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${w.completed ? "bg-success/10 border border-success/20" : "bg-muted/10 border border-border"}`}>
                  <Dumbbell className={`w-3.5 h-3.5 ${w.completed ? "text-success" : "text-muted"}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-xs truncate">{w.title}</div>
                  <div className="text-[10px] text-muted mt-0.5">
                    {w.date.toLocaleDateString("uk-UA")}
                  </div>
                </div>
                <span className={`chip text-[9px] py-0 px-1.5 ${w.completed ? "text-success border-success/30 bg-success/5" : "text-muted"}`}>
                  {w.completed ? "зроблено" : "пропущено"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
