"use client";
import { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, X, Dumbbell, Ban, Sparkles, AlertCircle, Clock } from "lucide-react";

type S = {
  id: string;
  title: string;
  date: string;          // ISO
  scheduledAt: string | null;
  completed: boolean;
  confirmedByTrainer: boolean;
  cancelledAt: string | null;
  cancelledBy: string | null;
  durationSec: number | null;
  client: { firstName: string; lastName: string; coachingPlan: string };
};

type DayKey = string; // YYYY-MM-DD

function ymd(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function statusOf(s: S): "done" | "cancelled" | "awaiting" | "planned" {
  if (s.cancelledAt) return "cancelled";
  if (s.completed || s.confirmedByTrainer) return "done";
  if (s.scheduledAt && new Date(s.scheduledAt) < new Date()) return "awaiting";
  return "planned";
}

export function SessionsCalendar({ sessions }: { sessions: S[] }) {
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [selectedDay, setSelectedDay] = useState<DayKey | null>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Group sessions by day key
  const byDay = useMemo(() => {
    const map = new Map<DayKey, S[]>();
    for (const s of sessions) {
      const dt = new Date(s.scheduledAt ?? s.date);
      const k = ymd(dt);
      const arr = map.get(k) ?? [];
      arr.push(s);
      map.set(k, arr);
    }
    return map;
  }, [sessions]);

  // Build month grid (Mon-first)
  const grid = useMemo(() => {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const last = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0);
    const startWeekday = (first.getDay() + 6) % 7; // Mon=0
    const daysInMonth = last.getDate();
    const cells: { date: Date | null; key: DayKey | null }[] = [];
    for (let i = 0; i < startWeekday; i++) cells.push({ date: null, key: null });
    for (let d = 1; d <= daysInMonth; d++) {
      const dt = new Date(cursor.getFullYear(), cursor.getMonth(), d);
      cells.push({ date: dt, key: ymd(dt) });
    }
    while (cells.length % 7 !== 0) cells.push({ date: null, key: null });
    return cells;
  }, [cursor]);

  const monthLabel = cursor.toLocaleDateString("uk-UA", { month: "long", year: "numeric" });
  const todayKey = ymd(new Date());
  const selSessions = selectedDay ? (byDay.get(selectedDay) ?? []) : [];

  return (
    <div className="card p-4 md:p-5 mb-5">
      <div className="flex items-center justify-between mb-3">
        <div className="font-semibold capitalize">{monthLabel}</div>
        <div className="flex items-center gap-1">
          <button onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
            className="btn px-2 py-1.5"><ChevronLeft className="w-4 h-4" /></button>
          <button onClick={() => { const d = new Date(); setCursor(new Date(d.getFullYear(), d.getMonth(), 1)); }}
            className="btn text-xs px-3 py-1.5">Сьогодні</button>
          <button onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
            className="btn px-2 py-1.5"><ChevronRight className="w-4 h-4" /></button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-[10px] uppercase text-muted tracking-wider mb-1">
        {["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Нд"].map(d => <div key={d} className="text-center">{d}</div>)}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {grid.map((c, i) => {
          if (!c.date) return <div key={i} className="aspect-square" />;
          const day = c.date.getDate();
          const list = byDay.get(c.key!) ?? [];
          const counts = {
            planned: list.filter(s => statusOf(s) === "planned").length,
            awaiting: list.filter(s => statusOf(s) === "awaiting").length,
            done: list.filter(s => statusOf(s) === "done").length,
            cancelled: list.filter(s => statusOf(s) === "cancelled").length,
          };
          const total = list.length;
          const isToday = c.key === todayKey;
          const intensity = Math.min(1, total / 4);

          return (
            <button
              key={i}
              onClick={() => total > 0 && setSelectedDay(c.key)}
              disabled={total === 0}
              className={`aspect-square rounded-lg p-1.5 flex flex-col items-stretch gap-1 transition relative overflow-hidden border ${
                total > 0 ? "border-accent/30 hover:border-accent hover:-translate-y-0.5 cursor-pointer" : "border-border/50 cursor-default"
              } ${isToday ? "ring-2 ring-accent ring-offset-2 ring-offset-card" : ""}`}
              style={total > 0 ? { background: `rgb(var(--accent) / ${0.06 + intensity * 0.18})` } : undefined}
            >
              <div className="flex items-start justify-between">
                <span className={`text-xs font-bold ${isToday ? "text-accent" : ""}`}>{day}</span>
                {total > 0 && (
                  <span className="text-[9px] font-bold text-accent">{total}</span>
                )}
              </div>
              {total > 0 && (
                <div className="flex flex-wrap gap-0.5 mt-auto">
                  {Array.from({ length: counts.done }).slice(0, 4).map((_, j) => (
                    <span key={`d${j}`} className="w-1.5 h-1.5 rounded-full bg-success" />
                  ))}
                  {Array.from({ length: counts.awaiting }).slice(0, 4).map((_, j) => (
                    <span key={`a${j}`} className="w-1.5 h-1.5 rounded-full bg-accent2 animate-pulse" />
                  ))}
                  {Array.from({ length: counts.planned }).slice(0, 4).map((_, j) => (
                    <span key={`p${j}`} className="w-1.5 h-1.5 rounded-full bg-accent" />
                  ))}
                  {Array.from({ length: counts.cancelled }).slice(0, 4).map((_, j) => (
                    <span key={`c${j}`} className="w-1.5 h-1.5 rounded-full bg-danger/60" />
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 flex-wrap text-[10px] text-muted mt-3">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-success" /> виконані</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-accent2" /> підтвердити</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-accent" /> заплановані</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-danger/60" /> скасовані</span>
      </div>

      {/* Day modal */}
      {selectedDay && mounted && createPortal(
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-4 bg-black/70 backdrop-blur-sm animate-fade-in"
          onClick={() => setSelectedDay(null)}>
          <div onClick={e => e.stopPropagation()}
            className="card w-full md:max-w-2xl p-5 md:p-6 rounded-t-3xl md:rounded-3xl animate-slide-in-up md:animate-pop max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-xs text-muted uppercase tracking-wider">День</div>
                <div className="font-bold text-lg">
                  {new Date(selectedDay).toLocaleDateString("uk-UA", { weekday: "long", day: "numeric", month: "long" })}
                </div>
              </div>
              <button onClick={() => setSelectedDay(null)} className="btn px-3 py-2"><X className="w-4 h-4" /></button>
            </div>

            <DayStats sessions={selSessions} />

            <div className="mt-4 space-y-2">
              {selSessions.map(s => <SessionRow key={s.id} s={s} />)}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

function DayStats({ sessions }: { sessions: S[] }) {
  const done = sessions.filter(s => statusOf(s) === "done").length;
  const planned = sessions.filter(s => statusOf(s) === "planned").length;
  const awaiting = sessions.filter(s => statusOf(s) === "awaiting").length;
  const cancelled = sessions.filter(s => statusOf(s) === "cancelled").length;
  const totalMin = sessions.filter(s => s.completed || s.confirmedByTrainer).reduce((a, s) => a + (s.durationSec ?? 0), 0) / 60;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
      <Stat icon={Sparkles} value={done} label="Виконано" color="success" />
      <Stat icon={AlertCircle} value={awaiting} label="Підтвердити" color="accent2" />
      <Stat icon={Clock} value={planned} label="Заплановані" color="accent" />
      <Stat icon={Ban} value={cancelled} label="Скасовані" color="danger" />
    </div>
  );
}

function Stat({ icon: Icon, value, label, color }: any) {
  const cl = color === "success" ? "text-success border-success/30 bg-success/5"
    : color === "accent2" ? "text-accent2 border-accent2/30 bg-accent2/5"
    : color === "accent" ? "text-accent border-accent/30 bg-accent/5"
    : color === "danger" ? "text-danger border-danger/30 bg-danger/5" : "";
  return (
    <div className={`p-2.5 rounded-xl border ${cl}`}>
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider"><Icon className="w-3 h-3" /> {label}</div>
      <div className="text-xl font-black mt-0.5">{value}</div>
    </div>
  );
}

function SessionRow({ s }: { s: S }) {
  const status = statusOf(s);
  const initials = `${s.client.firstName[0]}${s.client.lastName[0]}`;
  const time = s.scheduledAt ? new Date(s.scheduledAt).toLocaleTimeString("uk-UA", { hour: "2-digit", minute: "2-digit" }) : "";
  const cls =
    status === "done" ? "border-success/20 bg-success/5"
    : status === "cancelled" ? "border-danger/20 bg-danger/5"
    : status === "awaiting" ? "border-accent2/30 bg-accent2/5"
    : "border-accent/20 bg-accent/5";

  return (
    <div className={`p-3 rounded-xl border flex items-center gap-3 ${cls}`}>
      <div className="w-10 h-10 rounded-xl accent-shine flex items-center justify-center text-white font-black text-xs">
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium truncate">{s.client.firstName} {s.client.lastName}</div>
        <div className="text-xs text-muted truncate">{s.title}{s.durationSec ? ` · ${Math.round(s.durationSec/60)} хв` : ""}</div>
      </div>
      <div className="text-right shrink-0">
        <div className="text-sm font-bold">{time}</div>
        <div className="text-[10px] text-muted">
          {status === "done" ? "виконано" : status === "awaiting" ? "підтвердити" : status === "cancelled" ? "скасовано" : "заплановано"}
        </div>
      </div>
    </div>
  );
}
