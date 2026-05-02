import { requireClient } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PageHeader, EmptyState } from "@/components/ui";
import { Dumbbell, Play, Clock, Trophy, Calendar } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { uk } from "date-fns/locale";

function formatGCalDate(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth()+1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`;
}
import Link from "next/link";

export default async function WorkoutHome() {
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
      take: 5,
      include: { sets: true },
    }),
    prisma.sessionSet.findMany({ where: { isPR: true, session: { clientId: u.id } }, orderBy: { createdAt: "desc" }, take: 5 }),
    prisma.workoutSession.findMany({
      where: { clientId: u.id, scheduledAt: { gte: new Date() }, completed: false, confirmedByTrainer: false },
      orderBy: { scheduledAt: "asc" }, take: 5,
    }),
  ]);

  const plan = plans[0];
  const days: Record<string, any[]> = {};
  plan?.exercises.forEach((e) => {
    (days[e.day] ||= []).push(e);
  });

  return (
    <div>
      <PageHeader title="Тренування" subtitle="Обери день — і в зал 💪" />

      {upcoming.length > 0 && (
        <div className="card p-5 mb-4 border-accent/30">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <h3 className="font-semibold flex items-center gap-2"><Calendar className="w-4 h-4 text-accent" /> Заплановані тренування</h3>
            <a href="/api/calendar/sessions.ics?scope=mine" download className="chip text-xs hover:border-accent/50">📅 У календар</a>
          </div>
          <div className="space-y-2">
            {upcoming.map((s) => {
              const gcal = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(s.title)}&dates=${formatGCalDate(new Date(s.scheduledAt!))}/${formatGCalDate(new Date(new Date(s.scheduledAt!).getTime() + 60*60*1000))}&details=${encodeURIComponent(s.notes ?? "Тренування зі мною")}`;
              return (
                <div key={s.id} className="flex items-center justify-between p-3 rounded-xl bg-surface border border-border gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-sm truncate">{s.title}</div>
                    <div className="text-xs text-muted">
                      {new Date(s.scheduledAt!).toLocaleString("uk-UA", { dateStyle: "short", timeStyle: "short" })}
                      {" · "}{formatDistanceToNow(new Date(s.scheduledAt!), { addSuffix: true, locale: uk })}
                    </div>
                  </div>
                  <a href={gcal} target="_blank" rel="noreferrer" title="Додати в Google Calendar"
                    className="btn text-xs py-1.5 hover:border-accent/50 hover:text-accent shrink-0">
                    📅
                  </a>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!plan || plan.exercises.length === 0 ? (
        <EmptyState icon={Dumbbell} title="Ще немає структурованої програми" text="Я додам вправи незабаром, потім тут зʼявиться режим «в залі» з таймерами." />
      ) : (
        <div className="grid md:grid-cols-2 gap-3 md:gap-4">
          {Object.entries(days).map(([day, exs]) => (
            <div key={day} className="card p-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-muted uppercase tracking-wider">{day}</div>
                  <div className="font-bold text-lg mt-1">{exs.length} вправ</div>
                </div>
                <Link href={`/dashboard/workout/session?day=${encodeURIComponent(day)}`} className="btn btn-primary px-4 py-2.5">
                  <Play className="w-4 h-4" /> Почати
                </Link>
              </div>
              <ul className="mt-3 space-y-1.5 text-sm text-muted">
                {exs.map((e: any) => (
                  <li key={e.id} className="flex items-center justify-between">
                    <span>{e.name}</span>
                    <span className="text-xs">{e.targetSets}×{e.targetReps}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {prSets.length > 0 && (
        <div className="card p-5 mt-6">
          <h3 className="font-semibold mb-3 flex items-center gap-2"><Trophy className="w-4 h-4 text-accent" /> Особисті рекорди</h3>
          <div className="space-y-2">
            {prSets.map((s) => (
              <div key={s.id} className="flex items-center justify-between p-3 rounded-xl bg-surface border border-accent/20">
                <div>
                  <div className="font-medium text-sm">{s.exerciseName}</div>
                  <div className="text-xs text-muted">{s.createdAt.toLocaleDateString("uk-UA")}</div>
                </div>
                <div className="font-bold text-accent">{s.weight?.toFixed(1)} кг × {s.reps}</div>
              </div>
            ))}
          </div>
          <Link href="/dashboard/records" className="text-xs text-accent hover:underline mt-3 inline-block">Усі рекорди →</Link>
        </div>
      )}

      <div className="card p-5 mt-6">
        <h3 className="font-semibold mb-3 flex items-center gap-2"><Clock className="w-4 h-4 text-accent" /> Останні сесії</h3>
        {recentSessions.length === 0 ? (
          <div className="text-muted text-sm">Сесій поки немає</div>
        ) : (
          <div className="space-y-2">
            {recentSessions.map((s) => (
              <div key={s.id} className="flex items-center justify-between p-3 rounded-xl bg-surface border border-border">
                <div>
                  <div className="font-medium text-sm">{s.title}</div>
                  <div className="text-xs text-muted">{s.date.toLocaleDateString("uk-UA")} · {Math.round((s.durationSec ?? 0)/60)} хв · {s.sets.length} підходів</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
