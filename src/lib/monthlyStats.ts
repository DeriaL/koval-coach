// Monthly archive / statistics. Nothing is deleted — past months are simply
// grouped into read-only buckets so the trainer can tally history without it
// affecting the live period counter (see sessionPeriod.ts).
import { prisma } from "@/lib/prisma";
import { VALID_SESSION } from "@/lib/sessionPeriod";
import { kyivMonthKey } from "@/lib/kyivTime";

export type MonthStat = {
  key: string;          // "YYYY-MM"
  workouts: number;     // valid (completed/confirmed) sessions in that month
  personal: number;     // of those — offline/personal clients (FULL/DROP_IN)
  online: number;       // of those — ONLINE clients (self-logged)
  totalMin: number;     // summed duration, minutes
  paymentsCount: number;
  paymentsSum: number;      // ₴ of payments marked paid that month
  paymentsPersonal: number; // of those — from offline/personal clients
  paymentsOnline: number;   // of those — from ONLINE clients
};

export type ClientLine = {
  clientId: string;
  name: string;
  workouts: number;
  paymentsSum: number;
};

export type MonthRow = MonthStat & { clients: ClientLine[] };

// A session counts toward the month of when it actually happened.
const whenOf = (s: { scheduledAt: Date | null; date: Date }) => s.scheduledAt ?? s.date;

function blank(key: string): MonthStat {
  return { key, workouts: 0, personal: 0, online: 0, totalMin: 0, paymentsCount: 0, paymentsSum: 0, paymentsPersonal: 0, paymentsOnline: 0 };
}

/** Trainer-wide per-month totals + per-client breakdown, newest month first. */
export async function getAllMonthlyStats(): Promise<MonthRow[]> {
  const [sessions, payments, clients] = await Promise.all([
    prisma.workoutSession.findMany({
      where: { ...VALID_SESSION },
      select: { clientId: true, date: true, scheduledAt: true, durationSec: true },
    }),
    prisma.payment.findMany({
      where: { status: "paid" },
      select: { clientId: true, date: true, amount: true },
    }),
    prisma.user.findMany({
      where: { role: "CLIENT" },
      select: { id: true, firstName: true, lastName: true, coachingPlan: true },
    }),
  ]);

  const nameOf = new Map(clients.map((c) => [c.id, `${c.firstName} ${c.lastName}`.trim()]));
  const onlineIds = new Set(clients.filter((c) => c.coachingPlan === "ONLINE").map((c) => c.id));
  const isOnline = (clientId: string) => onlineIds.has(clientId);

  // month -> { totals, perClient map }
  const months = new Map<string, MonthRow>();
  const monthRow = (k: string): MonthRow => {
    let r = months.get(k);
    if (!r) { r = { ...blank(k), clients: [] }; months.set(k, r); }
    return r;
  };
  // month -> clientId -> ClientLine (so we can accumulate then attach)
  const perClient = new Map<string, Map<string, ClientLine>>();
  const clientLine = (k: string, clientId: string): ClientLine => {
    let cm = perClient.get(k);
    if (!cm) { cm = new Map(); perClient.set(k, cm); }
    let line = cm.get(clientId);
    if (!line) {
      line = { clientId, name: nameOf.get(clientId) ?? "—", workouts: 0, paymentsSum: 0 };
      cm.set(clientId, line);
    }
    return line;
  };

  for (const s of sessions) {
    const k = kyivMonthKey(whenOf(s));
    const r = monthRow(k);
    r.workouts++;
    if (isOnline(s.clientId)) r.online++; else r.personal++;
    r.totalMin += Math.round((s.durationSec ?? 0) / 60);
    clientLine(k, s.clientId).workouts++;
  }
  for (const p of payments) {
    const k = kyivMonthKey(p.date);
    const r = monthRow(k);
    r.paymentsCount++;
    r.paymentsSum += p.amount;
    if (isOnline(p.clientId)) r.paymentsOnline += p.amount; else r.paymentsPersonal += p.amount;
    clientLine(k, p.clientId).paymentsSum += p.amount;
  }

  // Attach sorted client lines (most workouts first, then by spend).
  for (const [k, r] of months) {
    const lines = [...(perClient.get(k)?.values() ?? [])]
      .sort((a, b) => b.workouts - a.workouts || b.paymentsSum - a.paymentsSum);
    r.clients = lines;
  }

  return [...months.values()].sort((a, b) => (a.key < b.key ? 1 : -1));
}
