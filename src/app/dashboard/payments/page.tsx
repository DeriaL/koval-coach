import { requireClient } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PageHeader, EmptyState } from "@/components/ui";
import { Wallet, CheckCircle2, Clock, AlertTriangle } from "lucide-react";

export default async function PaymentsPage() {
  const u = await requireClient();
  const list = await prisma.payment.findMany({ where: { clientId: u.id }, orderBy: { date: "desc" } });
  const total = list.filter((p) => p.status === "paid").reduce((s, p) => s + p.amount, 0);

  const statusMap: any = {
    paid: { icon: CheckCircle2, color: "text-success", label: "Оплачено" },
    pending: { icon: Clock, color: "text-accent", label: "Очікує" },
    overdue: { icon: AlertTriangle, color: "text-danger", label: "Прострочено" },
  };

  return (
    <div>
      <PageHeader title="Оплати" subtitle="Історія та статус" />
      <div className="card p-5 mb-6">
        <div className="text-muted text-xs uppercase tracking-wider">Всього сплачено</div>
        <div className="text-3xl font-bold mt-1">{total.toLocaleString("uk-UA")} ₴</div>
      </div>

      {list.length === 0 ? (
        <EmptyState icon={Wallet} title="Платежів поки немає" />
      ) : (
        <div className="card divide-y divide-border">
          {list.map((p) => {
            const s = statusMap[p.status] ?? statusMap.pending;
            const Icon = s.icon;
            return (
              <div key={p.id} className="p-4 flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  <Icon className={`w-5 h-5 ${s.color}`} />
                  <div>
                    <div className="font-medium">{p.amount.toLocaleString("uk-UA")} {p.currency}</div>
                    <div className="text-xs text-muted">{p.date.toLocaleDateString("uk-UA")} · {p.method ?? "—"}</div>
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
