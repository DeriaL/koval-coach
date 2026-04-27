import { requireClient } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { WorkoutPlayer } from "./player";

export default async function WorkoutSessionPage({ searchParams }: { searchParams: { day?: string } }) {
  const u = await requireClient();
  const day = searchParams.day;
  if (!day) redirect("/dashboard/workout");

  const plan = await prisma.trainingPlan.findFirst({
    where: { clientId: u.id },
    include: { exercises: { where: { day }, orderBy: { order: "asc" } } },
    orderBy: { updatedAt: "desc" },
  });
  if (!plan || plan.exercises.length === 0) notFound();

  // previous best per exercise for reference
  const exerciseNames = plan.exercises.map(e => e.name);
  const prevSets = await prisma.sessionSet.findMany({
    where: { session: { clientId: u.id, completed: true }, exerciseName: { in: exerciseNames } },
    orderBy: { createdAt: "desc" },
  });
  const prevBest: Record<string, { weight: number; reps: number } | null> = {};
  for (const n of exerciseNames) {
    const sets = prevSets.filter(s => s.exerciseName === n && s.weight);
    if (!sets.length) { prevBest[n] = null; continue; }
    const best = sets.reduce((b, s) => (s.weight! > (b?.weight ?? 0) ? s : b), sets[0]);
    prevBest[n] = { weight: best.weight!, reps: best.reps ?? 0 };
  }

  // last session sets per exercise (most recent completed session that included that exercise)
  const lastSessions: Record<string, { weight: number | null; reps: number | null }[]> = {};
  for (const n of exerciseNames) {
    const sets = prevSets.filter(s => s.exerciseName === n);
    if (!sets.length) { lastSessions[n] = []; continue; }
    const lastSessionId = sets[0].sessionId;
    lastSessions[n] = sets
      .filter(s => s.sessionId === lastSessionId)
      .sort((a, b) => a.setIndex - b.setIndex)
      .map(s => ({ weight: s.weight, reps: s.reps }));
  }

  return <WorkoutPlayer day={day} exercises={plan.exercises} prevBest={prevBest} lastSession={lastSessions} />;
}
