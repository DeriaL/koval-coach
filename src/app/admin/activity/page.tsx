import { prisma } from "@/lib/prisma";
import { PageHeader, EmptyState } from "@/components/ui";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { uk } from "date-fns/locale";
import { Activity, Trophy, Dumbbell, CheckCircle2 } from "lucide-react";

export const dynamic = "force-dynamic";

const PRESETS = [
  { hours: 24,  label: "24 год" },
  { hours: 72,  label: "72 год" },
  { hours: 168, label: "7 днів" },
  { hours: 720, label: "30 днів" },
];

export default async function ActivityPage({ searchParams }: { searchParams: { range?: string } }) {
  const hours = Number(searchParams?.range) || 72;
  const since = new Date(Date.now() - hours * 3600_000);

  const [recentSessions, recentCheckIns, recentPRs] = await Promise.all([
    prisma.workoutSession.findMany({
      where: {
        OR: [{ completed: true }, { confirmedByTrainer: true }],
        date: { gte: since },
        client: { role: "CLIENT" },
      },
      include: { client: { select: { firstName: true, lastName: true, id: true } } },
      orderBy: { date: "desc" },
      take: 100,
    }),
    prisma.checkIn.findMany({
      where: { date: { gte: since }, client: { role: "CLIENT" } },
      include: { client: { select: { firstName: true, lastName: true, id: true } } },
      orderBy: { date: "desc" },
      take: 100,
    }),
    prisma.sessionSet.findMany({
      where: {
        isPR: true,
        session: { date: { gte: since }, completed: true, client: { role: "CLIENT" } },
      },
      include: {
        session: { include: { client: { select: { firstName: true, lastName: true, id: true } } } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

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
    sessions: feed.filter(x => x.type === "session").length,
    checkins: feed.filter(x => x.type === "checkin").length,
    prs:      feed.filter(x => x.type === "pr").length,
  };

  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Активність клієнтів"
        subtitle={`${feed.length} подій за останні ${PRESETS.find(p => p.hours === hours)?.label ?? `${hours} год`}`}
      />

      {/* Range filter */}
      <div className="flex items-center gap-2 mb-4 overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0 scrollbar-thin">
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

      {/* Stat chips */}
      {feed.length > 0 && (
        <div className="grid grid-cols-3 gap-2 md:gap-3 mb-4">
          <StatChip icon={Dumbbell} value={counts.sessions} label="Тренувань" color="accent2" />
          <StatChip icon={CheckCircle2} value={counts.checkins} label="Check-in" color="success" />
          <StatChip icon={Trophy} value={counts.prs} label="Рекордів" color="accent" />
        </div>
      )}

      {/* Feed */}
      {feed.length === 0 ? (
        <EmptyState
          icon={Activity}
          title="Активності немає"
          text="За цей період клієнти ще нічого не робили"
        />
      ) : (
        <div className="card p-4 md:p-5">
          <div className="space-y-2">
            {feed.map(it => {
              const Icon =
                it.type === "pr" ? Trophy : it.type === "session" ? Dumbbell : CheckCircle2;
              const accent =
                it.type === "pr" ? "text-accent" :
                it.type === "session" ? "text-accent2" : "text-success";
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
        </div>
      )}
    </div>
  );
}

function StatChip({ icon: Icon, value, label, color }: { icon: any; value: number; label: string; color: "accent" | "accent2" | "success" }) {
  const cl =
    color === "success" ? "text-success border-success/30 bg-success/5" :
    color === "accent2" ? "text-accent2 border-accent2/30 bg-accent2/5" :
                          "text-accent border-accent/30 bg-accent/5";
  return (
    <div className={`p-3 rounded-xl border ${cl} min-w-0`}>
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider truncate">
        <Icon className="w-3 h-3 shrink-0" /> {label}
      </div>
      <div className="text-xl font-black mt-0.5 truncate">{value}</div>
    </div>
  );
}
