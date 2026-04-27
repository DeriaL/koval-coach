import { prisma } from "@/lib/prisma";
import { requireTrainer } from "@/lib/session";
import { PageHeader } from "@/components/ui";
import Link from "next/link";
import { Calendar, AlertTriangle, CheckCircle2, Clock, Sparkles, Dumbbell, Wifi, Crown, Zap, Activity } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { uk } from "date-fns/locale";
import { SessionRowActions } from "./row-actions";
import { ScheduleButton } from "./schedule-button";
import { googleCalendarUrl } from "@/lib/calendar";
import { CalendarPlus, Download } from "lucide-react";

export default async function AdminSessions({ searchParams }: { searchParams: { format?: string; client?: string } }) {
  await requireTrainer();
  const now = new Date();
  const todayStart = new Date(); todayStart.setHours(0,0,0,0);
  const weekAhead = new Date(now.getTime() + 14 * 86400000);
  const monthAgo = new Date(now.getTime() - 30 * 86400000);
  const format = searchParams?.format === "online" ? "online" : searchParams?.format === "offline" ? "offline" : "all";
  const clientFilter = searchParams?.client || "";

  const planWhere = format === "online" ? { coachingPlan: "ONLINE" } : format === "offline" ? { coachingPlan: "FULL" } : {};
  const clientWhere = { role: "CLIENT", ...planWhere, ...(clientFilter ? { id: clientFilter } : {}) };

  const [awaiting, upcoming, completed, allClients, todaySessions] = await Promise.all([
    prisma.workoutSession.findMany({
      where: {
        scheduledAt: { lt: now }, completed: false, confirmedByTrainer: false,
        client: clientWhere as any,
      },
      include: { client: { select: { firstName: true, lastName: true, id: true, coachingPlan: true } } },
      orderBy: { scheduledAt: "desc" },
    }),
    prisma.workoutSession.findMany({
      where: {
        scheduledAt: { gte: now, lte: weekAhead }, completed: false, confirmedByTrainer: false,
        client: clientWhere as any,
      },
      include: { client: { select: { firstName: true, lastName: true, id: true, coachingPlan: true } } },
      orderBy: { scheduledAt: "asc" },
    }),
    prisma.workoutSession.findMany({
      where: {
        OR: [{ completed: true }, { confirmedByTrainer: true }],
        date: { gte: monthAgo },
        client: clientWhere as any,
      },
      include: { client: { select: { firstName: true, lastName: true, id: true, coachingPlan: true } } },
      orderBy: { date: "desc" },
      take: 50,
    }),
    prisma.user.findMany({ where: { role: "CLIENT" }, select: { id: true, firstName: true, lastName: true, coachingPlan: true }, orderBy: { firstName: "asc" } }),
    prisma.workoutSession.count({
      where: {
        scheduledAt: { gte: todayStart, lt: new Date(todayStart.getTime() + 86400000) },
        client: { role: "CLIENT" },
      },
    }),
  ]);

  // Group upcoming by day
  const upcomingByDay = new Map<string, typeof upcoming>();
  for (const s of upcoming) {
    const k = new Date(s.scheduledAt!).toLocaleDateString("uk-UA", { weekday: "long", day: "numeric", month: "long" });
    const arr = upcomingByDay.get(k) ?? [];
    arr.push(s); upcomingByDay.set(k, arr);
  }

  return (
    <div className="max-w-6xl">
      <PageHeader
        title="Тренування"
        subtitle="Розклад сесій з усіма клієнтами"
        action={
          <div className="flex items-center gap-2 flex-wrap">
            <a href={`/api/calendar/sessions.ics${clientFilter ? `?clientId=${clientFilter}` : ""}`}
              className="btn text-sm" download>
              <Download className="w-4 h-4" /> <span className="hidden sm:inline">Експорт .ics</span>
            </a>
            <ScheduleButton clients={allClients} defaultClientId={clientFilter || undefined} />
          </div>
        }
      />

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-5">
        <KpiCard icon={AlertTriangle} label="Підтвердити" value={awaiting.length} color="accent2" pulse={awaiting.length > 0} />
        <KpiCard icon={Calendar} label="Сьогодні" value={todaySessions} color="accent" />
        <KpiCard icon={Clock} label="Найближчі 14 дн." value={upcoming.length} />
        <KpiCard icon={CheckCircle2} label="Виконано · 30 дн." value={completed.length} color="success" />
      </div>

      {/* Filters */}
      <div className="card p-3 md:p-4 mb-5 flex items-center gap-2 overflow-x-auto scrollbar-thin">
        <FilterChip href="/admin/sessions" label="Усі" active={format === "all" && !clientFilter} />
        <FilterChip href="/admin/sessions?format=online" label="Онлайн" icon="wifi" active={format === "online"} />
        <FilterChip href="/admin/sessions?format=offline" label="Офлайн" icon="crown" active={format === "offline"} />
        <div className="ml-auto shrink-0">
          <form action="/admin/sessions" method="get" className="flex items-center gap-1">
            {format !== "all" && <input type="hidden" name="format" value={format} />}
            <select name="client" defaultValue={clientFilter}
              className="select py-1.5 text-xs w-44">
              <option value="">Усі клієнти</option>
              {allClients.map(c => <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>)}
            </select>
            <button type="submit" className="btn text-xs py-1.5">↻</button>
          </form>
        </div>
      </div>

      {/* AWAITING */}
      {awaiting.length > 0 && (
        <Section
          icon={AlertTriangle}
          title="Потребують підтвердження"
          count={awaiting.length}
          accent="accent2"
          subtitle="Тренування, час яких пройшов — підтверди, чи відбулися"
        >
          <div className="space-y-2">
            {awaiting.map(s => (
              <SessionCard key={s.id} session={s} mode="awaiting" />
            ))}
          </div>
        </Section>
      )}

      {/* UPCOMING grouped by day */}
      {upcoming.length > 0 && (
        <Section icon={Clock} title="Заплановані" count={upcoming.length} accent="accent">
          <div className="space-y-5">
            {Array.from(upcomingByDay.entries()).map(([day, sessions]) => (
              <div key={day}>
                <div className="flex items-center gap-3 mb-2">
                  <div className="text-xs uppercase tracking-wider text-accent font-semibold">{day}</div>
                  <div className="flex-1 h-px bg-border" />
                  <div className="chip text-[10px]">{sessions.length}</div>
                </div>
                <div className="space-y-2">
                  {sessions.map(s => <SessionCard key={s.id} session={s} mode="upcoming" />)}
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* COMPLETED */}
      {completed.length > 0 && (
        <Section icon={Sparkles} title="Виконані · 30 днів" count={completed.length} accent="success">
          <div className="space-y-2">
            {completed.map(s => <SessionCard key={s.id} session={s} mode="done" />)}
          </div>
        </Section>
      )}

      {awaiting.length === 0 && upcoming.length === 0 && completed.length === 0 && (
        <div className="card p-12 text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl accent-shine text-white flex items-center justify-center mb-4">
            <Calendar className="w-7 h-7" />
          </div>
          <h3 className="font-bold text-lg">Сесій ще немає</h3>
          <p className="text-muted text-sm mt-1">Натисни «Запланувати» вгорі — і додай першу сесію.</p>
          <div className="mt-4 inline-block"><ScheduleButton clients={allClients} /></div>
        </div>
      )}
    </div>
  );
}

function Section({ icon: Icon, title, subtitle, count, accent = "accent", children }: any) {
  const accentClass = accent === "accent2" ? "text-accent2" : accent === "success" ? "text-success" : "text-accent";
  return (
    <div className="mb-6">
      <div className="flex items-end justify-between mb-3 flex-wrap gap-2">
        <div>
          <h3 className={`font-semibold flex items-center gap-2 ${accentClass}`}>
            <Icon className="w-4 h-4" /> {title}
            <span className="chip text-[10px] py-0.5 px-2">{count}</span>
          </h3>
          {subtitle && <p className="text-xs text-muted mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}

function KpiCard({ icon: Icon, label, value, color = "accent", pulse }: any) {
  const colorMap: Record<string, string> = {
    accent: "text-accent border-accent/30 bg-accent/5",
    accent2: "text-accent2 border-accent2/40 bg-accent2/5",
    success: "text-success border-success/30 bg-success/5",
  };
  const c = colorMap[color] ?? colorMap.accent;
  return (
    <div className={`card card-hover p-4 relative overflow-hidden ${pulse ? "animate-pulse-ring" : ""}`}>
      <div className={`absolute -top-4 -right-4 w-20 h-20 rounded-full opacity-15 ${c.split(" ").find(x => x.startsWith("bg-"))}`} />
      <div className={`flex items-center gap-2 text-xs uppercase tracking-wider ${color === "accent2" ? "text-accent2" : color === "success" ? "text-success" : "text-muted"}`}>
        <Icon className="w-3.5 h-3.5" /> {label}
      </div>
      <div className="text-3xl font-black mt-2">{value}</div>
    </div>
  );
}

function SessionCard({ session, mode }: { session: any; mode: "awaiting" | "upcoming" | "done" }) {
  const isOnline = session.client.coachingPlan === "ONLINE";
  const dt = session.scheduledAt ?? session.date;
  const initials = `${session.client.firstName[0]}${session.client.lastName[0]}`;

  const card =
    mode === "awaiting" ? "border-accent2/40 bg-accent2/5" :
    mode === "upcoming" ? "border-border" :
    "border-success/20 bg-success/5";

  return (
    <div className={`card p-4 ${card} card-hover transition-all`}>
      <div className="flex items-center gap-3 flex-wrap md:flex-nowrap">
        <Link href={`/admin/clients/${session.client.id}`} className="flex items-center gap-3 min-w-0 flex-1 group">
          <div className="w-11 h-11 rounded-xl accent-shine flex items-center justify-center text-white font-black text-sm group-hover:scale-110 transition-transform">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-semibold truncate flex items-center gap-1.5">
              {session.client.firstName} {session.client.lastName}
              <span className={`chip text-[9px] py-0.5 px-1.5 ${isOnline ? "text-accent2 border-accent2/40" : "text-accent border-accent/40"}`}>
                {isOnline ? <Wifi className="w-2.5 h-2.5" /> : <Crown className="w-2.5 h-2.5" />}
                {isOnline ? "Онл" : "Офл"}
              </span>
            </div>
            <div className="text-xs text-muted truncate">{session.title}</div>
          </div>
        </Link>

        <div className="text-right shrink-0 hidden sm:block">
          <div className="text-sm font-medium">
            {new Date(dt).toLocaleString("uk-UA", { hour: "2-digit", minute: "2-digit" })}
          </div>
          <div className="text-[11px] text-muted">
            {mode === "done"
              ? new Date(dt).toLocaleDateString("uk-UA", { day: "2-digit", month: "short" })
              : formatDistanceToNow(new Date(dt), { addSuffix: true, locale: uk })}
          </div>
        </div>

        {(mode === "upcoming" || mode === "awaiting") && (
          <a
            href={googleCalendarUrl({
              id: session.id, title: session.title, scheduledAt: session.scheduledAt, notes: session.notes,
              client: { firstName: session.client.firstName, lastName: session.client.lastName },
            })}
            target="_blank" rel="noreferrer"
            title="Додати в Google Calendar"
            className="btn text-xs py-2 hover:border-accent/50 hover:text-accent shrink-0">
            <CalendarPlus className="w-3.5 h-3.5" />
          </a>
        )}

        <SessionRowActions sessionId={session.id} clientId={session.client.id} mode={mode} />
      </div>

      {session.notes && (
        <div className="mt-3 text-xs text-muted pl-14 line-clamp-1">📝 {session.notes}</div>
      )}
      {mode === "done" && session.durationSec ? (
        <div className="mt-2 pl-14 flex items-center gap-2 text-[11px] text-muted">
          <Activity className="w-3 h-3" /> {Math.round(session.durationSec / 60)} хв
          {session.confirmedByTrainer && <span className="chip text-[9px] py-0.5 px-1.5">підтв. тренером</span>}
          {session.completed && !session.confirmedByTrainer && <span className="chip text-[9px] py-0.5 px-1.5">самостійно</span>}
        </div>
      ) : null}
    </div>
  );
}

function FilterChip({ href, label, active, icon }: { href: string; label: string; active: boolean; icon?: "wifi" | "crown" }) {
  const Icon = icon === "wifi" ? Wifi : icon === "crown" ? Crown : null;
  return (
    <Link href={href}
      className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border transition active:scale-95 ${
        active ? "accent-shine text-white border-transparent shadow-glow" : "bg-surface border-border hover:border-accent/40"
      }`}>
      {Icon && <Icon className="w-3 h-3" />} {label}
    </Link>
  );
}
