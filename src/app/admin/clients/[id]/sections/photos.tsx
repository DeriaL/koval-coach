"use client";
import { useState, useTransition } from "react";
import { savePhoto, deletePhoto } from "../../actions";
import { Trash2, Plus, Save, X, Loader2 } from "lucide-react";

export function PhotosTab({ clientId, items }: { clientId: string; items: any[] }) {
  const [editing, setEditing] = useState<any | null>(null);
  const [pending, start] = useTransition();

  function save(fd: FormData) {
    const data = Object.fromEntries(fd);
    start(async () => { await savePhoto(clientId, { ...data, id: editing?.id }); setEditing(null); });
  }
  function del(id: string) { if (!confirm("Видалити фото?")) return; start(async () => { await deletePhoto(id, clientId); }); }

  return (
    <div>
      <div className="flex justify-between mb-4">
        <h3 className="font-semibold">Фото прогресу</h3>
        {!editing && <button onClick={() => setEditing({ date: new Date().toISOString().slice(0,10) })} className="btn btn-primary"><Plus className="w-4 h-4" /> Додати фото</button>}
      </div>
      {editing && (
        <form action={save} className="card p-6 space-y-3 mb-4">
          <div className="flex justify-between"><h3 className="font-semibold">Нове фото</h3>
            <button type="button" onClick={() => setEditing(null)} className="btn"><X className="w-4 h-4" /></button></div>
          <div><label className="label">URL фото</label><input name="url" defaultValue={editing.url ?? ""} required placeholder="https://..." className="input" /></div>
          <div className="grid md:grid-cols-2 gap-3">
            <div><label className="label">Дата</label><input name="date" type="date" defaultValue={editing.date ? new Date(editing.date).toISOString().slice(0,10) : ""} required className="input" /></div>
            <div><label className="label">Ракурс</label>
              <select name="angle" defaultValue={editing.angle ?? ""} className="select">
                <option value="">—</option>
                <option value="front">Спереду</option>
                <option value="side">Збоку</option>
                <option value="back">Ззаду</option>
              </select>
            </div>
          </div>
          <div><label className="label">Нотатка</label><input name="notes" defaultValue={editing.notes ?? ""} className="input" /></div>
          <button className="btn btn-primary" disabled={pending}>
            {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> Зберегти</>}
          </button>
        </form>
      )}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {items.length === 0 && <div className="card p-6 text-muted text-center col-span-full">Фото ще немає</div>}
        {items.map(p => (
          <div key={p.id} className="card overflow-hidden group relative">
            <div className="aspect-[3/4] bg-surface">
              <img src={p.url} alt="" className="w-full h-full object-cover" />
            </div>
            <div className="p-2 text-xs flex justify-between items-center">
              <div>
                <div>{new Date(p.date).toLocaleDateString("uk-UA")}</div>
                <div className="text-muted">{p.angle ?? "—"}</div>
              </div>
              <button onClick={() => del(p.id)} className="btn text-xs text-danger"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
