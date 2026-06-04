"use client";
import { useState } from "react";
import Link from "next/link";
import { Dumbbell, Wallet, Clock, ChevronDown, Users, CalendarRange } from "lucide-react";
import type { MonthRow } from "@/lib/monthlyStats";
import { monthLabel } from "@/lib/monthLabel";

export function StatsView({ months, currentKey }: { months: MonthRow[]; currentKey: string }) {
  // Current month expanded by default, the rest collapsed.
  const [open, setOpen] = useState<string | null>(months[0]?.key ?? null);

  if (months.length === 0) {
    return (
      <div className="card p-10 text-center">
        <CalendarRange className="w-10 h-10 mx-auto text-muted mb-3" />
        <div className="text-muted">Поки немає даних для статистики</div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="text-xs text-muted">
        Помісячний архів по всіх клієнтах. Минулі місяці закриті — вони не впливають на поточні лічильники, лише на статистику.
      </div>
      {months.map((m) => {
        const isCurrent = m.key === currentKey;
        const isOpen = open === m.key;
        return (
          <div key={m.key} className={`card overflow-hidden ${isCurrent ? "border-accent/40" : ""}`}>
            <button
              onClick={() => setOpen(isOpen ? null : m.key)}
              className="w-full p-4 flex items-center justify-between gap-3 text-left hover:bg-surface/40 transition"
            >
              <div className="font-semibold flex items-center gap-2 min-w-0">
                <span className="truncate">{monthLabel(m.key)}</span>
                {isCurrent
                  ? <span className="chip text-[10px] py-0 px-1.5 text-accent border-accent/30 shrink-0">поточний</span>
                  : <span className="chip text-[10px] py-0 px-1.5 text-muted shrink-0">архів</span>}
              </div>
              <div className="flex items-center gap-3 sm:gap-4 text-sm shrink-0">
                <span className="flex items-center gap-1.5 font-semibold">
                  <Dumbbell className="w-3.5 h-3.5 text-accent" /> {m.workouts}
                </span>
                <span className="hidden sm:flex items-center gap-1.5 text-muted">
                  <Users className="w-3.5 h-3.5" /> {m.clients.length}
                </span>
                <span className="flex items-center gap-1.5">
                  <Wallet className="w-3.5 h-3.5 text-success" /> <b>{m.paymentsSum.toLocaleString("uk-UA")} ₴</b>
                </span>
                <ChevronDown className={`w-4 h-4 text-muted transition-transform ${isOpen ? "rotate-180" : ""}`} />
              </div>
            </button>

            {isOpen && (
              <div className="border-t border-border/60 px-3 pb-3 pt-2">
                {/* Month summary chips */}
                <div className="flex flex-wrap gap-2 mb-3 text-[11px]">
                  <span className="chip py-0 px-2 gap-1"><Dumbbell className="w-3 h-3" /> {m.workouts} тренувань</span>
                  {m.totalMin > 0 && <span className="chip py-0 px-2 gap-1"><Clock className="w-3 h-3" /> {Math.round(m.totalMin / 60)} год</span>}
                  <span className="chip py-0 px-2 gap-1"><Wallet className="w-3 h-3" /> {m.paymentsCount} оплат</span>
                </div>
                {/* Per-client breakdown */}
                {m.clients.length === 0 ? (
                  <div className="text-xs text-muted text-center py-2">Немає активності цього місяця</div>
                ) : (
                  <div className="space-y-1.5">
                    {m.clients.map((c) => (
                      <Link
                        key={c.clientId}
                        href={`/admin/clients/${c.clientId}?tab=archive`}
                        className="flex items-center gap-2 p-2.5 rounded-xl bg-surface border border-border hover:border-accent/40 transition"
                      >
                        <span className="text-sm font-medium flex-1 min-w-0 truncate">{c.name}</span>
                        <span className="flex items-center gap-1.5 text-sm font-semibold shrink-0">
                          <Dumbbell className="w-3.5 h-3.5 text-accent" /> {c.workouts}
                        </span>
                        {c.paymentsSum > 0 && (
                          <span className="flex items-center gap-1.5 text-sm text-success shrink-0 w-24 justify-end">
                            <Wallet className="w-3.5 h-3.5" /> {c.paymentsSum.toLocaleString("uk-UA")} ₴
                          </span>
                        )}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
