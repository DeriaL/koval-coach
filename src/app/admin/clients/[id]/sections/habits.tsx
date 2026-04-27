"use client";
import { useState, useTransition } from "react";
import { saveHabit, deleteHabit } from "../../actions";
import { Pencil, Trash2, Plus, Save, X, Loader2, Target } from "lucide-react";

const icons: { key: string; label: string }[] = [
  { key: "Target", label: "Ціль" },
  { key: "Droplet", label: "Вода" },
  { key: "Moon", label: "Сон" },
  { key: "Footprints", label: "Кроки" },
  { key: "Ban", label: "Без шкідливого" },
  { key: "Pill", label: "Таблетка" },
  { key: "Apple", label: "Яблуко (харчування)" },
  { key: "Dumbbell", label: "Тренування" },
  { key: "Flame", label: "Стрік" },
  { key: "Sun", label: "Ранок" },
  { key: "Coffee", label: "Кава" },
  { key: "Book", label: "Книга" },
];

export function HabitsTab({ clientId, items }: { clientId: string; items: any[] }) {
  const [editing, setEditing] = useState<any | null>(null);
  const [pending, start] = useTransition();

  function save(fd: FormData) {
    const data = Object.fromEntries(fd);
    start(async () => { await saveHabit(clientId, { ...data, id: editing?.id }); setEditing(null); });
  }
  function del(id: string) { if (!confirm("Видалити звичку?")) return; start(async () => { await deleteHabit(id, clientId); }); }

  return (
    <div>
      <div className="flex justify-between mb-4">
        <h3 className="font-semibold">Щоденні звички</h3>
        {!editing && <button onClick={() => setEditing({})} className="btn btn-primary"><Plus className="w-4 h-4" /> Додати</button>}
      </div>
      {editing && (
        <form action={save} className="card p-6 space-y-3 mb-4">
          <div className="flex justify-between"><h3 className="font-semibold">{editing.id ? "Редагувати" : "Нова звичка"}</h3>
            <button type="button" onClick={() => setEditing(null)} className="btn"><X className="w-4 h-4" /></button></div>
          <div className="grid md:grid-cols-3 gap-3">
            <div className="md:col-span-2"><label className="label">Назва</label><input name="title" defaultValue={editing.title ?? ""} required className="input" /></div>
            <div><label className="label">Іконка</label>
              <select name="icon" defaultValue={editing.icon ?? "Target"} className="select">
                {icons.map(i => <option key={i.key} value={i.key}>{i.label}</option>)}
              </select>
            </div>
            <div><label className="label">Порядок</label><input name="order" type="number" defaultValue={editing.order ?? 0} className="input" /></div>
          </div>
          <button className="btn btn-primary" disabled={pending}>
            {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> Зберегти</>}
          </button>
        </form>
      )}
      <div className="grid sm:grid-cols-2 gap-3">
        {items.length === 0 && <div className="card p-6 text-muted text-center col-span-full">Звичок ще немає</div>}
        {items.map((h) => (
          <div key={h.id} className="card p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center"><Target className="w-5 h-5" /></div>
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">{h.title}</div>
              <div className="text-xs text-muted">{h.logs?.length ?? 0} днів виконано</div>
            </div>
            <div className="flex gap-1">
              <button onClick={() => setEditing(h)} className="btn text-sm"><Pencil className="w-3.5 h-3.5" /></button>
              <button onClick={() => del(h.id)} className="btn text-sm text-danger"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
