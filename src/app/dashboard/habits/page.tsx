import { requireClient } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PageHeader, EmptyState } from "@/components/ui";
import { HabitGrid } from "./grid";
import { Target } from "lucide-react";

export default async function HabitsPage() {
  const u = await requireClient();
  const habits = await prisma.habit.findMany({
    where: { clientId: u.id, active: true },
    include: { logs: { orderBy: { date: "desc" }, take: 30 } },
    orderBy: { order: "asc" },
  });

  if (habits.length === 0)
    return (
      <div>
        <PageHeader title="Звички" />
        <EmptyState icon={Target} title="Звичок ще немає" text="Я додам щоденні цілі, і вони зʼявляться тут" />
      </div>
    );

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div>
      <PageHeader title="Звички" subtitle="Щоденні чек-бокси — секрет результату" />
      <HabitGrid
        habits={habits.map(h => ({
          id: h.id,
          title: h.title,
          icon: h.icon ?? "Target",
          logs: h.logs.map(l => ({ date: l.date.toISOString().slice(0, 10), done: l.done })),
          doneToday: h.logs.some(l => l.date.toISOString().slice(0, 10) === today.toISOString().slice(0, 10) && l.done),
        }))}
      />
    </div>
  );
}
