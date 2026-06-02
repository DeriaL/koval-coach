import { requireTrainer } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui";
import { WorkoutLogger } from "@/app/dashboard/workout/log/WorkoutLogger";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function TrainerLogWorkoutPage({ params, searchParams }: { params: { id: string }; searchParams: { edit?: string } }) {
  await requireTrainer();
  const clientId = params.id;
  const editId = searchParams?.edit;

  const [client, recent, editing] = await Promise.all([
    prisma.user.findUnique({
      where: { id: clientId },
      select: { firstName: true, lastName: true, role: true },
    }),
    prisma.sessionSet.findMany({
      where: { session: { clientId } },
      select: { exerciseName: true },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    editId
      ? prisma.workoutSession.findUnique({
          where: { id: editId },
          include: { sets: { orderBy: { setIndex: "asc" } } },
        })
      : Promise.resolve(null),
  ]);

  if (!client || client.role !== "CLIENT") {
    return <div className="card p-6 text-muted">Клієнта не знайдено</div>;
  }

  // Build the edit payload (grouped by exercise) if we're editing and it belongs
  // to this client.
  let editSession: any = undefined;
  if (editing && editing.clientId === clientId) {
    const byEx = new Map<string, { weight: string; reps: string }[]>();
    for (const s of editing.sets) {
      const arr = byEx.get(s.exerciseName) ?? [];
      arr.push({ weight: s.weight != null ? String(s.weight) : "", reps: s.reps != null ? String(s.reps) : "" });
      byEx.set(s.exerciseName, arr);
    }
    editSession = {
      id: editing.id,
      title: editing.title,
      notes: editing.notes,
      durationSec: editing.durationSec,
      exercises: Array.from(byEx.entries()).map(([name, sets]) => ({ name, sets })),
    };
  }

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
    <div className="space-y-4 max-w-2xl">
      <Link
        href={`/admin/clients/${clientId}?tab=sessions`}
        className="inline-flex items-center gap-1 text-sm text-muted hover:text-text"
      >
        <ChevronLeft className="w-4 h-4" /> Назад до клієнта
      </Link>

      <PageHeader
        title={editSession ? "Редагувати тренування" : "Записати тренування"}
        subtitle={`Для клієнта: ${client.firstName} ${client.lastName}`}
      />

      <WorkoutLogger clientId={clientId} isTrainer={true} recentExercises={recentExercises} editSession={editSession} />
    </div>
  );
}
