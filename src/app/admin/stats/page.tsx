import { PageHeader } from "@/components/ui";
import { getAllMonthlyStats } from "@/lib/monthlyStats";
import { kyivMonthKey } from "@/lib/kyivTime";
import { monthLabel } from "@/lib/monthLabel";
import { StatsView } from "./StatsView";

// "2026-06" -> "2026-05"
function prevMonthKey(key: string): string {
  let [y, m] = key.split("-").map(Number);
  m -= 1;
  if (m === 0) { m = 12; y -= 1; }
  return `${y}-${String(m).padStart(2, "0")}`;
}

export const dynamic = "force-dynamic";

export default async function AdminStatsPage() {
  const months = await getAllMonthlyStats();
  const currentKey = kyivMonthKey(new Date());

  const thisMonth = months.find((m) => m.key === currentKey);
  const prevKey = prevMonthKey(currentKey);
  const prevMonth = months.find((m) => m.key === prevKey);

  return (
    <div className="max-w-4xl">
      <PageHeader
        title="Статистика"
        subtitle="Помісячний архів тренувань та оплат по всіх клієнтах"
      />

      {/* Top summary */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-5">
        <div className="card p-4">
          <div className="text-[10px] uppercase tracking-wider text-muted">Цього місяця</div>
          <div className="text-2xl font-black mt-1">{thisMonth?.workouts ?? 0} <span className="text-base font-bold text-muted">трен.</span></div>
          <div className="text-[11px] text-muted">
            <span className="text-accent">{thisMonth?.personal ?? 0}</span> персон. ·{" "}
            <span className="text-accent2">{thisMonth?.online ?? 0}</span> онлайн
          </div>
        </div>
        <div className="card p-4">
          <div className="text-[10px] uppercase tracking-wider text-muted">Цього місяця · оплати</div>
          <div className="text-2xl font-black mt-1">{(thisMonth?.paymentsSum ?? 0).toLocaleString("uk-UA")} ₴</div>
          <div className="text-[11px] text-muted">
            <span className="text-accent">{(thisMonth?.paymentsPersonal ?? 0).toLocaleString("uk-UA")}</span> персон. ·{" "}
            <span className="text-accent2">{(thisMonth?.paymentsOnline ?? 0).toLocaleString("uk-UA")}</span> онлайн
          </div>
        </div>
        <div className="card p-4 col-span-2 md:col-span-1">
          <div className="text-[10px] uppercase tracking-wider text-muted">Минулого місяця · {monthLabel(prevKey).toLowerCase()}</div>
          <div className="text-2xl font-black mt-1">{prevMonth?.workouts ?? 0} <span className="text-base font-bold text-muted">трен.</span></div>
          <div className="text-[11px] text-muted">
            <span className="text-accent">{prevMonth?.personal ?? 0}</span> персон. ·{" "}
            <span className="text-accent2">{prevMonth?.online ?? 0}</span> онлайн ·{" "}
            {(prevMonth?.paymentsSum ?? 0).toLocaleString("uk-UA")} ₴
          </div>
        </div>
      </div>

      <StatsView months={months} currentKey={currentKey} />
    </div>
  );
}
