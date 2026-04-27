import { requireClient } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui";
import { Calendar, Clock, Sparkles, Dumbbell, AlertCircle, Activity, Download } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { uk } from "date-fns/locale";
import { googleCalendarUrl } from "@/lib/calendar";

export default async function ClientSessions() {
  const u = await requireClient();
  const now = new Date();
  const weekAhead = new Date(now.getTime() + 30 * 86400000);
  const monthAgo = new Date(now.getTime() - 60 * 86400000);

  const [awaiting, upcoming, done, total] = await Promise.all([
    prisma.workoutSession.findMany({
      where: { clientId: u.id, scheduledAt: { lt: now }, completed: false, confirmedByTrainer: false },
      orderBy: { scheduledAt: "desc" },
    }),
    prisma.workoutSession.findMany({
      where: { clientId: u.id, scheduledAt: { gte: now, lte: weekAhead }, completed: false, confirmedByTrainer: false },
      orderBy: { scheduledAt: "asc" },
    }),
    prisma.workoutSession.findMany({
      where: { clientId: u.id, OR: [{ completed: true }, { confirmedByTrainer: true }], date: { gte: monthAgo } },
      include: { sets: true },
      orderBy: { date: "desc" },
      take: 50,
    }),
    prisma.workoutSession.count({ where: { clientId: u.id, OR: [{ completed: true }, { confirmedByTrainer: true }] } }),
  ]);

  // Group upcoming by day
  const upcomingByDay = new Map<string, typeof upcoming>();
  for (const s of upcoming) {
    const k = new Date(s.scheduledAt!).toLocaleDateString("uk-UA", { weekday: "long", day: "numeric", month: "long" });
    const arr = upcomingByDay.get(k) ?? [];
    arr.push(s); upcomingByDay.set(k, arr);
  }

  const nextMilestone = Math.ceil((total + 1) / 10) * 10;
  const toGo = nextMilestone - total;

  return (
    <div>
      <PageHeader
        title="Мої тренування"
        subtitle="Заплановані та пройдені сесії"
        action={
          <a href="/api/calendar/sessions.ics?scope=mine" download className="btn text-sm">
            <Download className="w-4 h-4" /> <span className="hidden sm:inline">.ics</span>
          </a>
        }
      />

      {/* KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-5">
        <Kpi icon={Sparkles} label="Всього тренувань" value={total} sub={`до ${nextMilestone}: ${toGo}`} />
        <Kpi icon={Calendar} label="Заплановано" value={upcoming.length} color="accent" />
        <Kpi icon={AlertCircle} label="Очікують" value={awaiting.length} color="accent2" sub={awaiting.length ? "тренер підтвердить" : "—"} />
        <Kpi icon={Activity} label="За 60 днів" value={done.length} color="success" />
      </div>

      {/* Awaiting (informational only — trainer confirms) */}
      {awaiting.length > 0 && (
        <Section icon={AlertCircle} title="Очікують підтвердження тренера" accent="accent2" count={awaiting.length}>
          <div className="space-y-2">
            {awaiting.map((s) => (
              <div key={s.id} className="card p-4 border-accent2/30 bg-accent2/5 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent2/15 text-accent2 flex items-center justify-center"><AlertCircle className="w-5 h-5" /></div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{s.title}</div>
                  <div className="text-xs text-muted">
                    {new Date(s.scheduledAt!).toLocaleString("uk-UA", { dateStyle: "short", timeStyle: "short" })} · тренер ще не підтвердив
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Upcoming grouped */}
      {upcoming.length > 0 && (
        <Section icon={Clock} title="Заплановані" accent="accent" count={upcoming.length}>
          <div className="space-y-5">
            {Array.from(upcomingByDay.entries()).map(([day, arr]) => (
              <div key={day}>
                <div className="flex items-center gap-3 mb-2">
                  <div className="text-xs uppercase tracking-wider text-accent font-semibold">{day}</div>
                  <div className="flex-1 h-px bg-border" />
                  <div className="chip text-[10px]">{arr.length}</div>
                </div>
                <div className="space-y-2">
                  {arr.map((s) => (
                    <div key={s.id} className="card p-4 card-hover flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-accent/15 text-accent flex items-center justify-center"><Calendar className="w-5 h-5" /></div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{s.title}</div>
                        <div className="text-xs text-muted truncate">
                          {new Date(s.scheduledAt!).toLocaleString("uk-UA", { hour: "2-digit", minute: "2-digit" })} · {formatDistanceToNow(new Date(s.scheduledAt!), { addSuffix: true, locale: uk })}
                        </div>
                        {s.notes && <div className="text-[11px] text-muted mt-1 truncate">📝 {s.notes}</div>}
                      </div>
                      <a href={googleCalendarUrl({ id: s.id, title: s.title, scheduledAt: s.scheduledAt, notes: s.notes })}
                        target="_blank" rel="noreferrer" title="Додати в Google Calendar"
                        className="btn text-xs py-2 hover:border-accent/50 hover:text-accent shrink-0">📅</a>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Completed */}
      {done.length > 0 && (
        <Section icon={Sparkles} title="Виконані · 60 днів" accent="success" count={done.length}>
          <div className="space-y-2">
            {done.map((s) => (
              <div key={s.id} className="card p-4 card-hover flex items-center gap-3 border-success/20 bg-success/5">
                <div className="w-10 h-10 rounded-xl bg-success/15 text-success flex items-center justify-center"><Dumbbell className="w-5 h-5" /></div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{s.title}</div>
                  <div className="text-xs text-muted flex items-center gap-2 flex-wrap">
                    <span>{new Date(s.date).toLocaleDateString("uk-UA")}</span>
                    {s.durationSec ? <span>· {Math.round(s.durationSec/60)} хв</span> : null}
                    {s.sets.length > 0 ? <span>· {s.sets.length} підходів</span> : null}
                    {s.confirmedByTrainer ? <span className="chip text-[9px] py-0 px-1.5">тренер</span> : <span className="chip text-[9px] py-0 px-1.5">сам</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {awaiting.length === 0 && upcoming.length === 0 && done.length === 0 && (
        <div className="card p-12 text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl accent-shine text-white flex items-center justify-center mb-4">
            <Calendar className="w-7 h-7" />
          </div>
          <h3 className="font-bold text-lg">Сесій ще немає</h3>
          <p className="text-muted text-sm mt-1">Тренер запланує найближчу — побачиш тут.</p>
        </div>
      )}
    </div>
  );
}

function Kpi({ icon: Icon, label, value, sub, color }: any) {
  const cls = color === "accent" ? "text-accent border-accent/30 bg-accent/5"
    : color === "accent2" ? "text-accent2 border-accent2/30 bg-accent2/5"
    : color === "success" ? "text-success border-success/30 bg-success/5" : "";
  return (
    <div className={`card p-4 card-hover ${cls.includes("bg-") ? cls.split(" ")[2] + " " + cls.split(" ")[1] : ""}`}>
      <div className={`flex items-center gap-2 text-[11px] uppercase tracking-wider ${color === "accent" ? "text-accent" : color === "accent2" ? "text-accent2" : color === "success" ? "text-success" : "text-muted"}`}>
        <Icon className="w-3.5 h-3.5" /> {label}
      </div>
      <div className="text-2xl md:text-3xl font-black mt-1.5">{value}</div>
      {sub && <div className="text-[10px] text-muted mt-0.5">{sub}</div>}
    </div>
  );
}

function Section({ icon: Icon, title, count, accent = "accent", children }: any) {
  const accentClass = accent === "accent2" ? "text-accent2" : accent === "success" ? "text-success" : "text-accent";
  return (
    <div className="mb-6">
      <h3 className={`font-semibold flex items-center gap-2 mb-3 ${accentClass}`}>
        <Icon className="w-4 h-4" /> {title}
        <span className="chip text-[10px] py-0.5 px-2">{count}</span>
      </h3>
      {children}
    </div>
  );
}
