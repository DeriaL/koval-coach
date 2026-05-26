import { requireClient } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui";
import { CheckInForm } from "./form";
import { Flame, Moon, Smile, Zap, Droplet, Footprints, Ruler, ArrowRight } from "lucide-react";
import Link from "next/link";

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
      <PageHeader title="Щоденний check-in" subtitle="30 секунд, і я в курсі" />

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

      <Link
        href="/dashboard/analytics"
        className="block mt-4 relative overflow-hidden rounded-2xl border border-accent/40 bg-accent/[0.07] p-4 hover:-translate-y-0.5 hover:border-accent/60 hover:bg-accent/[0.12] transition-all group shadow-glow"
      >
        <div className="flex items-center gap-3">
          <span
            className="relative h-11 w-11 rounded-xl accent-shine grid place-items-center text-white shrink-0"
            style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.32), 0 8px 18px -6px rgb(var(--accent) / 0.55)" }}
          >
            <Ruler className="w-5 h-5" />
            <span aria-hidden className="absolute inset-0 rounded-xl bg-accent/30 animate-ping -z-10" />
          </span>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm">Зважився? Додай замір окремо</div>
            <div className="text-xs text-muted">Вага, заміри тіла, % жиру — у вкладці «Аналітика»</div>
          </div>
          <ArrowRight className="w-4 h-4 text-accent shrink-0 group-hover:translate-x-1 transition" />
        </div>
      </Link>

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
                <Moon className="w-3 h-3 inline" /> {c.sleep?.toFixed(1) ?? "—"}г
              </div>
              <div className="text-[11px] text-muted">
                <Droplet className="w-3 h-3 inline" /> {c.water?.toFixed(1) ?? "—"}л
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
