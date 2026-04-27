"use client";
import { useState, useTransition } from "react";
import { saveReminder, deleteReminder } from "../../actions";
import { Trash2, Plus, Save, X, Loader2, Bell } from "lucide-react";

export function RemindersTab({ clientId, items }: { clientId: string; items: any[] }) {
  const [editing, setEditing] = useState<any | null>(null);
  const [pending, start] = useTransition();

  function save(fd: FormData) {
    const data = Object.fromEntries(fd);
    start(async () => { await saveReminder(clientId, { ...data, id: editing?.id }); setEditing(null); });
  }
  function del(id: string) { if (!confirm("Видалити?")) return; start(async () => { await deleteReminder(id, clientId); }); }

  return (
    <div>
      <div className="flex justify-between mb-4">
        <h3 className="font-semibold">Нагадування клієнту</h3>
        {!editing && <button onClick={() => setEditing({ type: "training" })} className="btn btn-primary"><Plus className="w-4 h-4" /> Додати</button>}
      </div>
      {editing && (
        <form action={save} className="card p-6 space-y-3 mb-4">
          <div className="flex justify-between"><h3 className="font-semibold">{editing.id ? "Редагувати" : "Нове"}</h3>
            <button type="button" onClick={() => setEditing(null)} className="btn"><X className="w-4 h-4" /></button></div>
          <div className="grid md:grid-cols-3 gap-3">
            <div className="md:col-span-2"><label className="label">Текст</label><input name="title" defaultValue={editing.title ?? ""} required className="input" /></div>
            <div><label className="label">Тип</label>
              <select name="type" defaultValue={editing.type ?? "training"} className="select">
                <option value="training">Тренування</option>
                <option value="supplement">Добавка</option>
                <option value="checkin">Check-in</option>
                <option value="other">Інше</option>
              </select>
            </div>
            <div className="md:col-span-3"><label className="label">Коли</label>
              <input name="datetime" type="datetime-local" defaultValue={editing.datetime ? new Date(editing.datetime).toISOString().slice(0,16) : ""} required className="input" /></div>
          </div>
          <button className="btn btn-primary" disabled={pending}>
            {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> Зберегти</>}
          </button>
        </form>
      )}
      <div className="card divide-y divide-border">
        {items.length === 0 && <div className="p-6 text-muted text-center">Нагадувань немає</div>}
        {items.map(r => (
          <div key={r.id} className="p-4 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <Bell className="w-4 h-4 text-accent" />
              <div>
                <div className="font-medium">{r.title}</div>
                <div className="text-xs text-muted">{new Date(r.datetime).toLocaleString("uk-UA")}</div>
              </div>
            </div>
            <div className="flex gap-2 items-center">
              <span className="chip text-xs">{r.type}</span>
              <button onClick={() => setEditing(r)} className="btn text-sm">Змінити</button>
              <button onClick={() => del(r.id)} className="btn text-sm text-danger"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
