import { requireClient } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui";
import { WorkoutLogger } from "./WorkoutLogger";

export const dynamic = "force-dynamic";

export default async function LogWorkoutPage() {
  const u = await requireClient();

  // Pull last 50 unique exercise names from previous sessions for autosuggest
  const recent = await prisma.sessionSet.findMany({
    where: { session: { clientId: u.id } },
    select: { exerciseName: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  const seen = new Set<string>();
  const recentExercises: string[] = [];
  for (const r of recent) {
    const n = r.exerciseName?.trim();
    if (!n || seen.has(n.toLowerCase())) continue;
    seen.add(n.toLowerCase());
    recentExercises.push(n);
    if (recentExercises.length >= 30) break;
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Записати тренування"
        subtitle="Створи запис свого тренування — вправи, підходи, вагу"
      />
      <WorkoutLogger isTrainer={false} recentExercises={recentExercises} />
    </div>
  );
}
