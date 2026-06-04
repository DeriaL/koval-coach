import { Dumbbell, Wallet, Clock, CalendarRange } from "lucide-react";
import type { MonthStat } from "@/lib/monthlyStats";
import { monthLabel } from "@/lib/monthLabel";

export function ArchiveTab({ months, currentKey }: { months: MonthStat[]; currentKey: string }) {
  if (months.length === 0) {
    return (
      <div className="card p-10 text-center">
        <CalendarRange className="w-10 h-10 mx-auto text-muted mb-3" />
        <div className="text-muted">Поки немає історії тренувань</div>
        <div className="text-xs text-muted mt-1">Архів заповнюється автоматично щомісяця</div>
      </div>
    );
  }

  const totalW = months.reduce((s, m) => s + m.workouts, 0);
  const totalPay = months.reduce((s, m) => s + m.paymentsSum, 0);

  return (
    <div>
      {/* Lifetime summary */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="card p-4">
          <div className="text-[10px] uppercase tracking-wider text-muted flex items-center gap-1"><Dumbbell className="w-3 h-3" /> Усього тренувань</div>
          <div className="text-2xl font-black mt-1">{totalW}</div>
        </div>
        <div className="card p-4">
          <div className="text-[10px] uppercase tracking-wider text-muted flex items-center gap-1"><Wallet className="w-3 h-3" /> Усього оплат</div>
          <div className="text-2xl font-black mt-1">{totalPay.toLocaleString("uk-UA")} ₴</div>
        </div>
      </div>

      <div className="text-xs text-muted mb-2">
        Помісячна історія. Минулі місяці закриті й не впливають на поточний лічильник.
      </div>

      <div className="space-y-2">
        {months.map((m) => {
          const isCurrent = m.key === currentKey;
          return (
            <div key={m.key} className={`card p-4 ${isCurrent ? "border-accent/40" : ""}`}>
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="font-semibold flex items-center gap-2">
                  {monthLabel(m.key)}
                  {isCurrent
                    ? <span className="chip text-[10px] py-0 px-1.5 text-accent border-accent/30">поточний</span>
                    : <span className="chip text-[10px] py-0 px-1.5 text-muted">архів</span>}
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="flex items-center gap-1.5 font-semibold">
                    <Dumbbell className="w-3.5 h-3.5 text-accent" /> {m.workouts}
                    <span className="text-muted font-normal">трен.</span>
                  </span>
                  {m.totalMin > 0 && (
                    <span className="flex items-center gap-1.5 text-muted">
                      <Clock className="w-3.5 h-3.5" /> {Math.round(m.totalMin / 60 * 10) / 10} год
                    </span>
                  )}
                  <span className="flex items-center gap-1.5">
                    <Wallet className="w-3.5 h-3.5 text-success" />
                    <b>{m.paymentsSum.toLocaleString("uk-UA")} ₴</b>
                    {m.paymentsCount > 0 && <span className="text-muted text-xs">({m.paymentsCount})</span>}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
