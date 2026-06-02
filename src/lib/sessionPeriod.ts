// Compute the "current period" session count for a client.
//
//  • ONLINE  → counter resets on the 1st of every month (or a manual reset).
//              We count valid sessions from the start of the current month.
//
//  • FULL    → a 10-session package. The counter shows how many sessions are
//              in the CURRENT (not-yet-paid) package = total valid sessions
//              minus the sessions already covered by paid packages. We count by
//              PAID PACKAGES, not by payment date, so sessions done while an
//              invoice is still "Очікує" are NEVER lost: e.g. client does 12,
//              pays for one 10-pack, counter shows 2 (the carry-over), not 0.
//
//  • DROP_IN → same idea but each session is its own "package" (per-session
//              payment): counter = total valid sessions − paid sessions.
//
// "Valid" = completed or trainer-confirmed, and not cancelled.

import { prisma } from "@/lib/prisma";
import { kyivStartOfMonth } from "@/lib/kyivTime";

// THE canonical definition of a "valid training session" — a session that
// counts toward a client's training total. Reused everywhere so no counter
// can drift from another.
export const VALID_SESSION = {
  cancelledAt: null,
  OR: [{ completed: true }, { confirmedByTrainer: true }],
};

export type PeriodMode = "month" | "package";

export type SessionPeriod = {
  count: number;       // sessions in the current period / unpaid package
  mode: PeriodMode;
  periodStart: Date | null;
};

// Sessions per "package": FULL = 10-pack, DROP_IN = pay per single session.
function perPackageFor(plan: string | null | undefined): number {
  return plan === "DROP_IN" ? 1 : 10;
}

/**
 * Package progress, timing-independent. `completedPaid` only counts a paid
 * package if the client has actually done enough sessions for it — so a
 * pre-paid client who hasn't trained yet still shows real progress, and a
 * client who trained past 10 while waiting to pay keeps the carry-over.
 */
function packageProgress(totalValid: number, paidCount: number, perPackage: number): number {
  const packagesBySessions = Math.floor(totalValid / perPackage);
  const completedPaid = Math.min(paidCount, packagesBySessions);
  return totalValid - completedPaid * perPackage;
}

/** Count current-period sessions for a single client. */
export async function getSessionPeriod(client: { id: string; coachingPlan: string | null }): Promise<SessionPeriod> {
  if (client.coachingPlan === "ONLINE") {
    // Count from the LATER of the 1st-of-month and a manual reset point.
    const u = await prisma.user.findUnique({ where: { id: client.id }, select: { sessionsResetAt: true } });
    const monthStart = kyivStartOfMonth();
    const resetAt = u?.sessionsResetAt ?? null;
    const start = resetAt && resetAt > monthStart ? resetAt : monthStart;
    const count = await prisma.workoutSession.count({
      where: { clientId: client.id, ...VALID_SESSION, date: { gte: start } },
    });
    return { count, mode: "month", periodStart: start };
  }

  // FULL / DROP_IN: package-count based (resets on payment, no lost sessions).
  const [totalValid, paidCount] = await Promise.all([
    prisma.workoutSession.count({ where: { clientId: client.id, ...VALID_SESSION } }),
    prisma.payment.count({ where: { clientId: client.id, status: "paid" } }),
  ]);
  const count = packageProgress(totalValid, paidCount, perPackageFor(client.coachingPlan));
  return { count, mode: "package", periodStart: null };
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

  // Paid-payment COUNT per client (each = one package for FULL / one session for DROP_IN).
  const paidGroups = await prisma.payment.groupBy({
    by: ["clientId"],
    where: { clientId: { in: ids }, status: "paid" },
    _count: { _all: true },
  });
  const paidCountMap = new Map<string, number>();
  for (const r of paidGroups) paidCountMap.set(r.clientId, r._count._all);

  // Manual reset points (ONLINE clients).
  const resetRows = await prisma.user.findMany({
    where: { id: { in: ids } },
    select: { id: true, sessionsResetAt: true },
  });
  const resetMap = new Map<string, Date | null>();
  for (const r of resetRows) resetMap.set(r.id, r.sessionsResetAt ?? null);

  // ALL valid sessions (clientId + date) for these clients — no date bound, so
  // package totals are complete. Light (clientId + date only).
  const sessions = await prisma.workoutSession.findMany({
    where: { clientId: { in: ids }, ...VALID_SESSION },
    select: { clientId: true, date: true },
  });
  // Group by client.
  const byClient = new Map<string, Date[]>();
  for (const s of sessions) {
    const arr = byClient.get(s.clientId) ?? [];
    arr.push(s.date);
    byClient.set(s.clientId, arr);
  }

  for (const c of clients) {
    const dates = byClient.get(c.id) ?? [];
    if (c.coachingPlan === "ONLINE") {
      const resetAt = resetMap.get(c.id) ?? null;
      const start = resetAt && resetAt > monthStart ? resetAt : monthStart;
      result.set(c.id, dates.filter(d => d >= start).length);
    } else {
      const totalValid = dates.length;
      const paidCount = paidCountMap.get(c.id) ?? 0;
      result.set(c.id, packageProgress(totalValid, paidCount, perPackageFor(c.coachingPlan)));
    }
  }
  return result;
}
