import { requireClient } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui";
import { AnalysesPanel } from "@/components/AnalysesPanel";

export default async function AnalysesPage() {
  const u = await requireClient();
  const items = await prisma.labResult.findMany({
    where: { clientId: u.id },
    orderBy: { date: "desc" },
  });

  return (
    <div>
      <PageHeader title="Аналізи" subtitle="Файли від лабораторії та коментарі — в одному місці" />
      <AnalysesPanel
        role="CLIENT"
        items={items.map(i => ({ ...i, date: i.date.toISOString() }))}
      />
    </div>
  );
}
