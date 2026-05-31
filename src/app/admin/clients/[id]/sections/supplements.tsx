"use client";
import { useMemo, useState, useTransition } from "react";
import { saveSupplement, deleteSupplement } from "../../actions";
import { Pencil, Trash2, Plus, Save, X, Loader2, Pill } from "lucide-react";
import {
  TIME_SLOTS, type TimeSlotKey,
  parseSchedule, formatSchedule,
} from "@/lib/supplementSchedule";

type Supplement = {
  id: string; name: string; dosage: string | null;
  schedule: string | null; notes: string | null;
};

export function SupplementsTab({ clientId, items }: { clientId: string; items: Supplement[] }) {
  const [editing, setEditing] = useState<any | null>(null);
  const [pending, start] = useTransition();

  // local form state for time-slot pills (editing only)
  const initial = useMemo(() => parseSchedule(editing?.schedule), [editing]);
  const [slots, setSlots] = useState<TimeSlotKey[]>(initial.slots);
  const [extra, setExtra] = useState<string>(initial.extra);

  // when opening editor for a new item — reset local state
  function openEditor(item: any | null) {
    const p = parseSchedule(item?.schedule);
    setSlots(p.slots);
    setExtra(p.extra);
    setEditing(item ?? {});
  }

  function toggleSlot(k: TimeSlotKey) {
    setSlots(prev => prev.includes(k) ? prev.filter(x => x !== k) : [...prev, k]);
  }

  function save(fd: FormData) {
    const data = Object.fromEntries(fd) as Record<string, string>;
    const schedule = formatSchedule(slots, extra);
    start(async () => {
      await saveSupplement(clientId, { ...data, schedule, id: editing?.id });
      setEditing(null);
    });
  }
  function del(id: string) {
    if (!confirm("Видалити?")) return;
    start(async () => { await deleteSupplement(id, clientId); });
  }

  // Group items into time-of-day buckets (a supplement can appear in multiple).
  const grouped: { key: TimeSlotKey | "other"; label: string; emoji: string; list: Supplement[] }[] = [
    ...TIME_SLOTS.map(s => ({
      key: s.key, label: s.label, emoji: s.emoji,
      list: items.filter(i => parseSchedule(i.schedule).slots.includes(s.key)),
    })),
    {
      key: "other", label: "Без розкладу", emoji: "•",
      list: items.filter(i => parseSchedule(i.schedule).slots.length === 0),
    },
  ];

  return (
    <div>
      {!editing && (
        <button onClick={() => openEditor(null)} className="btn btn-primary mb-4">
          <Plus className="w-4 h-4" /> Додати добавку
        </button>
      )}

      {editing && (
        <form action={save} className="card p-6 space-y-4 mb-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold">{editing.id ? "Редагувати" : "Нова"}</h3>
            <button type="button" onClick={() => setEditing(null)} className="btn"><X className="w-4 h-4" /></button>
          </div>

          <div className="grid md:grid-cols-2 gap-3">
            <div><label className="label">Назва</label><input name="name" defaultValue={editing.name ?? ""} required className="input" /></div>
            <div><label className="label">Дозування</label><input name="dosage" defaultValue={editing.dosage ?? ""} className="input" placeholder="напр. 350 мг" /></div>
          </div>

          <div>
            <label className="label">Коли приймати</label>
            <div className="flex flex-wrap gap-2 mt-1">
              {TIME_SLOTS.map(s => {
                const on = slots.includes(s.key);
                return (
                  <button
                    type="button"
                    key={s.key}
                    onClick={() => toggleSlot(s.key)}
                    className={`px-3 py-2 rounded-xl border text-sm transition-all active:scale-95 ${
                      on
                        ? "accent-shine text-white border-transparent shadow-glow"
                        : "bg-surface border-border text-text hover:border-accent/40"
                    }`}
                  >
                    <span className="mr-1.5">{s.emoji}</span>{s.label}
                  </button>
                );
              })}
            </div>
            <input
              value={extra}
              onChange={(e) => setExtra(e.target.value)}
              className="input mt-2"
              placeholder="Деталі (необов'язково), напр. «разом з їжею»"
            />
          </div>

          <div>
            <label className="label">Нотатка</label>
            <textarea name="notes" rows={2} defaultValue={editing.notes ?? ""} className="textarea" />
          </div>

          <button className="btn btn-primary" disabled={pending}>
            {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> Зберегти</>}
          </button>
        </form>
      )}

      {items.length === 0 && (
        <div className="card p-6 text-muted text-center">Добавок поки немає</div>
      )}

      {items.length > 0 && grouped.map(g => g.list.length > 0 && (
        <section key={g.key} className="mb-5">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted mb-2 px-1">
            <span className="text-base">{g.emoji}</span> {g.label}
            <div className="flex-1 h-px bg-border ml-1" />
            <span className="chip text-[10px] py-0 px-1.5">{g.list.length}</span>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            {g.list.map(s => (
              <div key={`${g.key}-${s.id}`} className="card p-4 flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center shrink-0"><Pill className="w-5 h-5" /></div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium break-words">{s.name}</div>
                  <div className="text-xs text-muted break-words">{[s.dosage, parseSchedule(s.schedule).extra].filter(Boolean).join(" · ")}</div>
                  {s.notes && <div className="text-sm mt-1 break-words">{s.notes}</div>}
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => openEditor(s)} className="btn text-sm"><Pencil className="w-3.5 h-3.5" /></button>
                  <button onClick={() => del(s.id)} className="btn text-sm text-danger"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
