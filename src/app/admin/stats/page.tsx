import { PageHeader } from "@/components/ui";
import { getAllMonthlyStats } from "@/lib/monthlyStats";
import { kyivMonthKey } from "@/lib/kyivTime";
import { StatsView } from "./StatsView";

export const dynamic = "force-dynamic";

export default async function AdminStatsPage() {
  const months = await getAllMonthlyStats();
  const currentKey = kyivMonthKey(new Date());

  const thisMonth = months.find((m) => m.key === currentKey);
  const totalW = months.reduce((s, m) => s + m.workouts, 0);
  const totalPay = months.reduce((s, m) => s + m.paymentsSum, 0);

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
          <div className="text-2xl font-black mt-1">{thisMonth?.workouts ?? 0}</div>
          <div className="text-[11px] text-muted">тренувань</div>
        </div>
        <div className="card p-4">
          <div className="text-[10px] uppercase tracking-wider text-muted">Цього місяця</div>
          <div className="text-2xl font-black mt-1">{(thisMonth?.paymentsSum ?? 0).toLocaleString("uk-UA")} ₴</div>
          <div className="text-[11px] text-muted">оплат</div>
        </div>
        <div className="card p-4 col-span-2 md:col-span-1">
          <div className="text-[10px] uppercase tracking-wider text-muted">За весь час</div>
          <div className="text-2xl font-black mt-1">{totalW} <span className="text-base font-bold text-muted">трен.</span></div>
          <div className="text-[11px] text-muted">{totalPay.toLocaleString("uk-UA")} ₴ оплат</div>
        </div>
      </div>

      <StatsView months={months} currentKey={currentKey} />
    </div>
  );
}
