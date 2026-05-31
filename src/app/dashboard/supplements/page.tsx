import { requireClient } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PageHeader, EmptyState } from "@/components/ui";
import { Pill, StickyNote } from "lucide-react";
import { TIME_SLOTS, parseSchedule } from "@/lib/supplementSchedule";

export default async function SupplementsPage() {
  const u = await requireClient();
  const list = await prisma.supplement.findMany({
    where: { clientId: u.id },
    orderBy: { createdAt: "desc" },
  });

  if (list.length === 0) {
    return (
      <div>
        <PageHeader title="Добавки" subtitle="Що приймати, коли і скільки" />
        <EmptyState icon={Pill} title="Немає жодної добавки" />
      </div>
    );
  }

  const grouped: { key: string; label: string; emoji: string; list: typeof list }[] = [
    ...TIME_SLOTS.map(s => ({
      key: s.key, label: s.label, emoji: s.emoji,
      list: list.filter(i => parseSchedule(i.schedule).slots.includes(s.key)),
    })),
    {
      key: "other", label: "Без розкладу", emoji: "•",
      list: list.filter(i => parseSchedule(i.schedule).slots.length === 0),
    },
  ];

  return (
    <div>
      <PageHeader title="Добавки" subtitle="Що приймати, коли і скільки" />
      <div className="space-y-6">
        {grouped.map(g => g.list.length > 0 && (
          <section key={g.key}>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted mb-3 px-1">
              <span className="text-lg leading-none">{g.emoji}</span>
              {g.label}
              <div className="flex-1 h-px bg-border ml-1" />
              <span className="chip text-[10px] py-0 px-1.5">{g.list.length}</span>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {g.list.map((s) => {
                const extra = parseSchedule(s.schedule).extra;
                return (
                  <div key={`${g.key}-${s.id}`} className="card p-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center">
                        <Pill className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold break-words">{s.name}</div>
                        <div className="text-xs text-muted break-words">
                          {[s.dosage, extra].filter(Boolean).join(" · ")}
                        </div>
                      </div>
                    </div>
                    {s.notes && (
                      <div className="mt-4 text-sm flex items-start gap-2 text-muted">
                        <StickyNote className="w-3.5 h-3.5 mt-1 text-accent" /> {s.notes}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
