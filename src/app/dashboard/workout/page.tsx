import { requireClient } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { EmptyState } from "@/components/ui";
import { Dumbbell, Play, Clock, Trophy, Calendar, ChevronRight, CheckCircle2, Zap, Pencil } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { uk } from "date-fns/locale";
import Link from "next/link";

function pluralExercise(n: number) {
  if (n === 1) return "вправа";
  if (n < 5) return "вправи";
  return "вправ";
}

function formatGCalDate(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`;
}

const DAY_ORDER = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Нд"];

export default async function WorkoutHome({ searchParams }: { searchParams: { planId?: string } }) {
  const u = await requireClient();
  const [plans, recentSessions, prSets, upcoming] = await Promise.all([
    prisma.trainingPlan.findMany({
      where: { clientId: u.id },
      include: { exercises: { orderBy: [{ day: "asc" }, { order: "asc" }] } },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.workoutSession.findMany({
      where: { clientId: u.id, completed: true },
      orderBy: { date: "desc" },
      take: 4,
      include: { sets: true },
    }),
    prisma.sessionSet.findMany({
      where: { isPR: true, session: { clientId: u.id } },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
    prisma.workoutSession.findMany({
      where: { clientId: u.id, scheduledAt: { gte: new Date() }, completed: false, confirmedByTrainer: false },
      orderBy: { scheduledAt: "asc" },
      take: 3,
    }),
  ]);

  const plan = plans.find((p) => p.id === searchParams.planId) ?? plans[0];

  const days: Record<string, any[]> = {};
  plan?.exercises.forEach((e) => { (days[e.day] ||= []).push(e); });
  const sortedDays = Object.entries(days).sort(
    ([a], [b]) => (DAY_ORDER.indexOf(a) ?? 99) - (DAY_ORDER.indexOf(b) ?? 99)
  );

  return (
    <div className="space-y-6 pb-4">

      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold">Тренування</h1>
          <p className="text-sm text-muted mt-0.5">Обери програму і день — і в зал 💪</p>
        </div>
        <Link
          href="/dashboard/workout/log"
          className="btn btn-primary text-sm gap-1.5 shrink-0"
        >
          <Pencil className="w-4 h-4" /> Записати тренування
        </Link>
      </div>

      {/* ── Заплановані ── */}
      {upcoming.length > 0 && (
        <div className="card p-4 border-accent/30">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Calendar className="w-4 h-4 text-accent" /> Заплановані
            </h3>
            <a href="/api/calendar/sessions.ics?scope=mine" download
              className="chip text-xs hover:border-accent/50 hover:text-accent">
              📅 У календар
            </a>
          </div>
          <div className="space-y-2">
            {upcoming.map((s) => {
              const gcal = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(s.title)}&dates=${formatGCalDate(new Date(s.scheduledAt!))}/${formatGCalDate(new Date(new Date(s.scheduledAt!).getTime() + 60 * 60 * 1000))}&details=${encodeURIComponent(s.notes ?? "Тренування")}`;
              return (
                <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl bg-surface border border-border">
                  <div className="w-9 h-9 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0">
                    <Zap className="w-4 h-4 text-accent" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-sm truncate">{s.title}</div>
                    <div className="text-xs text-muted">
                      {new Date(s.scheduledAt!).toLocaleString("uk-UA", { dateStyle: "short", timeStyle: "short", timeZone: "Europe/Kyiv" })}
                      {" · "}{formatDistanceToNow(new Date(s.scheduledAt!), { addSuffix: true, locale: uk })}
                    </div>
                  </div>
                  <a href={gcal} target="_blank" rel="noreferrer"
                    className="btn text-xs py-1.5 px-3 shrink-0">📅</a>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Вибір програми (якщо > 1) ── */}
      {plans.length > 1 && (
        <div>
          <div className="text-xs font-semibold text-muted uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Dumbbell className="w-3.5 h-3.5" /> Програма
          </div>
          <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-thin -mx-1 px-1">
            {plans.map((p) => {
              const active = p.id === plan?.id;
              const exCount = p.exercises.length;
              return (
                <Link
                  key={p.id}
                  href={`/dashboard/workout?planId=${p.id}`}
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
                    {p.daysPerWeek ? `${p.daysPerWeek} дні/тиж · ` : ""}{exCount} {pluralExercise(exCount)}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Дні ── */}
      {!plan || plan.exercises.length === 0 ? (
        <EmptyState icon={Dumbbell} title="Ще немає структурованої програми"
          text="Тренер додасть вправи — і тут зʼявиться режим «В залі» з таймерами." />
      ) : (
        <div>
          {plans.length === 1 && (
            <div className="text-xs font-semibold text-muted uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Dumbbell className="w-3.5 h-3.5" /> {plan.title}
            </div>
          )}
          <div className="space-y-3">
            {sortedDays.map(([day, exs]) => (
              <div key={day} className="card overflow-hidden">
                {/* Accent top strip */}
                <div className="h-[3px] bg-gradient-to-r from-[rgb(var(--accent))] to-[rgb(var(--accent2))]" />

                <div className="p-5">
                  {/* Day header */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="shrink-0 text-xs font-bold px-3 py-1.5 rounded-lg bg-accent/10 text-accent border border-accent/25 tracking-widest uppercase">
                        {day}
                      </span>
                      <div className="min-w-0">
                        <div className="font-bold leading-tight">
                          {exs.length} {pluralExercise(exs.length)}
                        </div>
                        <div className="text-xs text-muted mt-0.5">
                          {exs.reduce((s: number, e: any) => s + (e.targetSets ?? 3), 0)} підходів
                        </div>
                      </div>
                    </div>
                    <Link
                      href={`/dashboard/workout/session?day=${encodeURIComponent(day)}&planId=${plan.id}`}
                      className="btn btn-primary shrink-0 px-5 py-2.5 gap-2"
                    >
                      <Play className="w-4 h-4" />
                      <span className="hidden sm:inline">Почати</span>
                    </Link>
                  </div>

                  {/* Exercise list */}
                  <div className="mt-4 space-y-0">
                    {exs.map((e: any, i: number) => (
                      <div
                        key={e.id}
                        className="flex items-center justify-between py-2.5 gap-3 border-b border-border/40 last:border-0"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="shrink-0 w-5 h-5 rounded-full bg-surface border border-border text-[10px] font-bold flex items-center justify-center text-muted">
                            {i + 1}
                          </span>
                          <span className="text-sm truncate">{e.name}</span>
                        </div>
                        <span className="chip text-xs shrink-0 font-mono">
                          {e.targetSets}×{e.targetReps}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Нижній ряд: рекорди + останні ── */}
      <div className="grid sm:grid-cols-2 gap-4">

        {prSets.length > 0 && (
          <div className="card p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <Trophy className="w-4 h-4 text-accent" /> Рекорди
              </h3>
              <Link href="/dashboard/achievements" className="text-xs text-accent hover:underline flex items-center gap-0.5">
                Усі <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="space-y-2">
              {prSets.map((s) => (
                <div key={s.id} className="flex items-center justify-between p-2.5 rounded-xl bg-surface border border-accent/15">
                  <div className="min-w-0">
                    <div className="font-medium text-xs truncate">{s.exerciseName}</div>
                    <div className="text-[10px] text-muted">{s.createdAt.toLocaleDateString("uk-UA")}</div>
                  </div>
                  <div className="font-bold text-sm text-accent shrink-0 ml-2">
                    {s.weight?.toFixed(1)} <span className="text-xs font-normal text-muted">кг×{s.reps}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Clock className="w-4 h-4 text-accent" /> Останні тренування
            </h3>
          </div>
          {recentSessions.length === 0 ? (
            <div className="text-muted text-sm py-2">Тренувань поки немає</div>
          ) : (
            <div className="space-y-2">
              {recentSessions.map((s) => (
                <div key={s.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-surface border border-border">
                  <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0">
                    <Dumbbell className="w-3.5 h-3.5 text-accent" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-xs truncate">{s.title}</div>
                    <div className="text-[10px] text-muted mt-0.5">
                      {s.date.toLocaleDateString("uk-UA")} · {Math.round((s.durationSec ?? 0) / 60)} хв · {s.sets.length} підходів
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
