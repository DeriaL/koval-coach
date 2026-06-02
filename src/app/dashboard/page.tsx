import { requireClient } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { ProgressRing } from "@/components/charts2";
import {
  Flame, Dumbbell, Scale, TrendingDown, Bell, CheckCircle2, Play, ArrowRight, Calendar,
  Sparkles, ChevronRight, Wallet, AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { uk } from "date-fns/locale";
import { calcStreak } from "@/lib/analytics";
import { QuickTaps } from "./QuickTaps";
import { parsePlanContent } from "@/lib/nutritionPlan";
import { kyivStartOfToday, fmtKyivDate } from "@/lib/kyivTime";

export default async function DashboardHome() {
  const user = await requireClient();
  const today = kyivStartOfToday();

  const [checkIns, workoutSessions, reminders, measurements, client, todayWorkouts, upcomingSessions, latestNutritionPlan, pendingPayment] = await Promise.all([
    prisma.checkIn.findMany({ where: { clientId: user.id }, orderBy: { date: "desc" }, take: 60 }),
    prisma.workoutSession.findMany({ where: { clientId: user.id, completed: true, cancelledAt: null }, orderBy: { date: "desc" }, take: 30 }),
    prisma.reminder.findMany({ where: { clientId: user.id, done: false, datetime: { gte: new Date(Date.now() - 86400000) } }, orderBy: { datetime: "asc" }, take: 5 }),
    prisma.measurement.findMany({ where: { clientId: user.id }, orderBy: { date: "asc" } }),
    prisma.user.findUnique({ where: { id: user.id } }),
    prisma.workoutSession.findMany({ where: { clientId: user.id, date: { gte: today } } }),
    prisma.workoutSession.findMany({
      where: { clientId: user.id, scheduledAt: { gte: new Date() }, completed: false, confirmedByTrainer: false, cancelledAt: null },
      orderBy: { scheduledAt: "asc" }, take: 3,
    }),
    prisma.nutritionPlan.findFirst({ where: { clientId: user.id }, orderBy: { updatedAt: "desc" }, select: { content: true } }),
    prisma.payment.findFirst({
      where: { clientId: user.id, status: { in: ["pending", "overdue"] } },
      orderBy: { date: "asc" },
    }),
  ]);

  // Water + steps targets come from the active nutrition plan; fallbacks 3 L / 10k.
  const planData = parsePlanContent(latestNutritionPlan?.content);
  const waterTarget = planData?.waterL ?? 3;
  const stepsTarget = planData?.stepsTarget ?? 10000;

  const streak = calcStreak(checkIns.map(c => c.date));
  const allW = [
    ...checkIns.filter(c => c.weight).map(c => ({ d: c.date, v: c.weight! })),
    ...measurements.filter(m => m.weight).map(m => ({ d: m.date, v: m.weight! })),
  ].sort((a, b) => b.d.getTime() - a.d.getTime());
  const latestWeight = allW[0]?.v;
  const firstWeight = client?.startWeight ?? measurements[0]?.weight;
  const delta = latestWeight && firstWeight ? latestWeight - firstWeight : 0;

  const todayCheckIn = checkIns.find(c => c.date >= today);
  const waterToday = todayCheckIn?.water ?? 0;
  const stepsToday = todayCheckIn?.steps ?? 0;
  const trainedToday = todayWorkouts.filter(w => w.completed).length > 0;

  const ringsData = [
    { label: "Check-in", value: todayCheckIn ? 1 : 0, max: 1, color: "#6366f1" },
    // Pass raw value — the ring visually caps fill at 100% but shows the real
    // number, so e.g. 22 000 steps with a 10k goal still reads as "22k/10k".
    { label: "Вода", value: waterToday, max: waterTarget, color: "#60a5fa" },
    { label: "Кроки", value: stepsToday, max: stepsTarget, color: "#f472b6" },
  ];

  const workoutsLast30 = workoutSessions.filter(s => (Date.now() - s.date.getTime()) < 30 * 86400000).length;
  const firstName = user.name.split(" ")[0];
  const dateLabel = fmtKyivDate(today, { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="space-y-5">
      {/* ============ HERO HEADER ============ */}
      <header className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs uppercase tracking-widest text-muted">{dateLabel}</div>
          <h1 className="text-3xl md:text-4xl font-black mt-1 leading-tight">
            Привіт, <span className="text-gradient">{firstName}</span> 👋
          </h1>
          <p className="text-sm text-muted mt-1">
            {trainedToday ? "Сьогодні зроблено. Чудова робота 💪" : "Час нового дня!"}
          </p>
        </div>
        {streak > 0 && (
          <div className="chip border-accent/40 text-accent shrink-0">
            <Flame className="w-3.5 h-3.5" /> {streak} {pluralUk(streak, ["день", "дні", "днів"])} поспіль
          </div>
        )}
      </header>

      {/* ============ PENDING-PAYMENT ALERT ============ */}
      {pendingPayment && (
        <Link
          href="/dashboard/payments"
          className="group relative block rounded-2xl overflow-hidden border border-danger/40 bg-danger/10 p-4 hover:-translate-y-0.5 transition-transform"
        >
          <div className="flex items-center gap-3">
            <span className="relative h-12 w-12 rounded-xl bg-danger/15 grid place-items-center text-danger shrink-0">
              <Wallet className="w-5 h-5" />
              <span aria-hidden className="absolute inset-0 rounded-xl animate-ping bg-danger/40 -z-10" />
            </span>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] uppercase tracking-widest text-danger font-semibold flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {pendingPayment.status === "overdue" ? "прострочено" : "очікує оплати"}
              </div>
              <div className="font-bold text-base mt-0.5">
                До сплати: <span className="text-danger">{pendingPayment.amount} ₴</span>
              </div>
              <div className="text-xs text-muted truncate mt-0.5">Натисни — деталі та оплата</div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted shrink-0 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </Link>
      )}

      {/* ============ HERO BUTTON «В ЗАЛ» (3D) ============ */}
      <Link
        href="/dashboard/workout"
        className="hero-cta-shadow group relative block rounded-3xl overflow-hidden will-change-transform
                   transition-transform duration-300 hover:-translate-y-0.5 active:translate-y-0.5 active:scale-[.995]"
      >
        {/* gradient base */}
        <div className="absolute inset-0 bg-gradient-to-br from-[rgb(var(--accent2))] via-[rgb(var(--accent))] to-[rgb(var(--accent-soft))]" />
        {/* top sheen — kept (no blur, no edge bleeding) */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_15%,rgba(255,255,255,0.22),transparent_55%)] pointer-events-none" />

        <div className="relative flex items-center gap-4 p-5 md:p-6 text-white">
          <div
            className="h-16 w-16 md:h-[72px] md:w-[72px] rounded-2xl bg-white/15 backdrop-blur-sm grid place-items-center shrink-0"
            style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.35), 0 8px 22px -6px rgba(0,0,0,0.3)" }}
          >
            <Play className="w-7 h-7 md:w-8 md:h-8 fill-current" strokeWidth={1.5} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] uppercase tracking-widest opacity-80 flex items-center gap-1.5">
              {trainedToday ? <><CheckCircle2 className="w-3 h-3" /> сьогодні · готово</> : <><Sparkles className="w-3 h-3" /> час тренуватись</>}
            </div>
            <div className="font-black text-2xl md:text-3xl leading-tight mt-0.5">
              {trainedToday ? "Чудова робота!" : "Час у зал!"}
            </div>
            <div className="text-sm opacity-90 mt-1 truncate">
              {trainedToday ? "Можна переглянути результати або додати ще" : "Натисни — і починаємо"}
            </div>
          </div>
          <ArrowRight className="w-7 h-7 opacity-90 shrink-0 group-hover:translate-x-1 transition-transform" />
        </div>
        {/* inner ring highlight */}
        <span className="pointer-events-none absolute inset-0 rounded-3xl ring-1 ring-inset ring-white/15" />
      </Link>

      {/* ============ СЬОГОДНІШНІ КІЛЬЦЯ ============ */}
      <div className="card overflow-hidden">
        <div className="h-[3px] bg-gradient-to-r from-[rgb(var(--accent))] to-[rgb(var(--accent2))]" />
        <div className="p-5 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm uppercase tracking-wider text-muted">Сьогоднішні кільця</h3>
          </div>
          <div className="grid grid-cols-3 gap-3 md:gap-4 place-items-center">
            {ringsData.map((r) => (
              <div key={r.label} className="flex flex-col items-center gap-1">
                <ProgressRing value={r.value} max={r.max} color={r.color} label={r.label} size={108} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ============ Швидкий приріст води/кроків ============ */}
      <QuickTaps water={waterToday} steps={stepsToday} />

      {/* ============ ШВИДКІ ДІЇ ============ */}
      <div>
        <SectionLabel>Швидкі дії</SectionLabel>
        <div className="grid grid-cols-3 gap-3">
          <QuickAction
            href="/dashboard/check-in"
            icon={Flame}
            title={todayCheckIn ? "Check-in ✓" : "Check-in"}
            done={!!todayCheckIn}
          />
          <QuickAction href="/dashboard/sessions" icon={Calendar} title="Тренування" />
          <QuickAction
            href="/dashboard/analytics"
            icon={TrendingDown}
            title={latestWeight ? `${delta > 0 ? "+" : ""}${delta.toFixed(1)} кг` : "Аналітика"}
          />
        </div>
      </div>

      {/* ============ KPI ============ */}
      <div className="grid grid-cols-3 gap-3">
        <KPI icon={Flame} label="Серія" value={`${streak}`} sub={pluralUk(streak, ["день", "дні", "днів"])} />
        <KPI icon={Dumbbell} label="Тренувань" value={workoutsLast30} sub="за 30 днів" />
        <KPI icon={Scale} label="Вага" value={latestWeight ? latestWeight.toFixed(1) : "—"} sub="кг" />
      </div>

      {/* ============ Найближчі заплановані тренування ============ */}
      {upcomingSessions.length > 0 && (
        <div>
          <SectionLabel>Найближчі тренування</SectionLabel>
          <div className="card p-4 border-accent/30 space-y-2">
            {upcomingSessions.map((s) => (
              <Link
                key={s.id}
                href="/dashboard/sessions"
                className="flex items-center justify-between p-3 rounded-xl bg-surface border border-border hover:border-accent/40 transition-colors"
              >
                <div className="min-w-0">
                  <div className="font-medium text-sm truncate">{s.title}</div>
                  <div className="text-xs text-muted">
                    {new Date(s.scheduledAt!).toLocaleString("uk-UA", { dateStyle: "short", timeStyle: "short", timeZone: "Europe/Kyiv" })}
                    {" · "}{formatDistanceToNow(new Date(s.scheduledAt!), { addSuffix: true, locale: uk })}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ============ Нагадування ============ */}
      {reminders.length > 0 && (
        <div>
          <SectionLabel><Bell className="w-3.5 h-3.5 inline -mt-0.5 mr-1" /> Нагадування</SectionLabel>
          <div className="card p-4 space-y-2">
            {reminders.map((r) => (
              <div key={r.id} className="flex items-center justify-between p-3 rounded-xl bg-surface border border-border">
                <div className="min-w-0">
                  <div className="font-medium text-sm truncate">{r.title}</div>
                  <div className="text-xs text-muted">{formatDistanceToNow(r.datetime, { addSuffix: true, locale: uk })}</div>
                </div>
                <span className="chip text-xs shrink-0">{r.type}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============ Останні тренування ============ */}
      {workoutSessions.length > 0 && (
        <div>
          <SectionLabel><CheckCircle2 className="w-3.5 h-3.5 inline -mt-0.5 mr-1 text-success" /> Останні тренування</SectionLabel>
          <div className="card p-4 space-y-2">
            {workoutSessions.slice(0, 5).map((s) => (
              <Link
                key={s.id}
                href="/dashboard/sessions"
                className="flex items-center justify-between p-3 rounded-xl bg-surface border border-border hover:border-accent/40 transition-colors"
              >
                <div className="min-w-0">
                  <div className="font-medium text-sm truncate">{s.title}</div>
                  <div className="text-xs text-muted">
                    {fmtKyivDate(s.date)}
                    {s.durationSec ? ` · ${Math.round(s.durationSec / 60)} хв` : ""}
                  </div>
                </div>
                <div className="w-2 h-2 rounded-full bg-success shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ───────────── helpers ───────────── */

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[11px] font-semibold uppercase tracking-widest text-muted mb-2.5 px-1">
      {children}
    </h3>
  );
}

function QuickAction({ href, icon: Icon, title, done }: any) {
  return (
    <Link
      href={href}
      className={`card cta-pulse p-4 flex flex-col items-start gap-2.5 hover:-translate-y-0.5 transition-transform border-accent/40 bg-accent/[0.06] ${
        done ? "!border-success/50 !bg-success/10" : ""
      }`}
    >
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center ${
          done ? "bg-success/15 text-success border border-success/40" : "bg-accent/15 text-accent border border-accent/30"
        }`}
      >
        <Icon className="w-5 h-5" />
      </div>
      <div className="font-semibold text-sm leading-tight">{title}</div>
    </Link>
  );
}

function KPI({ icon: Icon, label, value, sub }: any) {
  return (
    <div className="card p-4 relative overflow-hidden">
      <div className="absolute -top-4 -right-4 w-16 h-16 rounded-full bg-accent/10 blur-xl pointer-events-none" />
      <div className="relative flex items-center gap-1.5 text-muted text-[10px] uppercase tracking-widest">
        <Icon className="w-3.5 h-3.5 text-accent shrink-0" strokeWidth={2} />
        <span className="truncate">{label}</span>
      </div>
      <div className="relative text-2xl md:text-3xl font-black mt-1 leading-none">{value}</div>
      {sub && <div className="relative text-[10px] text-muted mt-1 truncate">{sub}</div>}
    </div>
  );
}

function pluralUk(n: number, forms: [string, string, string]) {
  const a = Math.abs(n) % 100;
  const b = a % 10;
  if (a > 10 && a < 20) return forms[2];
  if (b > 1 && b < 5) return forms[1];
  if (b === 1) return forms[0];
  return forms[2];
}
