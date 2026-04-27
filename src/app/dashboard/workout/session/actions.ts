"use server";
import { prisma } from "@/lib/prisma";
import { requireClient } from "@/lib/session";
import { revalidatePath } from "next/cache";

type Payload = {
  title: string;
  durationSec: number;
  sets: { exerciseName: string; setIndex: number; weight: number | null; reps: number | null; completed: boolean }[];
};

export type FinishResult = {
  sessionId: string;
  prs: string[];
  milestone: null | { count: number; amount: number | null };
};

export async function finishWorkout(data: Payload): Promise<FinishResult> {
  const u = await requireClient();

  // previous PRs per exercise
  const names = Array.from(new Set(data.sets.map(s => s.exerciseName)));
  const prev = await prisma.sessionSet.findMany({
    where: { exerciseName: { in: names }, session: { clientId: u.id, completed: true }, weight: { not: null }, reps: { not: null } },
  });
  const bestPerEx: Record<string, number> = {};
  for (const p of prev) {
    const w = p.weight!;
    if (!bestPerEx[p.exerciseName] || w > bestPerEx[p.exerciseName]) bestPerEx[p.exerciseName] = w;
  }

  const session = await prisma.workoutSession.create({
    data: {
      clientId: u.id,
      title: data.title,
      completed: true,
      durationSec: data.durationSec,
    },
  });

  const prs: string[] = [];
  for (const s of data.sets) {
    const isPR = s.completed && s.weight != null && s.reps != null && (!bestPerEx[s.exerciseName] || s.weight > bestPerEx[s.exerciseName]);
    if (isPR) { bestPerEx[s.exerciseName] = s.weight!; if (!prs.includes(s.exerciseName)) prs.push(s.exerciseName); }
    await prisma.sessionSet.create({
      data: {
        sessionId: session.id,
        exerciseName: s.exerciseName,
        setIndex: s.setIndex,
        weight: s.weight,
        reps: s.reps,
        completed: s.completed,
        isPR,
      },
    });
  }

  await prisma.workoutLog.create({
    data: { clientId: u.id, date: new Date(), title: data.title, completed: true },
  });

  // Milestone: every 10 completed sessions -> auto payment + reminder
  const totalCompleted = await prisma.workoutSession.count({
    where: { clientId: u.id, completed: true },
  });

  let milestone: FinishResult["milestone"] = null;
  if (totalCompleted > 0 && totalCompleted % 10 === 0) {
    const user = await prisma.user.findUnique({ where: { id: u.id } });
    const amount = user?.pricePer10 ?? null;
    const pkg = Math.floor(totalCompleted / 10);

    if (amount && amount > 0) {
      await prisma.payment.create({
        data: {
          clientId: u.id,
          amount,
          currency: "UAH",
          date: new Date(),
          status: "pending",
          notes: `Пакет №${pkg} · 10 тренувань (авто)`,
        },
      });
    }
    await prisma.reminder.create({
      data: {
        clientId: u.id,
        title: `🎉 Ти пройшов 10 тренувань! Час оплатити наступний пакет${amount ? ` (${amount} ₴)` : ""}.`,
        type: "payment",
        datetime: new Date(),
        done: false,
      },
    });
    milestone = { count: totalCompleted, amount };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/workout");
  revalidatePath("/dashboard/analytics");
  revalidatePath("/dashboard/records");
  revalidatePath("/dashboard/payments");

  return { sessionId: session.id, prs, milestone };
}
