import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui";
import Link from "next/link";
import { Plus, Mail, Target, Flame, ChevronRight, Wifi, Crown, Dumbbell, Wallet, AlertTriangle, Star, Search, Ticket } from "lucide-react";
import { ClientSearch } from "./ClientSearch";
import { PayReminderButton } from "./PayReminderButton";
import { kyivDayKey } from "@/lib/kyivTime";
import { getSessionPeriodCounts } from "@/lib/sessionPeriod";

const DUE_PAYMENT = { some: { status: { in: ["pending", "overdue"] } } };

export default async function AdminHome({ searchParams }: { searchParams: { format?: string; q?: string } }) {
  const format = searchParams?.format === "online" ? "online"
    : searchParams?.format === "offline" ? "offline"
    : searchParams?.format === "due" ? "due"
    : "all";
  const planFilter = format === "online" ? { coachingPlan: "ONLINE" }
    : format === "offline" ? { coachingPlan: "FULL" }
    : format === "due" ? { payments: DUE_PAYMENT }
    : {};

  const q = (searchParams?.q ?? "").trim();
  const searchFilter = q
    ? {
        OR: [
          { firstName: { contains: q, mode: "insensitive" as const } },
          { lastName:  { contains: q, mode: "insensitive" as const } },
          { email:     { contains: q, mode: "insensitive" as const } },
          { phone:     { contains: q, mode: "insensitive" as const } },
        ],
      }
    : {};

  const [clients, awaiting, planCounts] = await Promise.all([
    prisma.user.findMany({
      where: { role: "CLIENT", ...planFilter, ...searchFilter },
      include: {
        measurements: { orderBy: { date: "desc" }, take: 1 },
        checkIns: { orderBy: { date: "desc" }, take: 7 },
        payments: { orderBy: { date: "desc" }, take: 3 },
      },
      orderBy: [{ isVip: "desc" }, { firstName: "asc" }, { lastName: "asc" }],
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

  // Global count of clients with an outstanding invoice (independent of the
  // current filter) — drives the "До оплати" chip.
  const dueCount = await prisma.user.count({ where: { role: "CLIENT", payments: DUE_PAYMENT } });

  const onlineCount = planCounts.find(p => p.coachingPlan === "ONLINE")?._count._all ?? 0;
  const offlineCount = planCounts.find(p => p.coachingPlan === "FULL")?._count._all ?? 0;
  const totalAll = planCounts.reduce((a, p) => a + p._count._all, 0);

  // Current-period session counts per client (ONLINE = this month, others =
  // since last payment). Resets are what the trainer wants to see.
  const periodCounts = await getSessionPeriodCounts(clients);
  const totalSessions = clients.reduce((a, c) => a + (periodCounts.get(c.id) ?? 0), 0);
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

      {/* Search */}
      <div className="mb-3">
        <ClientSearch defaultValue={q} />
      </div>

      {/* Format filter */}
      <div className="flex items-center gap-2 mb-4 overflow-x-auto scrollbar-thin -mx-4 px-4 md:mx-0 md:px-0">
        <FilterChip href={`/admin${q ? `?q=${encodeURIComponent(q)}` : ""}`} label="Усі" count={totalAll} active={format === "all"} />
        <FilterChip href={`/admin?format=online${q ? `&q=${encodeURIComponent(q)}` : ""}`} label="Онлайн" count={onlineCount} active={format === "online"} icon="wifi" />
        <FilterChip href={`/admin?format=offline${q ? `&q=${encodeURIComponent(q)}` : ""}`} label="Офлайн" count={offlineCount} active={format === "offline"} icon="crown" />
        <FilterChip href={`/admin?format=due${q ? `&q=${encodeURIComponent(q)}` : ""}`} label="До оплати" count={dueCount} active={format === "due"} icon="wallet" />
      </div>

      {/* Empty search result */}
      {q && clients.length === 0 && (
        <div className="card p-8 text-center mb-4">
          <Search className="w-8 h-8 mx-auto text-muted mb-2" />
          <div className="text-muted">Нікого не знайдено за запитом <b className="text-text">«{q}»</b></div>
        </div>
      )}

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
                  <div className="text-xs text-muted">{new Date(s.scheduledAt!).toLocaleString("uk-UA", { dateStyle: "short", timeStyle: "short", timeZone: "Europe/Kyiv" })}</div>
                </div>
                <span className="chip text-xs text-accent2 border-accent2/40">підтвердити →</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 stagger">
        {clients.map((c, i) => {
          const latest = c.measurements[0];
          const delta = latest && c.startWeight ? latest.weight! - c.startWeight : 0;
          const streakDays = new Set(c.checkIns.map((x) => kyivDayKey(x.date))).size;
          const pendingPay = c.payments.find(p => p.status === "pending" || p.status === "overdue");
          const sessions = periodCounts.get(c.id) ?? 0;
          const toNextMilestone = Math.max(0, 10 - sessions);
          const isOnline = c.coachingPlan === "ONLINE";
          const isDropIn = c.coachingPlan === "DROP_IN";
          const owesPackage = !isOnline && !isDropIn && !pendingPay && sessions >= 10;

          return (
            <Link
              key={c.id}
              href={`/admin/clients/${c.id}`}
              style={{ ["--i" as any]: i }}
              className="card p-4 sm:p-5 card-hover group relative block overflow-hidden"
            >
              {pendingPay && (
                <div className="absolute top-2 right-2 chip bg-accent2/15 border-accent2/40 text-accent2 text-[10px] animate-pulse-ring">
                  <AlertTriangle className="w-3 h-3" /> оплата
                </div>
              )}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl accent-shine overflow-hidden flex items-center justify-center text-white text-lg font-black shrink-0">
                  {c.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.avatarUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <>{c.firstName[0]}{c.lastName[0]}</>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold flex items-center gap-1.5 min-w-0">
                    {c.isVip && <Star className="w-3.5 h-3.5 text-yellow-400 fill-current shrink-0" />}
                    <span className="truncate min-w-0">{c.firstName} {c.lastName}</span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={`chip text-[10px] shrink-0 py-0 px-1.5 ${
                      isDropIn ? "border-yellow-400/40 text-yellow-400" :
                      isOnline ? "border-accent2/40 text-accent2" :
                                 "border-accent/40 text-accent"
                    }`}>
                      {isDropIn ? <><Ticket className="w-2.5 h-2.5" /> Разово</> :
                       isOnline ? <><Wifi className="w-2.5 h-2.5" /> Онлайн</> :
                                  <><Crown className="w-2.5 h-2.5" /> Офлайн</>}
                    </span>
                    <div className="text-xs text-muted truncate min-w-0 flex items-center gap-1">
                      <Mail className="w-3 h-3 shrink-0" /> <span className="truncate">{c.email}</span>
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted group-hover:text-accent transition shrink-0" />
              </div>

              {c.goal && (
                <div className="mt-3 text-sm flex items-start gap-2 text-muted">
                  <Target className="w-3.5 h-3.5 mt-0.5 text-accent shrink-0" />
                  <span className="line-clamp-1">{c.goal}</span>
                </div>
              )}

              {/* Workout progress — only meaningful for FULL (10-pack) clients */}
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs mb-1 gap-2">
                  <span className="text-muted flex items-center gap-1 min-w-0 truncate">
                    <Dumbbell className="w-3 h-3 shrink-0" /> Тренувань: <b className="text-text">{sessions}</b>
                  </span>
                  {isOnline ? (
                    <span className="text-muted shrink-0">підписка: місяць</span>
                  ) : isDropIn ? (
                    <span className="text-muted shrink-0">оплата: за сесію</span>
                  ) : owesPackage ? (
                    <span className="text-danger font-semibold shrink-0">час оплатити!</span>
                  ) : (
                    <span className="text-muted shrink-0">до оплати: {toNextMilestone}</span>
                  )}
                </div>
                {!isOnline && !isDropIn && (
                  <div className="h-1.5 rounded-full bg-surface overflow-hidden">
                    <div className="h-full accent-shine transition-all" style={{ width: `${(Math.min(sessions, 10) / 10) * 100}%` }} />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2 mt-3">
                <div className="p-2 rounded-lg bg-surface border border-border min-w-0">
                  <div className="text-[10px] text-muted uppercase truncate">Вага</div>
                  <div className="text-sm font-bold truncate">{latest?.weight?.toFixed(1) ?? "—"}</div>
                </div>
                <div className="p-2 rounded-lg bg-surface border border-border min-w-0">
                  <div className="text-[10px] text-muted uppercase truncate">Зміна, кг</div>
                  <div className={`text-sm font-bold truncate ${delta < 0 ? "text-success" : delta > 0 ? "text-danger" : ""}`}>
                    {delta > 0 ? "+" : ""}{delta.toFixed(1)}
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-surface border border-border min-w-0">
                  <div className="text-[10px] text-muted uppercase flex items-center gap-0.5 truncate"><Flame className="w-2.5 h-2.5 shrink-0" /> Streak</div>
                  <div className="text-sm font-bold truncate">{streakDays}</div>
                </div>
              </div>

              {pendingPay ? (
                <div className="mt-3 text-xs flex items-center justify-between gap-2 p-2 rounded-lg bg-accent2/10 border border-accent2/30 text-accent2">
                  <span className="flex items-center gap-1 min-w-0 truncate"><Wallet className="w-3 h-3 shrink-0" /> {pendingPay.amount} ₴</span>
                  <PayReminderButton clientId={c.id} />
                </div>
              ) : isOnline && (c as any).priceMonthly ? (
                <div className="mt-3 text-[11px] text-muted flex items-center justify-between gap-2">
                  <span className="truncate min-w-0">Місячна підписка</span>
                  <span className="text-text font-medium shrink-0">{(c as any).priceMonthly} ₴</span>
                </div>
              ) : isDropIn && (c as any).pricePerSession ? (
                <div className="mt-3 text-[11px] text-muted flex items-center justify-between gap-2">
                  <span className="truncate min-w-0">За одне тренування</span>
                  <span className="text-text font-medium shrink-0">{(c as any).pricePerSession} ₴</span>
                </div>
              ) : c.pricePer10 ? (
                <div className="mt-3 text-[11px] text-muted flex items-center justify-between gap-2">
                  <span className="truncate min-w-0">Пакет 10 тренувань</span>
                  <span className="text-text font-medium shrink-0">{c.pricePer10} ₴</span>
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

function FilterChip({ href, label, count, active, icon }: { href: string; label: string; count: number; active: boolean; icon?: "wifi" | "crown" | "wallet" }) {
  const Icon = icon === "wifi" ? Wifi : icon === "crown" ? Crown : icon === "wallet" ? Wallet : null;
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
