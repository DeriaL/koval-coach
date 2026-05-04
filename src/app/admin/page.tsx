import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { uk } from "date-fns/locale";
import { Plus, Mail, Target, Flame, ChevronRight, Wifi, Crown, Dumbbell, Wallet, AlertTriangle, Trophy, Flame as FlameI, CheckCircle2, Activity, Star } from "lucide-react";

export default async function AdminHome({ searchParams }: { searchParams: { format?: string } }) {
  const since = new Date(Date.now() - 3 * 86400000);
  const format = searchParams?.format === "online" ? "online" : searchParams?.format === "offline" ? "offline" : "all";
  const planFilter = format === "online" ? { coachingPlan: "ONLINE" } : format === "offline" ? { coachingPlan: "FULL" } : {};

  const [clients, recentSessions, recentCheckIns, recentPRs, awaiting, planCounts] = await Promise.all([
    prisma.user.findMany({
      where: { role: "CLIENT", ...planFilter },
      include: {
        measurements: { orderBy: { date: "desc" }, take: 1 },
        checkIns: { orderBy: { date: "desc" }, take: 7 },
        payments: { orderBy: { date: "desc" }, take: 3 },
        _count: { select: { sessions: { where: { OR: [{ completed: true }, { confirmedByTrainer: true }] } } } },
      },
      orderBy: [{ isVip: "desc" }, { firstName: "asc" }, { lastName: "asc" }],
    }),
    prisma.workoutSession.findMany({
      where: { OR: [{ completed: true }, { confirmedByTrainer: true }], date: { gte: since }, client: { role: "CLIENT" } },
      include: { client: { select: { firstName: true, lastName: true, id: true } } },
      orderBy: { date: "desc" },
      take: 8,
    }),
    prisma.checkIn.findMany({
      where: { date: { gte: since }, client: { role: "CLIENT" } },
      include: { client: { select: { firstName: true, lastName: true, id: true } } },
      orderBy: { date: "desc" },
      take: 8,
    }),
    prisma.sessionSet.findMany({
      where: { isPR: true, session: { date: { gte: since }, completed: true, client: { role: "CLIENT" } } },
      include: { session: { include: { client: { select: { firstName: true, lastName: true, id: true } } } } },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
    prisma.workoutSession.findMany({
      where: {
        scheduledAt: { lt: new Date() },
        completed: false,
        confirmedByTrainer: false,
        cancelledAt: null,
        client: { role: "CLIENT" },
      },
      include: { client: { select: { firstName: true, lastName: true, id: true } } },
      orderBy: { scheduledAt: "desc" },
    }),
    prisma.user.groupBy({ by: ["coachingPlan"], where: { role: "CLIENT" }, _count: { _all: true } }),
  ]);

  const onlineCount = planCounts.find(p => p.coachingPlan === "ONLINE")?._count._all ?? 0;
  const offlineCount = planCounts.find(p => p.coachingPlan === "FULL")?._count._all ?? 0;
  const totalAll = onlineCount + offlineCount;

  type FeedItem = { id: string; t: Date; type: "session" | "checkin" | "pr"; clientId: string; name: string; text: string };
  const feed: FeedItem[] = [
    ...recentSessions.map(s => ({ id: "s" + s.id, t: s.date, type: "session" as const, clientId: s.clientId, name: `${s.client.firstName} ${s.client.lastName}`, text: `завершив(ла) тренування «${s.title}»` })),
    ...recentCheckIns.map(c => ({ id: "c" + c.id, t: c.date, type: "checkin" as const, clientId: c.clientId, name: `${c.client.firstName} ${c.client.lastName}`, text: `зробив(ла) check-in${c.weight ? ` · ${c.weight.toFixed(1)} кг` : ""}` })),
    ...recentPRs.map(p => ({ id: "p" + p.id, t: p.session.date, type: "pr" as const, clientId: p.session.clientId, name: `${p.session.client.firstName} ${p.session.client.lastName}`, text: `🏆 рекорд: ${p.exerciseName} ${p.weight ? p.weight.toFixed(1) : "?"}×${p.reps}` })),
  ].sort((a, b) => b.t.getTime() - a.t.getTime()).slice(0, 12);

  const totalSessions = clients.reduce((a, c) => a + c._count.sessions, 0);
  const duePayments = clients.filter(c => c.payments.some(p => p.status === "pending" || p.status === "overdue")).length;

  return (
    <div className="max-w-6xl">
      <PageHeader
        title="Клієнти"
        subtitle={`Всього: ${clients.length} · Тренувань: ${totalSessions}${duePayments ? ` · ⚠ ${duePayments} до оплати` : ""}`}
        action={
          <Link href="/admin/clients/new" className="btn btn-primary">
            <Plus className="w-4 h-4" /> Додати клієнта
          </Link>
        }
      />

      {/* Format filter */}
      <div className="flex items-center gap-2 mb-4 overflow-x-auto scrollbar-thin -mx-4 px-4 md:mx-0 md:px-0">
        <FilterChip href="/admin" label="Усі" count={totalAll} active={format === "all"} />
        <FilterChip href="/admin?format=online" label="Онлайн" count={onlineCount} active={format === "online"} icon="wifi" />
        <FilterChip href="/admin?format=offline" label="Офлайн" count={offlineCount} active={format === "offline"} icon="crown" />
      </div>

      {/* Awaiting confirmation */}
      {awaiting.length > 0 && (
        <div className="card p-5 mb-4 border-accent2/40 bg-accent2/5">
          <h3 className="font-semibold flex items-center gap-2 text-accent2"><AlertTriangle className="w-4 h-4" /> Підтверди тренування ({awaiting.length})</h3>
          <div className="mt-3 space-y-2">
            {awaiting.map((s) => (
              <Link key={s.id} href={`/admin/clients/${s.clientId}?tab=sessions`}
                className="flex items-center justify-between p-3 rounded-xl bg-surface border border-border hover:border-accent2/50 transition">
                <div className="min-w-0">
                  <div className="font-medium text-sm truncate">{s.client.firstName} {s.client.lastName} · {s.title}</div>
                  <div className="text-xs text-muted">{new Date(s.scheduledAt!).toLocaleString("uk-UA", { dateStyle: "short", timeStyle: "short" })}</div>
                </div>
                <span className="chip text-xs text-accent2 border-accent2/40">підтвердити →</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Activity feed (last 72h) */}
      {feed.length > 0 && (
        <div className="card p-5 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold flex items-center gap-2"><Activity className="w-4 h-4 text-accent" /> Активність клієнтів · 72 год</h3>
            <span className="text-xs text-muted">{feed.length} подій</span>
          </div>
          <div className="space-y-2">
            {feed.map((it) => {
              const Icon = it.type === "pr" ? Trophy : it.type === "session" ? Dumbbell : CheckCircle2;
              const accent = it.type === "pr" ? "text-accent" : it.type === "session" ? "text-accent2" : "text-success";
              return (
                <Link key={it.id} href={`/admin/clients/${it.clientId}`} className="flex items-center gap-3 p-2.5 rounded-xl bg-surface border border-border hover:border-accent/40 hover:-translate-y-0.5 transition">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-card ${accent}`}><Icon className="w-4 h-4" /></div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm truncate"><b>{it.name}</b> <span className="text-muted">{it.text}</span></div>
                    <div className="text-[11px] text-muted">{formatDistanceToNow(it.t, { addSuffix: true, locale: uk })}</div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 stagger">
        {clients.map((c, i) => {
          const latest = c.measurements[0];
          const delta = latest && c.startWeight ? latest.weight! - c.startWeight : 0;
          const streakDays = new Set(c.checkIns.map((x) => x.date.toISOString().slice(0, 10))).size;
          const pendingPay = c.payments.find(p => p.status === "pending" || p.status === "overdue");
          const sessions = c._count.sessions;
          const nextMilestone = Math.ceil((sessions + 1) / 10) * 10;
          const toNextMilestone = nextMilestone - sessions;
          const isOnline = c.coachingPlan === "ONLINE";

          return (
            <Link
              key={c.id}
              href={`/admin/clients/${c.id}`}
              style={{ ["--i" as any]: i }}
              className="card p-5 card-hover group relative"
            >
              {pendingPay && (
                <div className="absolute -top-2 -right-2 chip bg-accent2/15 border-accent2/40 text-accent2 text-[10px] animate-pulse-ring">
                  <AlertTriangle className="w-3 h-3" /> оплата
                </div>
              )}
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl accent-shine overflow-hidden flex items-center justify-center text-white text-lg font-black shrink-0">
                  {c.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.avatarUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <>{c.firstName[0]}{c.lastName[0]}</>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate flex items-center gap-2">
                    {c.isVip && <Star className="w-3.5 h-3.5 text-yellow-400 fill-current shrink-0" />}
                    <span className="truncate">{c.firstName} {c.lastName}</span>
                    <span className={`chip text-[10px] shrink-0 ${isOnline ? "border-accent2/40 text-accent2" : "border-accent/40 text-accent"}`}>
                      {isOnline ? <><Wifi className="w-2.5 h-2.5" /> Онлайн</> : <><Crown className="w-2.5 h-2.5" /> Офлайн</>}
                    </span>
                  </div>
                  <div className="text-xs text-muted truncate flex items-center gap-1">
                    <Mail className="w-3 h-3" /> {c.email}
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted group-hover:text-accent group-hover:translate-x-1 transition" />
              </div>

              {c.goal && (
                <div className="mt-3 text-sm flex items-start gap-2 text-muted">
                  <Target className="w-3.5 h-3.5 mt-0.5 text-accent shrink-0" />
                  <span className="line-clamp-1">{c.goal}</span>
                </div>
              )}

              {/* Workout progress to next 10-pack */}
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-muted flex items-center gap-1"><Dumbbell className="w-3 h-3" /> Тренувань: <b className="text-text">{sessions}</b></span>
                  <span className="text-muted">до оплати: {toNextMilestone}</span>
                </div>
                <div className="h-1.5 rounded-full bg-surface overflow-hidden">
                  <div className="h-full accent-shine transition-all" style={{ width: `${((sessions % 10) / 10) * 100}%` }} />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mt-3">
                <div className="p-2 rounded-lg bg-surface border border-border">
                  <div className="text-[10px] text-muted uppercase">Вага</div>
                  <div className="text-sm font-bold">{latest?.weight?.toFixed(1) ?? "—"}</div>
                </div>
                <div className="p-2 rounded-lg bg-surface border border-border">
                  <div className="text-[10px] text-muted uppercase">Δ кг</div>
                  <div className={`text-sm font-bold ${delta < 0 ? "text-success" : delta > 0 ? "text-danger" : ""}`}>
                    {delta > 0 ? "+" : ""}{delta.toFixed(1)}
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-surface border border-border">
                  <div className="text-[10px] text-muted uppercase flex items-center gap-0.5"><Flame className="w-2.5 h-2.5" /> Streak</div>
                  <div className="text-sm font-bold">{streakDays}</div>
                </div>
              </div>

              {pendingPay ? (
                <div className="mt-3 text-xs flex items-center justify-between p-2 rounded-lg bg-accent2/10 border border-accent2/30 text-accent2">
                  <span className="flex items-center gap-1"><Wallet className="w-3 h-3" /> Очікує оплати</span>
                  <span className="font-bold">{pendingPay.amount} ₴</span>
                </div>
              ) : c.pricePer10 ? (
                <div className="mt-3 text-[11px] text-muted flex items-center justify-between">
                  <span>Пакет 10 тренувань</span>
                  <span className="text-text font-medium">{c.pricePer10} ₴</span>
                </div>
              ) : null}
            </Link>
          );
        })}
      </div>

      {clients.length === 0 && (
        <div className="card p-10 text-center">
          <p className="text-muted">Поки немає клієнтів.</p>
          <Link href="/admin/clients/new" className="btn btn-primary mt-4 inline-flex">
            <Plus className="w-4 h-4" /> Додати першого
          </Link>
        </div>
      )}
    </div>
  );
}

function FilterChip({ href, label, count, active, icon }: { href: string; label: string; count: number; active: boolean; icon?: "wifi" | "crown" }) {
  const Icon = icon === "wifi" ? Wifi : icon === "crown" ? Crown : null;
  return (
    <Link
      href={href}
      className={`shrink-0 inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm border transition active:scale-95 ${
        active
          ? "accent-shine text-white border-transparent shadow-glow"
          : "bg-surface border-border hover:border-accent/40"
      }`}
    >
      {Icon && <Icon className="w-3.5 h-3.5" />}
      {label}
      <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full ${active ? "bg-white/20" : "bg-card text-muted"}`}>{count}</span>
    </Link>
  );
}
