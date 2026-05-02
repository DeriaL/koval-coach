"use client";
import { useState, useTransition, useEffect } from "react";
import { createPortal } from "react-dom";
import { scheduleSession } from "../clients/actions";
import { Plus, X, Save, Loader2, Calendar, User } from "lucide-react";

type Client = { id: string; firstName: string; lastName: string; coachingPlan: string };

export function ScheduleButton({ clients, defaultClientId }: { clients: Client[]; defaultClientId?: string }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [pending, start] = useTransition();
  const [clientId, setClientId] = useState(defaultClientId ?? clients[0]?.id ?? "");
  const [err, setErr] = useState<string | null>(null);
  const [whenStr, setWhenStr] = useState("");
  const [alreadyDone, setAlreadyDone] = useState(false);

  const isPast = whenStr && new Date(whenStr).getTime() < Date.now();

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = ""; window.removeEventListener("keydown", onKey); };
  }, [open]);

  // sensible default datetime (next hour, rounded)
  const def = new Date(Math.ceil(Date.now() / 3600000) * 3600000);
  const defStr = def.toISOString().slice(0, 16);

  function submit(fd: FormData) {
    setErr(null);
    const data: any = {
      title: String(fd.get("title") || "Персональне тренування"),
      scheduledAt: String(fd.get("scheduledAt") || ""),
      notes: String(fd.get("notes") || ""),
      alreadyDone: alreadyDone || (new Date(String(fd.get("scheduledAt") || "")).getTime() < Date.now() && fd.get("alreadyDone") === "on"),
    };
    if (!data.scheduledAt || !clientId) { setErr("Обери клієнта і час"); return; }
    start(async () => {
      try {
        await scheduleSession(clientId, data);
        setOpen(false);
        setAlreadyDone(false);
      } catch (e: any) { setErr(e?.message ?? "Помилка"); }
    });
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn btn-primary">
        <Plus className="w-4 h-4" /> Запланувати
      </button>

      {open && mounted && createPortal(
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-4 bg-black/70 backdrop-blur-sm animate-fade-in"
          onClick={() => setOpen(false)}>
          <div onClick={(e) => e.stopPropagation()}
            className="card w-full md:max-w-lg p-5 md:p-6 rounded-t-3xl md:rounded-3xl border-accent/30 animate-slide-in-up md:animate-pop max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl accent-shine flex items-center justify-center text-white"><Calendar className="w-4 h-4" /></div>
                Нове тренування
              </h3>
              <button onClick={() => setOpen(false)} className="btn px-3 py-2"><X className="w-4 h-4" /></button>
            </div>

            <form action={submit} className="space-y-3">
              <div>
                <label className="label flex items-center gap-1.5"><User className="w-3 h-3" /> Клієнт</label>
                <select value={clientId} onChange={e => setClientId(e.target.value)} className="select" required>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.firstName} {c.lastName} · {c.coachingPlan === "ONLINE" ? "Онлайн" : "Офлайн"}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="label">Назва</label>
                  <input name="title" defaultValue="Персональне тренування" className="input" required />
                </div>
                <div>
                  <label className="label">Дата і час</label>
                  <input name="scheduledAt" type="datetime-local" defaultValue={defStr}
                    onChange={(e) => setWhenStr(e.target.value)}
                    className="input" required />
                </div>
              </div>

              <div>
                <label className="label">Нотатка (необов'язково)</label>
                <input name="notes" className="input" placeholder="напр. Кардіо + ноги" />
              </div>

              {/* Quick presets */}
              <div className="flex flex-wrap gap-1.5">
                {[
                  { label: "Сьогодні 18:00", h: 18, days: 0 },
                  { label: "Завтра 10:00", h: 10, days: 1 },
                  { label: "Завтра 18:00", h: 18, days: 1 },
                  { label: "+2 дні 10:00", h: 10, days: 2 },
                ].map(p => (
                  <button type="button" key={p.label}
                    onClick={(e) => {
                      const d = new Date();
                      d.setDate(d.getDate() + p.days);
                      d.setHours(p.h, 0, 0, 0);
                      const inp = (e.currentTarget.closest("form")!.elements.namedItem("scheduledAt") as HTMLInputElement);
                      inp.value = d.toISOString().slice(0, 16);
                    }}
                    className="chip text-[11px] hover:border-accent/50 active:scale-95">{p.label}</button>
                ))}
              </div>

              {/* Backfill toggle (when in past) */}
              {isPast && (
                <label className="flex items-start gap-2 p-3 rounded-xl border border-accent/30 bg-accent/5 cursor-pointer">
                  <input type="checkbox" name="alreadyDone" checked={alreadyDone} onChange={(e) => setAlreadyDone(e.target.checked)}
                    className="mt-0.5 accent-[rgb(var(--accent))]" />
                  <div className="text-xs">
                    <div className="font-semibold text-accent">Вже відбулось — зарахувати в статистику</div>
                    <div className="text-muted mt-0.5">Тренування додасться як виконане й увійде в загальний рахунок (для бекфілу).</div>
                  </div>
                </label>
              )}

              {err && <div className="text-danger text-xs">{err}</div>}

              <div className="flex gap-2 pt-2">
                <button className="btn btn-primary flex-1" disabled={pending}>
                  {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> Запланувати</>}
                </button>
                <button type="button" onClick={() => setOpen(false)} className="btn">Скасувати</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
