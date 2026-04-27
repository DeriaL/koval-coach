"use client";
import { useState, useTransition } from "react";
import * as LucideIcons from "lucide-react";
import { Check, Target } from "lucide-react";
import { toggleHabit } from "./actions";

type Habit = { id: string; title: string; icon: string; logs: { date: string; done: boolean }[]; doneToday: boolean };

export function HabitGrid({ habits: initial }: { habits: Habit[] }) {
  const [habits, setHabits] = useState(initial);
  const [pending, start] = useTransition();

  function today() { return new Date().toISOString().slice(0, 10); }

  function toggle(id: string) {
    setHabits((p) => p.map(h => h.id === id ? {
      ...h,
      doneToday: !h.doneToday,
      logs: h.doneToday
        ? h.logs.filter(l => l.date !== today())
        : [{ date: today(), done: true }, ...h.logs.filter(l => l.date !== today())],
    } : h));
    start(async () => { await toggleHabit(id); });
  }

  function last14Days() {
    const days: string[] = [];
    const d = new Date();
    for (let i = 13; i >= 0; i--) {
      const x = new Date(d);
      x.setDate(d.getDate() - i);
      days.push(x.toISOString().slice(0, 10));
    }
    return days;
  }
  const days = last14Days();

  const doneCountToday = habits.filter(h => h.doneToday).length;

  return (
    <div>
      <div className="card p-5 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-muted uppercase tracking-wider">Сьогодні</div>
            <div className="text-2xl font-bold">{doneCountToday}/{habits.length} звичок</div>
          </div>
          <div className="text-4xl">{doneCountToday === habits.length ? "🔥" : doneCountToday > 0 ? "💪" : "🌱"}</div>
        </div>
        <div className="mt-3 h-2 rounded-full bg-surface overflow-hidden">
          <div className="h-full accent-shine transition-all" style={{ width: `${habits.length ? (doneCountToday / habits.length) * 100 : 0}%` }} />
        </div>
      </div>

      <div className="space-y-3">
        {habits.map((h) => {
          const Icon = (LucideIcons as any)[h.icon] ?? Target;
          const logSet = new Set(h.logs.filter(l => l.done).map(l => l.date));
          return (
            <div key={h.id} className="card p-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => toggle(h.id)}
                  className={`w-12 h-12 rounded-xl flex items-center justify-center transition ${
                    h.doneToday ? "bg-accent text-bg" : "bg-surface border border-border"
                  }`}
                >
                  {h.doneToday ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate">{h.title}</div>
                  <div className="text-xs text-muted">{logSet.size} днів за 14</div>
                </div>
              </div>
              <div className="flex gap-1 mt-3 overflow-x-auto">
                {days.map((d) => (
                  <div
                    key={d}
                    title={d}
                    className={`w-5 h-5 rounded-md shrink-0 ${logSet.has(d) ? "accent-shine" : "bg-surface border border-border"}`}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
