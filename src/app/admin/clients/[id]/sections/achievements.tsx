"use client";
import { useState, useTransition } from "react";
import { saveAchievement, deleteAchievement } from "../../actions";
import { Trash2, Plus, Save, X, Loader2, Trophy } from "lucide-react";

const icons: { key: string; label: string }[] = [
  { key: "Trophy", label: "Кубок" },
  { key: "Flame", label: "Полум'я" },
  { key: "TrendingDown", label: "Зниження ваги" },
  { key: "TrendingUp", label: "Зростання" },
  { key: "Dumbbell", label: "Сила" },
  { key: "Star", label: "Зірка" },
  { key: "Award", label: "Нагорода" },
  { key: "Medal", label: "Медаль" },
  { key: "Zap", label: "Енергія" },
];

export function AchievementsTab({ clientId, items }: { clientId: string; items: any[] }) {
  const [editing, setEditing] = useState<any | null>(null);
  const [pending, start] = useTransition();

  function save(fd: FormData) {
    const data = Object.fromEntries(fd);
    start(async () => { await saveAchievement(clientId, { ...data, id: editing?.id }); setEditing(null); });
  }
  function del(id: string) { if (!confirm("Видалити ачівку?")) return; start(async () => { await deleteAchievement(id, clientId); }); }

  return (
    <div>
      <div className="flex justify-between mb-4">
        <h3 className="font-semibold">Досягнення клієнта</h3>
        {!editing && <button onClick={() => setEditing({})} className="btn btn-primary"><Plus className="w-4 h-4" /> Видати ачівку</button>}
      </div>
      {editing && (
        <form action={save} className="card p-6 space-y-3 mb-4">
          <div className="flex justify-between"><h3 className="font-semibold">{editing.id ? "Редагувати" : "Нова ачівка"}</h3>
            <button type="button" onClick={() => setEditing(null)} className="btn"><X className="w-4 h-4" /></button></div>
          <div className="grid md:grid-cols-2 gap-3">
            <div><label className="label">Назва</label><input name="title" defaultValue={editing.title ?? ""} required className="input" /></div>
            <div><label className="label">Іконка</label>
              <select name="icon" defaultValue={editing.icon ?? "Trophy"} className="select">
                {icons.map(i => <option key={i.key} value={i.key}>{i.label}</option>)}
              </select>
            </div>
          </div>
          <div><label className="label">Опис</label><input name="description" defaultValue={editing.description ?? ""} className="input" /></div>
          <button className="btn btn-primary" disabled={pending}>
            {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> Зберегти</>}
          </button>
        </form>
      )}
      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
        {items.length === 0 && <div className="card p-6 text-muted text-center col-span-full">Ачівок поки немає</div>}
        {items.map(a => (
          <div key={a.id} className="card p-5 relative">
            <div className="w-11 h-11 rounded-xl accent-shine flex items-center justify-center text-white mb-3">
              <Trophy className="w-5 h-5" />
            </div>
            <div className="font-semibold">{a.title}</div>
            {a.description && <div className="text-sm text-muted mt-1">{a.description}</div>}
            <div className="flex gap-1 mt-3">
              <button onClick={() => setEditing(a)} className="btn text-sm flex-1">Змінити</button>
              <button onClick={() => del(a.id)} className="btn text-sm text-danger"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
