import { requireClient } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PageHeader, EmptyState } from "@/components/ui";
import { Dumbbell, CalendarDays, StickyNote } from "lucide-react";

export default async function TrainingPage() {
  const u = await requireClient();
  const plans = await prisma.trainingPlan.findMany({ where: { clientId: u.id }, orderBy: { updatedAt: "desc" } });
  const recent = await prisma.workoutLog.findMany({ where: { clientId: u.id }, orderBy: { date: "desc" }, take: 10 });

  return (
    <div>
      <PageHeader title="Тренування" subtitle="Програма і лог тренувань" />

      {plans.length === 0 ? (
        <EmptyState icon={Dumbbell} title="Програму ще не додано" text="Я додам її незабаром" />
      ) : (
        <div className="space-y-6">
          {plans.map((p) => (
            <div key={p.id} className="card p-6">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Dumbbell className="w-5 h-5 text-accent" /> {p.title}
                </h2>
                <span className="chip"><CalendarDays className="w-3.5 h-3.5" /> {p.daysPerWeek ?? "—"}× на тиждень</span>
              </div>
              <pre className="mt-4 whitespace-pre-wrap font-sans text-sm bg-surface border border-border rounded-xl p-4">
                {p.content}
              </pre>
              {p.notes && (
                <div className="mt-4 p-4 rounded-xl bg-accent/5 border border-accent/20">
                  <div className="text-xs uppercase text-accent tracking-wider flex items-center gap-1.5 mb-1">
                    <StickyNote className="w-3.5 h-3.5" /> Моя нотатка
                  </div>
                  <div className="text-sm">{p.notes}</div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="card p-6 mt-6">
        <h3 className="font-semibold mb-4">Останні тренування</h3>
        {recent.length === 0 ? (
          <div className="text-muted text-sm">Тут зʼявляться твої тренування.</div>
        ) : (
          <div className="space-y-2">
            {recent.map((w) => (
              <div key={w.id} className="flex items-center justify-between p-3 rounded-xl bg-surface border border-border">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${w.completed ? "bg-success" : "bg-muted"}`} />
                  <div>
                    <div className="font-medium text-sm">{w.title}</div>
                    <div className="text-xs text-muted">{w.date.toLocaleDateString("uk-UA")}</div>
                  </div>
                </div>
                <span className={`chip text-xs ${w.completed ? "text-success" : "text-muted"}`}>
                  {w.completed ? "зроблено" : "пропущено"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
