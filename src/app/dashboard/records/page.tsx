import { requireClient } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PageHeader, EmptyState } from "@/components/ui";
import { Trophy } from "lucide-react";

export default async function RecordsPage() {
  const u = await requireClient();
  const sets = await prisma.sessionSet.findMany({
    where: { session: { clientId: u.id, completed: true }, weight: { not: null }, reps: { not: null } },
    orderBy: { createdAt: "desc" },
  });

  // best per exercise by weight
  type Best = { weight: number; reps: number; date: Date };
  const best: Record<string, Best> = {};
  sets.forEach((s) => {
    const cur = best[s.exerciseName];
    if (!cur || s.weight! > cur.weight) best[s.exerciseName] = { weight: s.weight!, reps: s.reps!, date: s.createdAt };
  });

  const items = Object.entries(best).sort((a, b) => b[1].weight - a[1].weight);
  if (!items.length)
    return (
      <div>
        <PageHeader title="Особисті рекорди" />
        <EmptyState icon={Trophy} title="Рекордів поки немає" text="Почни тренування у «В залі», PR зафіксуються автоматично" />
      </div>
    );

  return (
    <div>
      <PageHeader title="Особисті рекорди" subtitle="Автоматично фіксуються під час тренувань" />
      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
        {items.map(([name, b]) => (
          <div key={name} className="card p-5 relative overflow-hidden">
            <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-accent/10 blur-2xl" />
            <div className="w-11 h-11 rounded-xl accent-shine flex items-center justify-center text-white mb-3">
              <Trophy className="w-5 h-5" />
            </div>
            <div className="font-semibold">{name}</div>
            <div className="mt-2 text-2xl font-black text-accent">{b.weight.toFixed(1)} кг <span className="text-base text-muted font-normal">× {b.reps}</span></div>
            <div className="text-xs text-muted mt-1">{b.date.toLocaleDateString("uk-UA")}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
