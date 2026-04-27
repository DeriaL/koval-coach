"use client";
import { useState, useTransition } from "react";
import { scheduleSession, confirmSession, deleteSession } from "../../actions";
import { Calendar, Plus, X, Save, Loader2, CheckCircle2, AlertCircle, Trash2, Clock, Dumbbell, Sparkles } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { uk } from "date-fns/locale";

type S = {
  id: string;
  title: string;
  date: Date;
  scheduledAt: Date | null;
  completed: boolean;
  confirmedByTrainer: boolean;
  durationSec: number | null;
  notes: string | null;
};

export function SessionsTab({ clientId, items }: { clientId: string; items: S[] }) {
  const [editing, setEditing] = useState(false);
  const [pending, start] = useTransition();
  const now = new Date();

  function add(fd: FormData) {
    const d = Object.fromEntries(fd) as any;
    start(async () => { await scheduleSession(clientId, d); setEditing(false); });
  }
  function ack(id: string, happened: boolean) {
    start(async () => { await confirmSession(id, clientId, happened); });
  }
  function del(id: string) {
    if (!window.confirm("Видалити сесію?")) return;
    start(async () => { await deleteSession(id, clientId); });
  }

  // Categorize
  const awaiting = items.filter(s => s.scheduledAt && new Date(s.scheduledAt) < now && !s.completed && !s.confirmedByTrainer);
  const upcoming = items.filter(s => s.scheduledAt && new Date(s.scheduledAt) >= now && !s.completed);
  const done = items.filter(s => s.completed || s.confirmedByTrainer).slice(0, 30);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold flex items-center gap-2"><Calendar className="w-4 h-4 text-accent" /> Розклад тренувань</h3>
        {!editing && (
          <button onClick={() => setEditing(true)} className="btn btn-primary">
            <Plus className="w-4 h-4" /> Запланувати
          </button>
        )}
      </div>

      {editing && (
        <form action={add} className="card p-5 mb-4 space-y-3 animate-fade-up">
          <div className="flex justify-between">
            <h4 className="font-semibold">Нове тренування</h4>
            <button type="button" onClick={() => setEditing(false)} className="btn"><X className="w-4 h-4" /></button>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <label className="label">Назва</label>
              <input name="title" required defaultValue="Персональна сесія" className="input" />
            </div>
            <div>
              <label className="label">Дата і час</label>
              <input name="scheduledAt" type="datetime-local" required className="input" />
            </div>
          </div>
          <div>
            <label className="label">Нотатка (необов'язково)</label>
            <input name="notes" className="input" placeholder="напр. Кардіо + ноги" />
          </div>
          <button className="btn btn-primary" disabled={pending}>
            {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> Зберегти</>}
          </button>
        </form>
      )}

      {/* Awaiting confirmation */}
      {awaiting.length > 0 && (
        <div className="mb-5">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-accent2 mb-2">
            <AlertCircle className="w-3.5 h-3.5" /> Потребують підтвердження ({awaiting.length})
          </div>
          <div className="space-y-2">
            {awaiting.map(s => (
              <div key={s.id} className="card p-4 border-accent2/40 bg-accent2/5 animate-pulse-ring">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold">{s.title}</div>
                    <div className="text-xs text-muted mt-0.5">
                      Запланована {new Date(s.scheduledAt!).toLocaleString("uk-UA", { dateStyle: "short", timeStyle: "short" })}
                    </div>
                    {s.notes && <div className="text-xs text-muted mt-1">{s.notes}</div>}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => ack(s.id, true)} disabled={pending} className="btn btn-primary text-sm">
                      <CheckCircle2 className="w-4 h-4" /> Відбулася
                    </button>
                    <button onClick={() => ack(s.id, false)} disabled={pending} className="btn text-sm">
                      <X className="w-4 h-4" /> Не відбулась
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <div className="mb-5">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-accent mb-2">
            <Clock className="w-3.5 h-3.5" /> Заплановані ({upcoming.length})
          </div>
          <div className="space-y-2">
            {upcoming.map(s => (
              <div key={s.id} className="card p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-accent/10 text-accent flex items-center justify-center"><Calendar className="w-5 h-5" /></div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate">{s.title}</div>
                  <div className="text-xs text-muted">
                    {new Date(s.scheduledAt!).toLocaleString("uk-UA", { dateStyle: "short", timeStyle: "short" })} ·{" "}
                    {formatDistanceToNow(new Date(s.scheduledAt!), { addSuffix: true, locale: uk })}
                  </div>
                </div>
                <button onClick={() => del(s.id)} disabled={pending} className="btn text-sm text-danger"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Done */}
      {done.length > 0 && (
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-success mb-2">
            <Sparkles className="w-3.5 h-3.5" /> Виконані ({done.length})
          </div>
          <div className="space-y-2">
            {done.map(s => (
              <div key={s.id} className="card p-3 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-success/10 text-success flex items-center justify-center"><Dumbbell className="w-4 h-4" /></div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{s.title}</div>
                  <div className="text-[11px] text-muted">
                    {new Date(s.date).toLocaleString("uk-UA", { dateStyle: "short", timeStyle: "short" })}
                    {s.durationSec ? ` · ${Math.round(s.durationSec/60)} хв` : ""}
                    {s.confirmedByTrainer ? " · підтв. тренером" : s.completed ? " · самостійно" : ""}
                  </div>
                </div>
                <button onClick={() => del(s.id)} disabled={pending} className="btn text-sm text-muted"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            ))}
          </div>
        </div>
      )}

      {items.length === 0 && !editing && (
        <div className="card p-8 text-center text-muted text-sm">Сесій ще немає. Запланувати першу?</div>
      )}
    </div>
  );
}
