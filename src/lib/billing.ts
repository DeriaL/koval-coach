// Package-billing for FULL (offline) clients.
//
// A client's 10-session package resets when they PAY. So we count valid
// sessions completed AFTER their last paid payment, and when that reaches 10
// (and there's no open invoice yet) we create a pending invoice. After they
// pay, the count resets and the next package starts from zero.
//
// ONLINE clients are billed monthly by the cron — they never get a package
// invoice here. DROP_IN clients are billed per session on trainer confirm.

import { prisma } from "@/lib/prisma";

const VALID_SESSION = {
  cancelledAt: null,
  OR: [{ completed: true }, { confirmedByTrainer: true }],
};

export type PackageBillResult = {
  billed: boolean;
  amount: number | null;
  sinceLastPaid: number;   // sessions in the current (unpaid) package
};

/**
 * Create a pending package invoice if a FULL client has reached 10 sessions
 * since their last payment and has no open invoice. Idempotent — safe to call
 * after every completed/confirmed session.
 */
export async function maybeBillPackage(clientId: string): Promise<PackageBillResult> {
  const user = await prisma.user.findUnique({
    where: { id: clientId },
    select: { coachingPlan: true, pricePer10: true },
  });
  if (!user || user.coachingPlan !== "FULL") {
    return { billed: false, amount: null, sinceLastPaid: 0 };
  }

  const lastPaid = await prisma.payment.findFirst({
    where: { clientId, status: "paid" },
    orderBy: { date: "desc" },
    select: { date: true },
  });

  const sinceLastPaid = await prisma.workoutSession.count({
    where: { clientId, ...VALID_SESSION, ...(lastPaid?.date ? { date: { gt: lastPaid.date } } : {}) },
  });

  if (sinceLastPaid < 10) {
    return { billed: false, amount: user.pricePer10 ?? null, sinceLastPaid };
  }

  // Don't stack invoices — if one is already open, just report progress.
  const openInvoice = await prisma.payment.findFirst({
    where: { clientId, status: { in: ["pending", "overdue"] } },
    select: { id: true },
  });
  if (openInvoice) {
    return { billed: false, amount: user.pricePer10 ?? null, sinceLastPaid };
  }

  const amount = user.pricePer10 ?? null;
  if (amount && amount > 0) {
    await prisma.payment.create({
      data: {
        clientId,
        amount,
        currency: "UAH",
        date: new Date(),
        status: "pending",
        notes: `Пакет 10 тренувань (авто)`,
      },
    });
  }
  await prisma.reminder.create({
    data: {
      clientId,
      title: `🎉 10 тренувань! Час оплати наступного пакету${amount ? ` (${amount} ₴)` : ""}.`,
      type: "payment",
      datetime: new Date(),
      done: false,
    },
  }).catch(() => {});

  return { billed: true, amount, sinceLastPaid };
}
