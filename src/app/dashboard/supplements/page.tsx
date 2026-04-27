import { requireClient } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PageHeader, EmptyState } from "@/components/ui";
import { Pill, StickyNote } from "lucide-react";

export default async function SupplementsPage() {
  const u = await requireClient();
  const list = await prisma.supplement.findMany({ where: { clientId: u.id }, orderBy: { createdAt: "desc" } });

  return (
    <div>
      <PageHeader title="Добавки" subtitle="Що приймати, коли і скільки" />
      {list.length === 0 ? (
        <EmptyState icon={Pill} title="Немає жодної добавки" />
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {list.map((s) => (
            <div key={s.id} className="card p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center">
                  <Pill className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-semibold">{s.name}</div>
                  <div className="text-xs text-muted">{s.dosage} · {s.schedule}</div>
                </div>
              </div>
              {s.notes && (
                <div className="mt-4 text-sm flex items-start gap-2 text-muted">
                  <StickyNote className="w-3.5 h-3.5 mt-1 text-accent" /> {s.notes}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
