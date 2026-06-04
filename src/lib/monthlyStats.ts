// Monthly archive / statistics. Nothing is deleted — past months are simply
// grouped into read-only buckets so the trainer can tally history without it
// affecting the live period counter (see sessionPeriod.ts).
import { prisma } from "@/lib/prisma";
import { VALID_SESSION } from "@/lib/sessionPeriod";
import { kyivMonthKey } from "@/lib/kyivTime";

export type MonthStat = {
  key: string;          // "YYYY-MM"
  workouts: number;     // valid (completed/confirmed) sessions in that month
  totalMin: number;     // summed duration, minutes
  paymentsCount: number;
  paymentsSum: number;  // ₴ of payments marked paid that month
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
  return { key, workouts: 0, totalMin: 0, paymentsCount: 0, paymentsSum: 0 };
}

/** Per-month history for a single client, newest month first. */
export async function getClientMonthlyStats(clientId: string): Promise<MonthStat[]> {
  const [sessions, payments] = await Promise.all([
    prisma.workoutSession.findMany({
      where: { clientId, ...VALID_SESSION },
      select: { date: true, scheduledAt: true, durationSec: true },
    }),
    prisma.payment.findMany({
      where: { clientId, status: "paid" },
      select: { date: true, amount: true },
    }),
  ]);

  const map = new Map<string, MonthStat>();
  const bucket = (k: string) => map.get(k) ?? map.set(k, blank(k)).get(k)!;

  for (const s of sessions) {
    const m = bucket(kyivMonthKey(whenOf(s)));
    m.workouts++;
    m.totalMin += Math.round((s.durationSec ?? 0) / 60);
  }
  for (const p of payments) {
    const m = bucket(kyivMonthKey(p.date));
    m.paymentsCount++;
    m.paymentsSum += p.amount;
  }

  return [...map.values()].sort((a, b) => (a.key < b.key ? 1 : -1));
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
      select: { id: true, firstName: true, lastName: true },
    }),
  ]);

  const nameOf = new Map(clients.map((c) => [c.id, `${c.firstName} ${c.lastName}`.trim()]));

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
    r.totalMin += Math.round((s.durationSec ?? 0) / 60);
    clientLine(k, s.clientId).workouts++;
  }
  for (const p of payments) {
    const k = kyivMonthKey(p.date);
    const r = monthRow(k);
    r.paymentsCount++;
    r.paymentsSum += p.amount;
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
