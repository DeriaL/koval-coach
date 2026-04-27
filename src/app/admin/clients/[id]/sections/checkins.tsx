"use client";
import { Moon, Zap, Scale, Droplet, Footprints } from "lucide-react";

export function CheckInsTab({ items }: { items: any[] }) {
  if (items.length === 0) return <div className="card p-6 text-muted text-center">Клієнт ще не робив check-in</div>;
  return (
    <div>
      <h3 className="font-semibold mb-4">Останні check-ins (read-only)</h3>
      <div className="card divide-y divide-border">
        {items.map(c => (
          <div key={c.id} className="p-4 flex flex-wrap items-center gap-4 text-sm">
            <div className="min-w-[120px]">
              <div className="font-medium">{new Date(c.date).toLocaleDateString("uk-UA")}</div>
              <div className="text-2xl">{c.mood === 5 ? "😄" : c.mood === 4 ? "🙂" : c.mood === 3 ? "😐" : c.mood === 2 ? "🙁" : "😞"}</div>
            </div>
            <div className="flex items-center gap-1 text-muted"><Moon className="w-3.5 h-3.5" /> {c.sleep?.toFixed(1) ?? "—"}г</div>
            <div className="flex items-center gap-1 text-muted"><Zap className="w-3.5 h-3.5" /> {c.energy}/5</div>
            <div className="flex items-center gap-1 text-muted"><Scale className="w-3.5 h-3.5" /> {c.weight?.toFixed(1) ?? "—"} кг</div>
            <div className="flex items-center gap-1 text-muted"><Droplet className="w-3.5 h-3.5" /> {c.water?.toFixed(1) ?? "—"}л</div>
            <div className="flex items-center gap-1 text-muted"><Footprints className="w-3.5 h-3.5" /> {c.steps ?? "—"}</div>
            {c.notes && <div className="text-muted flex-1 min-w-[200px]">«{c.notes}»</div>}
          </div>
        ))}
      </div>
    </div>
  );
}
