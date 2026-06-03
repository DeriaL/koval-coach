import { requireClient } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PageHeader, EmptyState } from "@/components/ui";
import { Wallet, CheckCircle2, Clock, AlertTriangle, Flag, Check, CreditCard } from "lucide-react";
import { PaymentDetails } from "./PaymentDetails";
import { MonobankQR } from "./MonobankQR";
import { PayButton } from "./PayButton";
import { syncClientPendingPayments } from "@/lib/monoSync";
import { getSessionPeriod } from "@/lib/sessionPeriod";

const TOTAL_STOPS = 10;

export default async function PaymentsPage() {
  const u = await requireClient();

  // Safety net: ping Mono for the status of any pending payment that has an
  // attached Mono:<invoiceId> tag. If the webhook didn't fire (Mono retry,
  // network glitch), this guarantees the user always sees the correct state
  // the moment they open the page after paying.
  await syncClientPendingPayments(u.id).catch(() => 0);

  const [list, user] = await Promise.all([
    prisma.payment.findMany({ where: { clientId: u.id }, orderBy: { date: "asc" } }),
    prisma.user.findUnique({ where: { id: u.id }, select: { pricePer10: true, pricePerSession: true, priceMonthly: true, coachingPlan: true, subscriptionStartDate: true, nextBillingDate: true } as any }) as any,
  ]);

  const isDropIn = user?.coachingPlan === "DROP_IN";
  const isOnline = user?.coachingPlan === "ONLINE";

  const paidPayments = list.filter(p => p.status === "paid");
  const paidCount = paidPayments.length;
  const pendingCount = list.filter(p => p.status === "pending" || p.status === "overdue").length;
  const pricePer10 = user?.pricePer10 ?? 0;
  const totalPaid = paidPayments.reduce((s, p) => s + p.amount, 0);

  // Current-period training count — SAME source the trainer's admin badge uses,
  // so the client and the trainer always see identical numbers.
  const period = await getSessionPeriod({ id: u.id, coachingPlan: user?.coachingPlan ?? "FULL" });
  const sessionsSinceLastPayment = period.count;

  // Show auto-pay nudge when 10+ sessions done since last payment and no pending
  const sessionsOverdue = pendingCount === 0 && sessionsSinceLastPayment >= 10;

  // Stops = individual trainings in current package (1..10)
  // Each stop fills as the client completes a session.
  // Stop #10 = last training of the package + payment due.
  const sessionsInPackage = Math.min(sessionsSinceLastPayment, TOTAL_STOPS);
  const stops = Array.from({ length: TOTAL_STOPS }, (_, i) => {
    const isLast = i === TOTAL_STOPS - 1;
    if (i < sessionsInPackage) {
      // Last training of the package — also signals payment due
      if (isLast && pendingCount > 0) return "pending";
      return "done";
    }
    return "empty";
  }) as ("done" | "pending" | "empty")[];

  const statusMap: any = {
    paid: { icon: CheckCircle2, color: "text-success", label: "Оплачено" },
    pending: { icon: Clock, color: "text-accent", label: "Очікує" },
    overdue: { icon: AlertTriangle, color: "text-danger", label: "Прострочено" },
  };

  // ── ONLINE clients: monthly subscription view ────────────────────────────
  if (isOnline) {
    const monthly = (user as any)?.priceMonthly ?? 0;
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthLabel = now.toLocaleDateString("uk-UA", { timeZone: "Europe/Kyiv", month: "long", year: "numeric" });

    // The invoice the client actually owes — any unpaid one, NOT just the
    // current calendar month (an invoice can be issued for the previous month
    // and still be waiting). Oldest first so they clear the oldest debt.
    const pendingInvoice = list.find(p => p.status === "pending" || p.status === "overdue") ?? null;
    const thisMonthPaid = list.some(p => p.status === "paid" && new Date(p.date) >= monthStart);
    const invoiceMonthLabel = pendingInvoice
      ? new Date(pendingInvoice.date).toLocaleDateString("uk-UA", { timeZone: "Europe/Kyiv", month: "long", year: "numeric" })
      : monthLabel;

    return (
      <div>
        <PageHeader title="Оплати" subtitle="Онлайн-супровід · щомісячна підписка" />

        {/* Summary card */}
        <div className="card p-5 md:p-6 mb-6 relative overflow-hidden">
          <div className="absolute inset-0 -z-10 opacity-30 bg-gradient-to-br from-accent/15 via-transparent to-accent2/15" />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-4">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-muted">Поточний місяць</div>
              <div className="text-base font-semibold mt-0.5 capitalize">{monthLabel}</div>
              <div className={`text-xs mt-1 ${
                pendingInvoice ? "text-accent2" : thisMonthPaid ? "text-success" : "text-muted"
              }`}>
                {pendingInvoice ? "⏳ очікує оплати" :
                 thisMonthPaid ? "✓ оплачено" :
                 "— ще немає рахунку"}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-muted">Підписка</div>
              <div className="text-2xl font-black mt-0.5">{monthly ? `${monthly.toLocaleString("uk-UA")} ₴` : "—"}</div>
              <div className="text-xs text-muted mt-1">за місяць</div>
            </div>
            <div className="text-right col-span-2 sm:col-span-1">
              <div className="text-[10px] uppercase tracking-wider text-muted">Всього сплачено</div>
              <div className="text-xl font-bold text-success">{totalPaid.toLocaleString("uk-UA")} ₴</div>
              <div className="text-xs text-muted mt-1">місяців: {paidCount}</div>
            </div>
          </div>

          {pendingInvoice && (
            <div className="mt-5 p-3 rounded-xl bg-accent2/10 border border-accent2/30 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex items-center gap-2 text-sm flex-1">
                <Clock className="w-4 h-4 text-accent2 shrink-0" />
                <span>Підписка за <b className="capitalize">{invoiceMonthLabel}</b> очікує оплати — <b>{pendingInvoice.amount.toLocaleString("uk-UA")} ₴</b></span>
              </div>
              <PayButton amount={pendingInvoice.amount} />
            </div>
          )}

          {(user as any)?.nextBillingDate && (
            <div className="mt-3 text-xs text-muted flex items-center gap-1.5">
              <span>📅</span>
              <span>Наступний рахунок: <b className="text-text">{new Date((user as any).nextBillingDate).toLocaleDateString("uk-UA", { timeZone: "Europe/Kyiv",  dateStyle: "long" })}</b></span>
            </div>
          )}
        </div>

        <MonobankQR url={process.env.NEXT_PUBLIC_MONOBANK_URL ?? ""} />
        <PaymentDetails />

        {list.length === 0 ? (
          <EmptyState icon={Wallet} title="Платежів поки немає" />
        ) : (
          <div className="card divide-y divide-border">
            {list.slice().reverse().map((p) => {
              const s = statusMap[p.status] ?? statusMap.pending;
              const Icon = s.icon;
              return (
                <div key={p.id} className="p-4 flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <Icon className={`w-5 h-5 ${s.color} shrink-0`} />
                    <div className="min-w-0">
                      <div className="font-medium">{p.amount.toLocaleString("uk-UA")} {p.currency}</div>
                      <div className="text-xs text-muted break-words">{p.date.toLocaleDateString("uk-UA", { timeZone: "Europe/Kyiv",  month: "long", year: "numeric" })}{p.notes ? ` · ${p.notes}` : ""}</div>
                    </div>
                  </div>
                  <span className={`chip ${s.color} shrink-0`}>{s.label}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ── DROP_IN clients: simplified view (no 10-session progress) ─────────────
  if (isDropIn) {
    const pendingPayment = list.find(p => p.status === "pending" || p.status === "overdue");
    const sessionsPrice = (user as any)?.pricePerSession ?? 0;

    return (
      <div>
        <PageHeader title="Оплати" subtitle="Разові тренування — оплата по сесії" />

        {/* Summary card */}
        <div className="card p-5 md:p-6 mb-6 relative overflow-hidden">
          <div className="absolute inset-0 -z-10 opacity-30 bg-gradient-to-br from-accent/15 via-transparent to-accent2/15" />
          <div className="grid grid-cols-3 gap-3 md:gap-4">
            <div className="text-center sm:text-left">
              <div className="text-[10px] uppercase tracking-wider text-muted">Сесій оплачено</div>
              <div className="text-2xl font-black mt-0.5">{paidCount}</div>
            </div>
            <div className="text-center">
              <div className="text-[10px] uppercase tracking-wider text-muted">Очікує</div>
              <div className="text-2xl font-black mt-0.5 text-accent2">{pendingCount}</div>
            </div>
            <div className="text-right">
              <div className="text-[10px] uppercase tracking-wider text-muted">Всього сплачено</div>
              <div className="text-xl font-bold text-success">{totalPaid.toLocaleString("uk-UA")} ₴</div>
            </div>
          </div>

          {pendingPayment && (
            <div className="mt-5 p-3 rounded-xl bg-accent2/10 border border-accent2/30 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex items-center gap-2 text-sm flex-1">
                <Clock className="w-4 h-4 text-accent2 shrink-0" />
                <span>Очікує оплати: <b>{pendingPayment.amount.toLocaleString("uk-UA")} ₴</b>{pendingPayment.notes ? ` · ${pendingPayment.notes}` : ""}</span>
              </div>
              <PayButton amount={pendingPayment.amount} />
            </div>
          )}

          {sessionsPrice > 0 && !pendingPayment && (
            <div className="mt-5 text-xs text-muted">
              Ціна за одне тренування — <b className="text-text">{sessionsPrice.toLocaleString("uk-UA")} ₴</b>
            </div>
          )}
        </div>

        <MonobankQR url={process.env.NEXT_PUBLIC_MONOBANK_URL ?? ""} />
        <PaymentDetails />

        {list.length === 0 ? (
          <EmptyState icon={Wallet} title="Платежів поки немає" />
        ) : (
          <div className="card divide-y divide-border">
            {list.slice().reverse().map((p) => {
              const s = statusMap[p.status] ?? statusMap.pending;
              const Icon = s.icon;
              return (
                <div key={p.id} className="p-4 flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <Icon className={`w-5 h-5 ${s.color} shrink-0`} />
                    <div className="min-w-0">
                      <div className="font-medium">{p.amount.toLocaleString("uk-UA")} {p.currency}</div>
                      <div className="text-xs text-muted break-words">{p.date.toLocaleDateString("uk-UA", { timeZone: "Europe/Kyiv" })} · {p.method ?? "—"}{p.notes ? ` · ${p.notes}` : ""}</div>
                    </div>
                  </div>
                  <span className={`chip ${s.color} shrink-0`}>{s.label}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ── PACKAGE clients (default): 10-session progress UI ─────────────────────
  return (
    <div>
      <PageHeader title="Оплати" subtitle="Кожне тренування — крок до фінішу пакету" />

      {/* Stops visualization */}
      <div className="card p-5 md:p-6 mb-6 relative overflow-hidden">
        <div className="absolute inset-0 -z-10 opacity-30 bg-gradient-to-br from-accent/15 via-transparent to-accent2/15" />
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div className="min-w-0">
            <div className="text-xs uppercase tracking-wider text-muted">Поточний пакет</div>
            <div className="text-2xl font-black mt-0.5">
              {sessionsInPackage}<span className="text-muted text-base">/{TOTAL_STOPS}</span>
              <span className="text-muted text-sm font-medium ml-1.5">тренувань</span>
            </div>
            <div className="text-xs text-muted mt-0.5">
              {sessionsInPackage < TOTAL_STOPS
                ? <>Залишилось <b className="text-text">{TOTAL_STOPS - sessionsInPackage}</b> до оплати наступного пакету{pricePer10 ? ` · ${pricePer10.toLocaleString("uk-UA")} ₴` : ""}</>
                : <>Пакет завершено — час оплатити наступний{pricePer10 ? ` (${pricePer10.toLocaleString("uk-UA")} ₴)` : ""}</>}
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-[10px] uppercase tracking-wider text-muted">Всього сплачено</div>
            <div className="text-xl font-bold text-success">{totalPaid.toLocaleString("uk-UA")} ₴</div>
            <div className="text-[10px] text-muted mt-0.5">пакетів: {paidCount}</div>
          </div>
        </div>

        {/* Track */}
        <div className="relative pt-3">
          <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 rounded-full bg-border" />
          <div
            className="absolute left-0 top-1/2 -translate-y-1/2 h-1 rounded-full accent-shine transition-all"
            style={{ width: `${(sessionsInPackage / TOTAL_STOPS) * 100}%` }}
          />
          <div className="relative grid grid-cols-10 gap-1">
            {stops.map((s, i) => {
              const isLast = i === TOTAL_STOPS - 1;
              return (
                <div key={i} className="flex flex-col items-center">
                  <div className={`relative z-10 w-7 h-7 md:w-9 md:h-9 rounded-full border-2 flex items-center justify-center transition-all ${
                    s === "done" ? "accent-shine border-transparent text-white shadow-glow"
                    : s === "pending" ? "bg-accent2/15 border-accent2 text-accent2 animate-pulse-ring"
                    : isLast ? "bg-accent/10 border-accent/40 text-accent"
                    : "bg-surface border-border text-muted"
                  }`}>
                    {s === "done" && isLast ? <Wallet className="w-3.5 h-3.5 md:w-4 md:h-4" /> :
                     s === "done" ? <Check className="w-3.5 h-3.5 md:w-4 md:h-4" /> :
                     s === "pending" ? <Clock className="w-3.5 h-3.5 md:w-4 md:h-4" /> :
                     isLast ? <Wallet className="w-3.5 h-3.5 md:w-4 md:h-4" /> :
                     <span className="text-[10px] md:text-xs font-bold">{i + 1}</span>}
                  </div>
                  <div className={`text-[9px] md:text-[10px] mt-1.5 ${isLast ? "text-accent font-semibold" : "text-muted"}`}>
                    {isLast ? "оплата" : i + 1}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {pendingCount > 0 && (() => {
          const pendingPayment = list.find(p => p.status === "pending" || p.status === "overdue");
          const payAmount = pricePer10 > 0 ? pricePer10 : pendingPayment?.amount ?? 0;
          return (
            <div className="mt-5 p-3 rounded-xl bg-accent2/10 border border-accent2/30 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex items-center gap-2 text-sm flex-1">
                <Clock className="w-4 h-4 text-accent2 shrink-0" />
                <span>На цій зупинці очікується оплата{payAmount ? ` · ${payAmount.toLocaleString("uk-UA")} ₴` : ""}.</span>
              </div>
              {payAmount > 0 && <PayButton amount={payAmount} />}
            </div>
          );
        })()}

        {sessionsOverdue && (
          <div className="mt-5 p-3 rounded-xl bg-accent/10 border border-accent/30 flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-2 text-sm flex-1">
              <CreditCard className="w-4 h-4 text-accent shrink-0" />
              <span>
                Пакет вичерпано ({sessionsSinceLastPayment} тренувань)
                {pricePer10 ? ` · наступний ${pricePer10.toLocaleString("uk-UA")} ₴` : ""} — час оплатити!
              </span>
            </div>
            {pricePer10 > 0 && <PayButton amount={pricePer10} />}
          </div>
        )}

        {paidCount >= 10 && (
          <div className="mt-5 p-3 rounded-xl bg-success/10 border border-success/30 flex items-center gap-2 text-sm text-success">
            <Flag className="w-4 h-4 shrink-0" />
            <span>Вже 10 пакетів пройдено — справжня дисципліна! 🔥</span>
          </div>
        )}
      </div>

      <MonobankQR url={process.env.NEXT_PUBLIC_MONOBANK_URL ?? ""} />
      <PaymentDetails />

      {list.length === 0 ? (
        <EmptyState icon={Wallet} title="Платежів поки немає" />
      ) : (
        <div className="card divide-y divide-border">
          {list.slice().reverse().map((p) => {
            const s = statusMap[p.status] ?? statusMap.pending;
            const Icon = s.icon;
            return (
              <div key={p.id} className="p-4 flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <Icon className={`w-5 h-5 ${s.color} shrink-0`} />
                  <div className="min-w-0">
                    <div className="font-medium">{p.amount.toLocaleString("uk-UA")} {p.currency}</div>
                    <div className="text-xs text-muted break-words">{p.date.toLocaleDateString("uk-UA", { timeZone: "Europe/Kyiv" })} · {p.method ?? "—"}{p.notes ? ` · ${p.notes}` : ""}</div>
                  </div>
                </div>
                <span className={`chip ${s.color} shrink-0`}>{s.label}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
