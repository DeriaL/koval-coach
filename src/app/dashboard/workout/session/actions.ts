"use server";
import { prisma } from "@/lib/prisma";
import { requireClient } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { notifyAllTrainers, notifyUser, tgEscape } from "@/lib/telegram";
import { maybeBillPackage } from "@/lib/billing";

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
  let seq = 0; // session-wide running index → stable exercise order on display
  for (const s of data.sets) {
    const isPR = s.completed && s.weight != null && s.reps != null && (!bestPerEx[s.exerciseName] || s.weight > bestPerEx[s.exerciseName]);
    if (isPR) { bestPerEx[s.exerciseName] = s.weight!; if (!prs.includes(s.exerciseName)) prs.push(s.exerciseName); }
    await prisma.sessionSet.create({
      data: {
        sessionId: session.id,
        exerciseName: s.exerciseName,
        setIndex: seq++,
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

  // Package billing: FULL clients get a pending invoice when they reach 10
  // sessions SINCE their last payment (counter resets on payment). ONLINE pay
  // monthly via cron; DROP_IN per session on trainer confirm.
  const bill = await maybeBillPackage(u.id);

  let milestone: FinishResult["milestone"] = null;
  if (bill.billed) {
    const amount = bill.amount;
    milestone = { count: bill.sinceLastPaid, amount };
    notifyUser(u.id, "payments", `🎉 <b>10 тренувань!</b>\nЧас оплатити наступний пакет${amount ? ` — <b>${amount} ₴</b>` : ""}.`).catch(()=>{});
    notifyAllTrainers(`🎯 <b>${tgEscape(u.name)}</b> завершив пакет (10 тренувань)${amount ? ` — рахунок ${amount} ₴ створено` : ""}.`).catch(()=>{});
  }

  // Always notify trainer when client finishes a workout
  notifyAllTrainers(`💪 <b>${tgEscape(u.name)}</b> завершив(ла) тренування «${tgEscape(data.title)}»${data.durationSec ? ` · ${Math.round(data.durationSec/60)} хв` : ""}${prs.length ? `\n🏆 PR: ${tgEscape(prs.join(", "))}` : ""}`).catch(()=>{});

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/workout");
  revalidatePath("/dashboard/analytics");
  revalidatePath("/dashboard/records");
  revalidatePath("/dashboard/payments");

  return { sessionId: session.id, prs, milestone };
}
