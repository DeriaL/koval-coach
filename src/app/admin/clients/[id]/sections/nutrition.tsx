"use client";
import { useState, useTransition } from "react";
import { saveNutrition, deleteNutrition } from "../../actions";
import { Pencil, Trash2, Plus, Save, X, Loader2 } from "lucide-react";

export function NutritionTab({ clientId, items }: { clientId: string; items: any[] }) {
  const [editing, setEditing] = useState<any | null>(null);
  const [pending, start] = useTransition();

  function save(fd: FormData) {
    const data = Object.fromEntries(fd);
    start(async () => { await saveNutrition(clientId, { ...data, id: editing?.id }); setEditing(null); });
  }

  function del(id: string) {
    if (!confirm("Видалити план?")) return;
    start(async () => { await deleteNutrition(id, clientId); });
  }

  return (
    <div>
      {!editing && (
        <button onClick={() => setEditing({})} className="btn btn-primary mb-4">
          <Plus className="w-4 h-4" /> Новий план
        </button>
      )}

      {editing ? (
        <form action={save} className="card p-6 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">{editing.id ? "Редагувати" : "Новий план харчування"}</h3>
            <button type="button" onClick={() => setEditing(null)} className="btn"><X className="w-4 h-4" /></button>
          </div>
          <div>
            <label className="label">Назва</label>
            <input name="title" defaultValue={editing.title ?? ""} required className="input" />
          </div>
          <div className="grid grid-cols-4 gap-3">
            <div><label className="label">Ккал</label><input name="calories" type="number" defaultValue={editing.calories ?? ""} className="input" /></div>
            <div><label className="label">Білки</label><input name="protein" type="number" defaultValue={editing.protein ?? ""} className="input" /></div>
            <div><label className="label">Вуглеводи</label><input name="carbs" type="number" defaultValue={editing.carbs ?? ""} className="input" /></div>
            <div><label className="label">Жири</label><input name="fats" type="number" defaultValue={editing.fats ?? ""} className="input" /></div>
          </div>
          <div>
            <label className="label">Меню</label>
            <textarea name="content" rows={10} defaultValue={editing.content ?? ""} required className="textarea font-mono text-sm" />
          </div>
          <div>
            <label className="label">Нотатка</label>
            <textarea name="notes" rows={3} defaultValue={editing.notes ?? ""} className="textarea" />
          </div>
          <button className="btn btn-primary" disabled={pending}>
            {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> Зберегти</>}
          </button>
        </form>
      ) : (
        <div className="space-y-3">
          {items.length === 0 && <div className="card p-6 text-muted text-center">Планів поки немає</div>}
          {items.map(p => (
            <div key={p.id} className="card p-5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-semibold">{p.title}</div>
                  <div className="text-xs text-muted mt-1">{p.calories} ккал · Б{p.protein}/В{p.carbs}/Ж{p.fats}</div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setEditing(p)} className="btn text-sm"><Pencil className="w-3.5 h-3.5" /></button>
                  <button onClick={() => del(p.id)} className="btn text-sm text-danger"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
              <pre className="mt-3 text-sm whitespace-pre-wrap font-sans text-muted line-clamp-5">{p.content}</pre>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
