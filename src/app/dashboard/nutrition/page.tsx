import { requireClient } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PageHeader, EmptyState } from "@/components/ui";
import { Apple, Flame, Drumstick, Wheat, Droplet, StickyNote } from "lucide-react";

export default async function NutritionPage() {
  const u = await requireClient();
  const plans = await prisma.nutritionPlan.findMany({ where: { clientId: u.id }, orderBy: { updatedAt: "desc" } });

  if (plans.length === 0)
    return (
      <div>
        <PageHeader title="Харчування" />
        <EmptyState icon={Apple} title="План ще не додано" text="Тренер додасть його незабаром" />
      </div>
    );

  return (
    <div>
      <PageHeader title="Харчування" subtitle="План, складений твоїм тренером" />
      <div className="space-y-6">
        {plans.map((p) => (
          <div key={p.id} className="card p-6">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h2 className="text-xl font-bold">{p.title}</h2>
              <span className="text-xs text-muted">Оновлено {p.updatedAt.toLocaleDateString("uk-UA")}</span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
              <Macro icon={Flame} label="Калорії" value={p.calories ?? "—"} unit="ккал" />
              <Macro icon={Drumstick} label="Білки" value={p.protein ?? "—"} unit="г" />
              <Macro icon={Wheat} label="Вуглеводи" value={p.carbs ?? "—"} unit="г" />
              <Macro icon={Droplet} label="Жири" value={p.fats ?? "—"} unit="г" />
            </div>

            <div className="mt-5">
              <div className="text-xs uppercase text-muted tracking-wider mb-2">Меню</div>
              <pre className="whitespace-pre-wrap font-sans text-sm bg-surface border border-border rounded-xl p-4">
                {p.content}
              </pre>
            </div>

            {p.notes && (
              <div className="mt-4 p-4 rounded-xl bg-accent/5 border border-accent/20">
                <div className="text-xs uppercase text-accent tracking-wider flex items-center gap-1.5 mb-1">
                  <StickyNote className="w-3.5 h-3.5" /> Нотатка тренера
                </div>
                <div className="text-sm">{p.notes}</div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function Macro({ icon: Icon, label, value, unit }: any) {
  return (
    <div className="p-4 rounded-xl bg-surface border border-border">
      <div className="flex items-center gap-2 text-muted text-xs uppercase tracking-wider">
        <Icon className="w-3.5 h-3.5" /> {label}
      </div>
      <div className="mt-1 text-xl font-bold">
        {value} <span className="text-sm text-muted font-normal">{unit}</span>
      </div>
    </div>
  );
}
