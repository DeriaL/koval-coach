import { requireClient } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui";
import { CheckInForm } from "./form";
import { Flame, Moon, Smile, Zap, Scale, Droplet, Footprints } from "lucide-react";

export default async function CheckInPage() {
  const u = await requireClient();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const existing = await prisma.checkIn.findFirst({
    where: { clientId: u.id, date: { gte: today } },
    orderBy: { date: "desc" },
  });
  const recent = await prisma.checkIn.findMany({ where: { clientId: u.id }, orderBy: { date: "desc" }, take: 7 });

  return (
    <div>
      <PageHeader title="Щоденний check-in" subtitle="30 секунд — і тренер у курсі" />

      <div className="card p-6">
        {existing ? (
          <div className="p-4 rounded-xl bg-success/10 border border-success/30 text-sm flex items-center gap-2">
            <Flame className="w-4 h-4 text-success" /> Сьогоднішній check-in вже є. Можна оновити нижче.
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-accent/5 border border-accent/20 text-sm">
            Швидка форма — займає ~30 секунд. Заповни її щоранку для streak-серії!
          </div>
        )}
        <CheckInForm defaults={existing ?? null} />
      </div>

      <div className="card p-6 mt-6">
        <h3 className="font-semibold mb-4">Останні 7 днів</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
          {recent.slice().reverse().map((c) => (
            <div key={c.id} className="p-3 rounded-xl bg-surface border border-border text-center">
              <div className="text-xs text-muted">
                {c.date.toLocaleDateString("uk-UA", { day: "2-digit", month: "short" })}
              </div>
              <div className="mt-1 text-2xl">{c.mood === 5 ? "😄" : c.mood === 4 ? "🙂" : c.mood === 3 ? "😐" : c.mood === 2 ? "🙁" : "😞"}</div>
              <div className="text-[11px] text-muted mt-1">
                <Moon className="w-3 h-3 inline" /> {c.sleep?.toFixed(1)}г
              </div>
              <div className="text-[11px] text-muted">
                <Scale className="w-3 h-3 inline" /> {c.weight?.toFixed(1)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
