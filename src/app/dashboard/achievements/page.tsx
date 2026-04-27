import { requireClient } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PageHeader, EmptyState } from "@/components/ui";
import * as LucideIcons from "lucide-react";
import { Trophy } from "lucide-react";

export default async function AchievementsPage() {
  const u = await requireClient();
  const list = await prisma.achievement.findMany({ where: { clientId: u.id }, orderBy: { earnedAt: "desc" } });

  if (list.length === 0)
    return (
      <div>
        <PageHeader title="Досягнення" />
        <EmptyState icon={Trophy} title="Попереду перші ачівки!" text="Вони зʼявляться автоматично або від тренера" />
      </div>
    );

  return (
    <div>
      <PageHeader title="Досягнення" subtitle="Твої віхи та streak" />
      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
        {list.map((a) => {
          const Icon = (LucideIcons as any)[a.icon ?? "Trophy"] ?? Trophy;
          return (
            <div key={a.id} className="card p-6 relative overflow-hidden">
              <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-accent/10 blur-2xl" />
              <div className="w-12 h-12 rounded-xl accent-shine flex items-center justify-center text-white mb-4">
                <Icon className="w-6 h-6" />
              </div>
              <div className="font-semibold">{a.title}</div>
              {a.description && <div className="text-sm text-muted mt-1">{a.description}</div>}
              <div className="text-xs text-muted mt-3">{a.earnedAt.toLocaleDateString("uk-UA")}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
