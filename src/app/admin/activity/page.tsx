import { prisma } from "@/lib/prisma";
import { PageHeader, EmptyState } from "@/components/ui";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { uk } from "date-fns/locale";
import {
  Activity, Trophy, Dumbbell, CheckCircle2, Flame, Crown, Medal, Award,
  TrendingDown, AlertCircle, Sparkles, Clock, Target,
} from "lucide-react";

export const dynamic = "force-dynamic";

const PRESETS = [
  { hours: 24,  label: "24 год" },
  { hours: 72,  label: "72 год" },
  { hours: 168, label: "7 днів" },
  { hours: 720, label: "30 днів" },
];

export default async function ActivityPage({ searchParams }: { searchParams: { range?: string } }) {
  const hours = Number(searchParams?.range) || 168; // default 7 days for richer view
  const since = new Date(Date.now() - hours * 3600_000);

  const [recentSessions, recentCheckIns, recentPRs, allClients] = await Promise.all([
    prisma.workoutSession.findMany({
      where: {
        OR: [{ completed: true }, { confirmedByTrainer: true }],
        date: { gte: since },
        client: { role: "CLIENT" },
      },
      include: { client: { select: { firstName: true, lastName: true, id: true, avatarUrl: true } } },
      orderBy: { date: "desc" },
      take: 200,
    }),
    prisma.checkIn.findMany({
      where: { date: { gte: since }, client: { role: "CLIENT" } },
      include: { client: { select: { firstName: true, lastName: true, id: true, avatarUrl: true } } },
      orderBy: { date: "desc" },
      take: 200,
    }),
    prisma.sessionSet.findMany({
      where: {
        isPR: true,
        session: { date: { gte: since }, completed: true, client: { role: "CLIENT" } },
      },
      include: {
        session: { include: { client: { select: { firstName: true, lastName: true, id: true, avatarUrl: true } } } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.user.findMany({
      where: { role: "CLIENT" },
      include: {
        checkIns: { orderBy: { date: "desc" }, take: 30 },
        sessions: { where: { OR: [{ completed: true }, { confirmedByTrainer: true }] }, orderBy: { date: "desc" }, take: 1 },
      },
      orderBy: [{ firstName: "asc" }],
    }),
  ]);

  // ── Leaderboards ──────────────────────────────────────────────────────────
  type ClientStat = { id: string; name: string; avatarUrl: string | null; count: number };

  const aggregate = <T extends { client: { id: string; firstName: string; lastName: string; avatarUrl: string | null } }>(items: T[]): ClientStat[] => {
    const map = new Map<string, ClientStat>();
    for (const it of items) {
      const k = it.client.id;
      const existing = map.get(k);
      if (existing) existing.count++;
      else map.set(k, {
        id: k,
        name: `${it.client.firstName} ${it.client.lastName}`,
        avatarUrl: it.client.avatarUrl,
        count: 1,
      });
    }
    return [...map.values()].sort((a, b) => b.count - a.count);
  };

  const topWorkouts = aggregate(recentSessions).slice(0, 5);
  const topCheckIns = aggregate(recentCheckIns).slice(0, 5);
  const topPRs = aggregate(recentPRs.map(p => ({ client: p.session.client }))).slice(0, 5);

  // ── Streak (consecutive check-in days for each client) ────────────────────
  function calcStreak(checkIns: { date: Date }[]): number {
    if (!checkIns.length) return 0;
    const days = new Set(checkIns.map(c => c.date.toISOString().slice(0, 10)));
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    let streak = 0;
    for (let i = 0; i < 30; i++) {
      const d = new Date(today);
      d.setUTCDate(today.getUTCDate() - i);
      const k = d.toISOString().slice(0, 10);
      if (days.has(k)) streak++;
      else if (i > 0) break; // allow today missing
    }
    return streak;
  }

  const topStreaks = allClients
    .map(c => ({
      id: c.id,
      name: `${c.firstName} ${c.lastName}`,
      avatarUrl: c.avatarUrl,
      count: calcStreak(c.checkIns),
    }))
    .filter(x => x.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // ── Inactive clients (no activity in the selected period) ─────────────────
  const activeIds = new Set([
    ...recentSessions.map(s => s.client.id),
    ...recentCheckIns.map(c => c.client.id),
  ]);

  const inactive = allClients
    .filter(c => !activeIds.has(c.id))
    .map(c => ({
      id: c.id,
      name: `${c.firstName} ${c.lastName}`,
      avatarUrl: c.avatarUrl,
      lastSession: c.sessions[0]?.date ?? null,
      lastCheckIn: c.checkIns[0]?.date ?? null,
    }))
    .sort((a, b) => {
      const aT = Math.max(a.lastSession?.getTime() ?? 0, a.lastCheckIn?.getTime() ?? 0);
      const bT = Math.max(b.lastSession?.getTime() ?? 0, b.lastCheckIn?.getTime() ?? 0);
      return aT - bT; // longest-inactive first
    });

  // ── Activity by day of week ───────────────────────────────────────────────
  const byDow = [0, 0, 0, 0, 0, 0, 0]; // Mon..Sun
  for (const s of recentSessions) {
    const dow = (s.date.getDay() + 6) % 7;
    byDow[dow]++;
  }
  const maxDow = Math.max(1, ...byDow);
  const dowLabels = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Нд"];

  // ── Combined feed ─────────────────────────────────────────────────────────
  type FeedItem = {
    id: string; t: Date; type: "session" | "checkin" | "pr";
    clientId: string; name: string; text: string;
  };

  const feed: FeedItem[] = [
    ...recentSessions.map(s => ({
      id: "s" + s.id, t: s.date, type: "session" as const,
      clientId: s.clientId,
      name: `${s.client.firstName} ${s.client.lastName}`,
      text: `завершив(ла) тренування «${s.title}»`,
    })),
    ...recentCheckIns.map(c => ({
      id: "c" + c.id, t: c.date, type: "checkin" as const,
      clientId: c.clientId,
      name: `${c.client.firstName} ${c.client.lastName}`,
      text: `зробив(ла) check-in${c.weight ? ` · ${c.weight.toFixed(1)} кг` : ""}`,
    })),
    ...recentPRs.map(p => ({
      id: "p" + p.id, t: p.session.date, type: "pr" as const,
      clientId: p.session.clientId,
      name: `${p.session.client.firstName} ${p.session.client.lastName}`,
      text: `🏆 рекорд: ${p.exerciseName} ${p.weight ? p.weight.toFixed(1) : "?"}×${p.reps}`,
    })),
  ].sort((a, b) => b.t.getTime() - a.t.getTime());

  const counts = {
    sessions: recentSessions.length,
    checkins: recentCheckIns.length,
    prs: recentPRs.length,
    activeClients: activeIds.size,
    inactiveClients: inactive.length,
  };

  const rangeLabel = PRESETS.find(p => p.hours === hours)?.label ?? `${hours} год`;

  return (
    <div className="max-w-5xl">
      <PageHeader
        title="Активність клієнтів"
        subtitle={`${feed.length} подій · ${counts.activeClients} активних із ${allClients.length}`}
      />

      {/* Range filter */}
      <div className="flex items-center gap-2 mb-5 overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0 scrollbar-thin">
        {PRESETS.map(p => {
          const active = p.hours === hours;
          return (
            <Link
              key={p.hours}
              href={`/admin/activity?range=${p.hours}`}
              className={`shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm border transition active:scale-95 ${
                active
                  ? "accent-shine text-white border-transparent shadow-glow"
                  : "bg-surface border-border hover:border-accent/40"
              }`}
            >
              {p.label}
            </Link>
          );
        })}
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3 mb-5">
        <KPI icon={Dumbbell} value={counts.sessions} label="Тренувань" color="accent2" />
        <KPI icon={CheckCircle2} value={counts.checkins} label="Check-in" color="success" />
        <KPI icon={Trophy} value={counts.prs} label="Рекордів" color="accent" />
        <KPI icon={Sparkles} value={counts.activeClients} label="Активних" color="accent" sub={`із ${allClients.length}`} />
      </div>

      {/* Inactive clients (top priority for trainer attention) */}
      {inactive.length > 0 && (
        <div className="card p-4 md:p-5 mb-5 border-danger/30 bg-danger/5">
          <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
            <h3 className="font-semibold flex items-center gap-2 text-danger">
              <AlertCircle className="w-4 h-4 shrink-0" />
              Потребують уваги ({inactive.length})
            </h3>
            <span className="text-xs text-muted">Без активності за {rangeLabel}</span>
          </div>
          <div className="grid sm:grid-cols-2 gap-2">
            {inactive.slice(0, 6).map(c => {
              const last = Math.max(c.lastSession?.getTime() ?? 0, c.lastCheckIn?.getTime() ?? 0);
              return (
                <Link
                  key={c.id}
                  href={`/admin/clients/${c.id}`}
                  className="flex items-center gap-3 p-2.5 rounded-xl bg-surface border border-border hover:border-danger/50 transition min-w-0"
                >
                  <Avatar name={c.name} url={c.avatarUrl} size="md" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{c.name}</div>
                    <div className="text-[11px] text-muted flex items-center gap-1 truncate">
                      <Clock className="w-3 h-3 shrink-0" />
                      {last > 0
                        ? <>остання активність {formatDistanceToNow(new Date(last), { addSuffix: true, locale: uk })}</>
                        : "ще не починав"}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
          {inactive.length > 6 && (
            <div className="text-xs text-muted mt-3">та ще {inactive.length - 6}…</div>
          )}
        </div>
      )}

      {/* Leaderboards */}
      <div className="grid md:grid-cols-2 gap-3 md:gap-4 mb-5">
        <Leaderboard
          title="Топ за тренуваннями"
          icon={Dumbbell}
          color="accent2"
          items={topWorkouts}
          unit="тренувань"
        />
        <Leaderboard
          title="Топ за check-in"
          icon={CheckCircle2}
          color="success"
          items={topCheckIns}
          unit="check-in"
        />
        <Leaderboard
          title="Найдовші streak"
          icon={Flame}
          color="accent"
          items={topStreaks}
          unit="днів поспіль"
        />
        <Leaderboard
          title="Топ за рекордами"
          icon={Trophy}
          color="accent"
          items={topPRs}
          unit="PR"
        />
      </div>

      {/* Day-of-week heatmap */}
      {recentSessions.length > 0 && (
        <div className="card p-4 md:p-5 mb-5">
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-4 h-4 text-accent2" />
            <h3 className="font-semibold">Тренування по днях тижня</h3>
          </div>
          <div className="grid grid-cols-7 gap-1.5">
            {dowLabels.map((d, i) => {
              const v = byDow[i];
              const intensity = v / maxDow;
              return (
                <div key={d} className="flex flex-col items-center gap-1.5">
                  <div
                    className="w-full aspect-square rounded-lg border border-border flex items-center justify-center text-xs font-bold transition"
                    style={{
                      background: v > 0
                        ? `rgb(var(--accent2) / ${0.08 + intensity * 0.55})`
                        : undefined,
                      color: intensity > 0.6 ? "white" : undefined,
                    }}
                  >
                    {v}
                  </div>
                  <div className="text-[10px] text-muted uppercase tracking-wider">{d}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent activity feed */}
      <div className="card p-4 md:p-5">
        <div className="flex items-center justify-between mb-3 gap-2">
          <h3 className="font-semibold flex items-center gap-2">
            <Activity className="w-4 h-4 text-accent" />
            Стрічка подій
          </h3>
          <span className="text-xs text-muted shrink-0">{feed.length} подій</span>
        </div>
        {feed.length === 0 ? (
          <EmptyState icon={Activity} title="Активності немає" text={`За ${rangeLabel} клієнти ще нічого не робили`} />
        ) : (
          <div className="space-y-2">
            {feed.map(it => {
              const Icon = it.type === "pr" ? Trophy : it.type === "session" ? Dumbbell : CheckCircle2;
              const accent = it.type === "pr" ? "text-accent" : it.type === "session" ? "text-accent2" : "text-success";
              return (
                <Link
                  key={it.id}
                  href={`/admin/clients/${it.clientId}`}
                  className="flex items-center gap-3 p-2.5 rounded-xl bg-surface border border-border hover:border-accent/40 hover:-translate-y-0.5 transition w-full"
                >
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center bg-card shrink-0 ${accent}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm truncate">
                      <b>{it.name}</b> <span className="text-muted">{it.text}</span>
                    </div>
                    <div className="text-[11px] text-muted">
                      {formatDistanceToNow(it.t, { addSuffix: true, locale: uk })}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Components ──────────────────────────────────────────────────────────────

function KPI({ icon: Icon, value, label, color, sub }: {
  icon: any; value: number; label: string; color: "accent" | "accent2" | "success" | "danger"; sub?: string;
}) {
  const cl =
    color === "success" ? "text-success border-success/30 bg-success/5" :
    color === "accent2" ? "text-accent2 border-accent2/30 bg-accent2/5" :
    color === "danger"  ? "text-danger border-danger/30 bg-danger/5" :
                          "text-accent border-accent/30 bg-accent/5";
  return (
    <div className={`p-3 rounded-xl border ${cl} min-w-0`}>
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider truncate">
        <Icon className="w-3 h-3 shrink-0" /> {label}
      </div>
      <div className="text-2xl font-black mt-0.5 truncate">{value}</div>
      {sub && <div className="text-[10px] text-muted mt-0.5">{sub}</div>}
    </div>
  );
}

function Avatar({ name, url, size = "sm" }: { name: string; url: string | null; size?: "sm" | "md" }) {
  const cl = size === "md" ? "w-10 h-10 text-sm" : "w-8 h-8 text-xs";
  const initials = name.split(" ").map(s => s[0]).slice(0, 2).join("");
  return (
    <div className={`${cl} rounded-xl accent-shine overflow-hidden flex items-center justify-center text-white font-black shrink-0`}>
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" className="w-full h-full object-cover" />
      ) : initials}
    </div>
  );
}

function Leaderboard({ title, icon: Icon, color, items, unit }: {
  title: string;
  icon: any;
  color: "accent" | "accent2" | "success";
  items: { id: string; name: string; avatarUrl: string | null; count: number }[];
  unit: string;
}) {
  const accentCl =
    color === "success" ? "text-success" :
    color === "accent2" ? "text-accent2" : "text-accent";

  const stripCl =
    color === "success" ? "from-emerald-400 to-teal-500" :
    color === "accent2" ? "from-blue-400 to-indigo-500" :
                          "from-amber-400 to-orange-500";

  const medalIcons = [Crown, Medal, Award];

  return (
    <div className="card overflow-hidden">
      <div className={`h-[3px] bg-gradient-to-r ${stripCl}`} />
      <div className="p-4 md:p-5">
        <div className="flex items-center gap-2 mb-3">
          <Icon className={`w-4 h-4 ${accentCl}`} />
          <h3 className="font-semibold">{title}</h3>
        </div>
        {items.length === 0 ? (
          <div className="text-sm text-muted text-center py-4">Поки порожньо</div>
        ) : (
          <div className="space-y-1.5">
            {items.map((c, i) => {
              const Medal = i < 3 ? medalIcons[i] : null;
              const medalCl = i === 0 ? "text-amber-400" : i === 1 ? "text-slate-300" : i === 2 ? "text-orange-400" : "";
              return (
                <Link
                  key={c.id}
                  href={`/admin/clients/${c.id}`}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-surface transition min-w-0"
                >
                  <div className="w-6 text-center shrink-0">
                    {Medal ? <Medal className={`w-4 h-4 ${medalCl} mx-auto`} /> : <span className="text-xs text-muted font-bold">{i + 1}</span>}
                  </div>
                  <Avatar name={c.name} url={c.avatarUrl} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{c.name}</div>
                  </div>
                  <div className={`text-sm font-black tabular-nums shrink-0 ${accentCl}`}>
                    {c.count} <span className="text-muted text-[10px] font-normal">{unit}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
