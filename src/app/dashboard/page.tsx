import { requireClient } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui";
import { ProgressRing } from "@/components/charts2";
import { Flame, Trophy, Dumbbell, Scale, TrendingDown, Bell, CheckCircle2, Play, Target, Droplet, ArrowRight, Calendar } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { uk } from "date-fns/locale";
import { calcStreak } from "@/lib/analytics";
import { QuickTaps } from "./QuickTaps";

export default async function DashboardHome() {
  const user = await requireClient();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [checkIns, workoutSessions, achievements, reminders, measurements, client, habits, todayWorkouts] = await Promise.all([
    prisma.checkIn.findMany({ where: { clientId: user.id }, orderBy: { date: "desc" }, take: 60 }),
    prisma.workoutSession.findMany({ where: { clientId: user.id, completed: true }, orderBy: { date: "desc" }, take: 30 }),
    prisma.achievement.findMany({ where: { clientId: user.id }, orderBy: { earnedAt: "desc" }, take: 4 }),
    prisma.reminder.findMany({ where: { clientId: user.id, done: false, datetime: { gte: new Date(Date.now() - 86400000) } }, orderBy: { datetime: "asc" }, take: 5 }),
    prisma.measurement.findMany({ where: { clientId: user.id }, orderBy: { date: "asc" } }),
    prisma.user.findUnique({ where: { id: user.id } }),
    prisma.habit.findMany({ where: { clientId: user.id, active: true }, include: { logs: { where: { date: today } } }, orderBy: { order: "asc" } }),
    prisma.workoutSession.findMany({ where: { clientId: user.id, date: { gte: today } } }),
  ]);

  const upcomingSessions = await prisma.workoutSession.findMany({
    where: { clientId: user.id, scheduledAt: { gte: new Date() }, completed: false, confirmedByTrainer: false },
    orderBy: { scheduledAt: "asc" }, take: 3,
  });

  const streak = calcStreak(checkIns.map(c => c.date));
  // latest weight across check-ins and measurements
  const allW = [
    ...checkIns.filter(c => c.weight).map(c => ({ d: c.date, v: c.weight! })),
    ...measurements.filter(m => m.weight).map(m => ({ d: m.date, v: m.weight! })),
  ].sort((a, b) => b.d.getTime() - a.d.getTime());
  const latestWeight = allW[0]?.v;
  const firstWeight = client?.startWeight ?? measurements[0]?.weight;
  const delta = latestWeight && firstWeight ? latestWeight - firstWeight : 0;

  const todayCheckIn = checkIns.find(c => c.date >= today);
  const habitsDone = habits.filter(h => h.logs.length > 0).length;
  const waterToday = todayCheckIn?.water ?? 0;
  const stepsToday = todayCheckIn?.steps ?? 0;
  const trainedToday = todayWorkouts.filter(w => w.completed).length > 0;

  // daily rings
  const ringsData = [
    { label: "Check-in", value: todayCheckIn ? 1 : 0, max: 1, color: "#6366f1" },
    { label: "Звички", value: habitsDone, max: Math.max(1, habits.length), color: "#3b82f6" },
    { label: "Вода", value: Math.min(3, waterToday), max: 3, color: "#60a5fa" },
    { label: "Кроки", value: Math.min(10000, stepsToday), max: 10000, color: "#f472b6" },
  ];

  const workoutsLast30 = workoutSessions.filter(s => (Date.now() - s.date.getTime()) < 30 * 86400000).length;

  return (
    <div>
      <PageHeader
        title={`Привіт, ${user.name.split(" ")[0]} 👋`}
        subtitle={trainedToday ? "Тренування сьогодні — зроблено! 💪" : "Готовий до нового дня?"}
      />

      {/* Progress Rings */}
      <div className="card p-5 md:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Сьогоднішні кільця</h3>
          <div className="text-xs text-muted">{today.toLocaleDateString("uk-UA", { weekday: "long", day: "numeric", month: "long" })}</div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 place-items-center">
          {ringsData.map((r) => (
            <div key={r.label} className="flex flex-col items-center gap-1">
              <ProgressRing value={r.value} max={r.max} color={r.color} label={r.label} size={110} />
            </div>
          ))}
        </div>
      </div>

      {/* Quick water + steps tap */}
      <QuickTaps water={waterToday} steps={stepsToday} />

      {/* Quick actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mt-4">
        <QuickAction href="/dashboard/check-in" icon={Flame} title={todayCheckIn ? "Check-in ✓" : "Check-in"} done={!!todayCheckIn} />
        <QuickAction href="/dashboard/workout" icon={Play} title="В зал" accent />
        <QuickAction href="/dashboard/habits" icon={Target} title={`Звички ${habitsDone}/${habits.length}`} done={habitsDone === habits.length && habits.length > 0} />
        <QuickAction href="/dashboard/analytics" icon={TrendingDown} title={`${delta > 0 ? "+" : ""}${delta.toFixed(1)} кг`} />
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3 md:gap-4 mt-4">
        <KPI icon={Flame} label="Streak" value={`${streak} дн`} />
        <KPI icon={Dumbbell} label="Тренувань" value={workoutsLast30} sub="за 30 днів" />
        <KPI icon={Scale} label="Вага" value={latestWeight ? `${latestWeight.toFixed(1)}` : "—"} sub="кг" />
      </div>

      {/* Upcoming planned sessions */}
      {upcomingSessions.length > 0 && (
        <div className="card p-5 mt-4 border-accent/30">
          <h3 className="font-semibold flex items-center gap-2 mb-3"><Calendar className="w-4 h-4 text-accent" /> Найближчі тренування з тренером</h3>
          <div className="space-y-2">
            {upcomingSessions.map((s) => (
              <div key={s.id} className="flex items-center justify-between p-3 rounded-xl bg-surface border border-border">
                <div className="min-w-0">
                  <div className="font-medium text-sm truncate">{s.title}</div>
                  <div className="text-xs text-muted">
                    {new Date(s.scheduledAt!).toLocaleString("uk-UA", { dateStyle: "short", timeStyle: "short" })}
                    {" · "}{formatDistanceToNow(new Date(s.scheduledAt!), { addSuffix: true, locale: uk })}
                  </div>
                </div>
                <span className="chip text-xs text-accent border-accent/40">заплановано</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reminders */}
      {reminders.length > 0 && (
        <div className="card p-5 mt-4">
          <h3 className="font-semibold flex items-center gap-2"><Bell className="w-4 h-4 text-accent" /> Нагадування</h3>
          <div className="mt-3 space-y-2">
            {reminders.map((r) => (
              <div key={r.id} className="flex items-center justify-between p-3 rounded-xl bg-surface border border-border">
                <div>
                  <div className="font-medium text-sm">{r.title}</div>
                  <div className="text-xs text-muted">{formatDistanceToNow(r.datetime, { addSuffix: true, locale: uk })}</div>
                </div>
                <span className="chip text-xs">{r.type}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Achievements */}
      {achievements.length > 0 && (
        <div className="card p-5 mt-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold flex items-center gap-2"><Trophy className="w-4 h-4 text-accent" /> Останні ачівки</h3>
            <Link href="/dashboard/achievements" className="text-xs text-accent flex items-center gap-1">Усі <ArrowRight className="w-3 h-3" /></Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {achievements.map((a) => (
              <div key={a.id} className="p-3 rounded-xl bg-surface border border-border">
                <div className="w-8 h-8 rounded-lg bg-accent/10 text-accent flex items-center justify-center mb-2">
                  <Trophy className="w-4 h-4" />
                </div>
                <div className="font-medium text-xs">{a.title}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent workouts */}
      {workoutSessions.length > 0 && (
        <div className="card p-5 mt-4">
          <h3 className="font-semibold flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-success" /> Останні тренування</h3>
          <div className="mt-3 space-y-2">
            {workoutSessions.slice(0, 5).map((s) => (
              <div key={s.id} className="flex items-center justify-between p-3 rounded-xl bg-surface border border-border">
                <div>
                  <div className="font-medium text-sm">{s.title}</div>
                  <div className="text-xs text-muted">{s.date.toLocaleDateString("uk-UA")} · {Math.round((s.durationSec ?? 0)/60)} хв</div>
                </div>
                <div className="w-2 h-2 rounded-full bg-success" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function QuickAction({ href, icon: Icon, title, accent, done }: any) {
  return (
    <Link href={href} className={`card p-4 flex flex-col items-start gap-2 hover:border-accent/40 transition ${accent ? "border-accent/40 bg-accent/5" : ""} ${done ? "border-success/40" : ""}`}>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${accent ? "accent-shine text-white" : done ? "bg-success/10 text-success" : "bg-surface border border-border text-accent"}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="font-semibold text-sm">{title}</div>
    </Link>
  );
}

function KPI({ icon: Icon, label, value, sub }: any) {
  return (
    <div className="card p-4">
      <div className="flex items-center gap-2 text-muted text-xs uppercase tracking-wider"><Icon className="w-3.5 h-3.5" /> {label}</div>
      <div className="text-xl md:text-2xl font-bold mt-1">{value}</div>
      {sub && <div className="text-xs text-muted mt-0.5">{sub}</div>}
    </div>
  );
}
