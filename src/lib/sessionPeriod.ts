// Compute the "current period" session count for a client.
//
//  • ONLINE clients  → counter resets on the 1st of every month, so we count
//    valid sessions from the start of the current month.
//  • FULL / DROP_IN  → counter resets when the client pays, so we count valid
//    sessions AFTER their last paid payment (the package in progress).
//
// "Valid" = completed or trainer-confirmed, and not cancelled.

import { prisma } from "@/lib/prisma";
import { kyivStartOfMonth } from "@/lib/kyivTime";

const VALID_SESSION = {
  cancelledAt: null,
  OR: [{ completed: true }, { confirmedByTrainer: true }],
};

export type PeriodMode = "month" | "package";

export type SessionPeriod = {
  count: number;
  mode: PeriodMode;
  periodStart: Date | null; // null = "all time" (package client who never paid)
};

/** The period start for one client, given their plan and last paid date. */
export function periodStartFor(plan: string | null | undefined, lastPaidDate: Date | null): { start: Date | null; mode: PeriodMode } {
  if (plan === "ONLINE") return { start: kyivStartOfMonth(), mode: "month" };
  return { start: lastPaidDate, mode: "package" };
}

/** Count current-period sessions for a single client (1-2 queries). */
export async function getSessionPeriod(client: { id: string; coachingPlan: string | null }): Promise<SessionPeriod> {
  if (client.coachingPlan === "ONLINE") {
    const start = kyivStartOfMonth();
    const count = await prisma.workoutSession.count({
      where: { clientId: client.id, ...VALID_SESSION, date: { gte: start } },
    });
    return { count, mode: "month", periodStart: start };
  }
  const lastPaid = await prisma.payment.findFirst({
    where: { clientId: client.id, status: "paid" },
    orderBy: { date: "desc" },
    select: { date: true },
  });
  const start = lastPaid?.date ?? null;
  const count = await prisma.workoutSession.count({
    where: { clientId: client.id, ...VALID_SESSION, ...(start ? { date: { gt: start } } : {}) },
  });
  return { count, mode: "package", periodStart: start };
}

/**
 * Batch version for the client list — avoids N+1 queries.
 * Returns a Map<clientId, count> for the current period of each client.
 */
export async function getSessionPeriodCounts(
  clients: { id: string; coachingPlan: string | null }[]
): Promise<Map<string, number>> {
  const ids = clients.map(c => c.id);
  const result = new Map<string, number>();
  if (ids.length === 0) return result;

  const monthStart = kyivStartOfMonth();

  // One query: last paid payment date per client.
  const lastPaid = await prisma.payment.groupBy({
    by: ["clientId"],
    where: { clientId: { in: ids }, status: "paid" },
    _max: { date: true },
  });
  const lastPaidMap = new Map<string, Date | null>();
  for (const r of lastPaid) lastPaidMap.set(r.clientId, r._max.date ?? null);

  // One query: all valid sessions (clientId + date) for these clients since the
  // earliest period boundary we could need (month start or any last-paid date).
  const earliest = [monthStart, ...Array.from(lastPaidMap.values()).filter(Boolean) as Date[]]
    .reduce((min, d) => (d < min ? d : min), monthStart);

  const sessions = await prisma.workoutSession.findMany({
    where: { clientId: { in: ids }, ...VALID_SESSION, date: { gte: earliest } },
    select: { clientId: true, date: true },
  });

  // Tally in JS using each client's own period rule.
  for (const c of clients) {
    const { start, mode } = periodStartFor(c.coachingPlan, lastPaidMap.get(c.id) ?? null);
    const n = sessions.filter(s => {
      if (s.clientId !== c.id) return false;
      if (!start) return true;                       // package client, never paid → all
      return mode === "month" ? s.date >= start : s.date > start;
    }).length;
    result.set(c.id, n);
  }
  return result;
}
