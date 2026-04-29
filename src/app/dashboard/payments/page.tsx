import { requireClient } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PageHeader, EmptyState } from "@/components/ui";
import { Wallet, CheckCircle2, Clock, AlertTriangle, Flag, Check } from "lucide-react";

const TOTAL_STOPS = 10;

export default async function PaymentsPage() {
  const u = await requireClient();
  const [list, user] = await Promise.all([
    prisma.payment.findMany({ where: { clientId: u.id }, orderBy: { date: "asc" } }),
    prisma.user.findUnique({ where: { id: u.id }, select: { pricePer10: true } }),
  ]);

  const paidCount = list.filter(p => p.status === "paid").length;
  const pendingCount = list.filter(p => p.status === "pending" || p.status === "overdue").length;
  const pricePer10 = user?.pricePer10 ?? 0;
  const totalPaid = list.filter(p => p.status === "paid").reduce((s, p) => s + p.amount, 0);

  // Build stops: filled (paid), current (pending), empty
  const stops = Array.from({ length: TOTAL_STOPS }, (_, i) => {
    if (i < paidCount) return "paid";
    if (i === paidCount && pendingCount > 0) return "pending";
    return "empty";
  }) as ("paid" | "pending" | "empty")[];

  const statusMap: any = {
    paid: { icon: CheckCircle2, color: "text-success", label: "Оплачено" },
    pending: { icon: Clock, color: "text-accent", label: "Очікує" },
    overdue: { icon: AlertTriangle, color: "text-danger", label: "Прострочено" },
  };

  return (
    <div>
      <PageHeader title="Оплати" subtitle="Зупинки твого шляху" />

      {/* Stops visualization */}
      <div className="card p-5 md:p-6 mb-6 relative overflow-hidden">
        <div className="absolute inset-0 -z-10 opacity-30 bg-gradient-to-br from-accent/15 via-transparent to-accent2/15" />
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div>
            <div className="text-xs uppercase tracking-wider text-muted">Прогрес зупинок</div>
            <div className="text-2xl font-black mt-0.5">
              {paidCount}<span className="text-muted text-base">/{TOTAL_STOPS}</span>
            </div>
            <div className="text-xs text-muted mt-0.5">
              кожна зупинка = пакет 10 тренувань{pricePer10 ? ` · ${pricePer10.toLocaleString("uk-UA")} ₴` : ""}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-wider text-muted">Всього сплачено</div>
            <div className="text-xl font-bold text-success">{totalPaid.toLocaleString("uk-UA")} ₴</div>
          </div>
        </div>

        {/* Track */}
        <div className="relative pt-3">
          <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 rounded-full bg-border" />
          <div
            className="absolute left-0 top-1/2 -translate-y-1/2 h-1 rounded-full accent-shine transition-all"
            style={{ width: `${(paidCount / TOTAL_STOPS) * 100}%` }}
          />
          <div className="relative grid grid-cols-10 gap-1">
            {stops.map((s, i) => (
              <div key={i} className="flex flex-col items-center">
                <div className={`relative z-10 w-7 h-7 md:w-9 md:h-9 rounded-full border-2 flex items-center justify-center transition-all ${
                  s === "paid" ? "accent-shine border-transparent text-white shadow-glow"
                  : s === "pending" ? "bg-accent2/15 border-accent2 text-accent2 animate-pulse-ring"
                  : "bg-surface border-border text-muted"
                }`}>
                  {s === "paid" ? <Check className="w-3.5 h-3.5 md:w-4 md:h-4" /> :
                   s === "pending" ? <Clock className="w-3.5 h-3.5 md:w-4 md:h-4" /> :
                   <span className="text-[10px] md:text-xs font-bold">{i + 1}</span>}
                </div>
                <div className="text-[9px] md:text-[10px] text-muted mt-1.5">{i + 1}</div>
              </div>
            ))}
          </div>
        </div>

        {pendingCount > 0 && (
          <div className="mt-5 p-3 rounded-xl bg-accent2/10 border border-accent2/30 flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4 text-accent2 shrink-0" />
            <span>На цій зупинці очікується оплата{pricePer10 ? ` ${pricePer10.toLocaleString("uk-UA")} ₴` : ""}.</span>
          </div>
        )}
        {paidCount >= TOTAL_STOPS && (
          <div className="mt-5 p-3 rounded-xl bg-success/10 border border-success/30 flex items-center gap-2 text-sm text-success">
            <Flag className="w-4 h-4" />
            <span>Усі 10 зупинок пройдено. Кругло!</span>
          </div>
        )}
      </div>

      {list.length === 0 ? (
        <EmptyState icon={Wallet} title="Платежів поки немає" />
      ) : (
        <div className="card divide-y divide-border">
          {list.slice().reverse().map((p) => {
            const s = statusMap[p.status] ?? statusMap.pending;
            const Icon = s.icon;
            return (
              <div key={p.id} className="p-4 flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  <Icon className={`w-5 h-5 ${s.color}`} />
                  <div>
                    <div className="font-medium">{p.amount.toLocaleString("uk-UA")} {p.currency}</div>
                    <div className="text-xs text-muted">{p.date.toLocaleDateString("uk-UA")} · {p.method ?? "—"}{p.notes ? ` · ${p.notes}` : ""}</div>
                  </div>
                </div>
                <span className={`chip ${s.color}`}>{s.label}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
