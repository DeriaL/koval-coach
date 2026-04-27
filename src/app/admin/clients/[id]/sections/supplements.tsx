"use client";
import { useState, useTransition } from "react";
import { saveSupplement, deleteSupplement } from "../../actions";
import { Pencil, Trash2, Plus, Save, X, Loader2, Pill } from "lucide-react";

export function SupplementsTab({ clientId, items }: { clientId: string; items: any[] }) {
  const [editing, setEditing] = useState<any | null>(null);
  const [pending, start] = useTransition();

  function save(fd: FormData) {
    const data = Object.fromEntries(fd);
    start(async () => { await saveSupplement(clientId, { ...data, id: editing?.id }); setEditing(null); });
  }
  function del(id: string) {
    if (!confirm("Видалити?")) return;
    start(async () => { await deleteSupplement(id, clientId); });
  }

  return (
    <div>
      {!editing && <button onClick={() => setEditing({})} className="btn btn-primary mb-4"><Plus className="w-4 h-4" /> Додати добавку</button>}
      {editing && (
        <form action={save} className="card p-6 space-y-3 mb-4">
          <div className="flex justify-between items-center"><h3 className="font-semibold">{editing.id ? "Редагувати" : "Нова"}</h3>
            <button type="button" onClick={() => setEditing(null)} className="btn"><X className="w-4 h-4" /></button></div>
          <div className="grid md:grid-cols-3 gap-3">
            <div><label className="label">Назва</label><input name="name" defaultValue={editing.name ?? ""} required className="input" /></div>
            <div><label className="label">Дозування</label><input name="dosage" defaultValue={editing.dosage ?? ""} className="input" /></div>
            <div><label className="label">Коли приймати</label><input name="schedule" defaultValue={editing.schedule ?? ""} className="input" /></div>
          </div>
          <div><label className="label">Нотатка</label><textarea name="notes" rows={2} defaultValue={editing.notes ?? ""} className="textarea" /></div>
          <button className="btn btn-primary" disabled={pending}>
            {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> Зберегти</>}
          </button>
        </form>
      )}
      <div className="grid md:grid-cols-2 gap-3">
        {items.length === 0 && <div className="card p-6 text-muted text-center md:col-span-2">Добавок поки немає</div>}
        {items.map(s => (
          <div key={s.id} className="card p-4 flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center"><Pill className="w-5 h-5" /></div>
            <div className="flex-1">
              <div className="font-medium">{s.name}</div>
              <div className="text-xs text-muted">{s.dosage} · {s.schedule}</div>
              {s.notes && <div className="text-sm mt-1">{s.notes}</div>}
            </div>
            <div className="flex gap-1">
              <button onClick={() => setEditing(s)} className="btn text-sm"><Pencil className="w-3.5 h-3.5" /></button>
              <button onClick={() => del(s.id)} className="btn text-sm text-danger"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
