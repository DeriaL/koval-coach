"use client";
import { useState, useTransition } from "react";
import { saveMeasurement, deleteMeasurement } from "../../actions";
import { Pencil, Trash2, Plus, Save, X, Loader2 } from "lucide-react";
import { WeightChart, MultiLineChart } from "@/components/Charts";

export function AnalyticsTab({ clientId, items }: { clientId: string; items: any[] }) {
  const [editing, setEditing] = useState<any | null>(null);
  const [pending, start] = useTransition();

  function save(fd: FormData) {
    const data = Object.fromEntries(fd);
    start(async () => { await saveMeasurement(clientId, { ...data, id: editing?.id }); setEditing(null); });
  }
  function del(id: string) { if (!confirm("Видалити замір?")) return; start(async () => { await deleteMeasurement(id, clientId); }); }

  const fmt = (d: Date) => new Date(d).toLocaleDateString("uk-UA", { day: "2-digit", month: "short" });
  const wData = items.filter(x => x.weight).map(x => ({ date: fmt(x.date), weight: Number(x.weight.toFixed(1)) }));
  const gData = items.map(x => ({ date: fmt(x.date), waist: x.waist, chest: x.chest, hips: x.hips, arm: x.arm }));

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold">Заміри</h3>
        {!editing && <button onClick={() => setEditing({ date: new Date().toISOString().slice(0,10) })} className="btn btn-primary"><Plus className="w-4 h-4" /> Додати замір</button>}
      </div>

      {editing && (
        <form action={save} className="card p-6 space-y-3 mb-4">
          <div className="flex justify-between items-center"><h3 className="font-semibold">{editing.id ? "Редагувати" : "Новий замір"}</h3>
            <button type="button" onClick={() => setEditing(null)} className="btn"><X className="w-4 h-4" /></button></div>
          <div className="grid md:grid-cols-4 gap-3">
            <div><label className="label">Дата</label><input name="date" type="date" defaultValue={editing.date ? new Date(editing.date).toISOString().slice(0,10) : ""} required className="input" /></div>
            <div><label className="label">Вага</label><input name="weight" type="number" step="0.1" defaultValue={editing.weight ?? ""} className="input" /></div>
            <div><label className="label">% жиру</label><input name="bodyFat" type="number" step="0.1" defaultValue={editing.bodyFat ?? ""} className="input" /></div>
            <div><label className="label">Талія</label><input name="waist" type="number" step="0.1" defaultValue={editing.waist ?? ""} className="input" /></div>
            <div><label className="label">Груди</label><input name="chest" type="number" step="0.1" defaultValue={editing.chest ?? ""} className="input" /></div>
            <div><label className="label">Стегна</label><input name="hips" type="number" step="0.1" defaultValue={editing.hips ?? ""} className="input" /></div>
            <div><label className="label">Біцепс</label><input name="arm" type="number" step="0.1" defaultValue={editing.arm ?? ""} className="input" /></div>
            <div><label className="label">Нога</label><input name="leg" type="number" step="0.1" defaultValue={editing.leg ?? ""} className="input" /></div>
          </div>
          <div><label className="label">Нотатка</label><input name="notes" defaultValue={editing.notes ?? ""} className="input" /></div>
          <button className="btn btn-primary" disabled={pending}>
            {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> Зберегти</>}
          </button>
        </form>
      )}

      {wData.length > 0 && (
        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <div className="card p-5">
            <div className="font-semibold mb-3">Вага</div>
            <WeightChart data={wData} />
          </div>
          <div className="card p-5">
            <div className="font-semibold mb-3">Заміри</div>
            <MultiLineChart data={gData} keys={[
              { key: "waist", color: "#6366f1", name: "Талія" },
              { key: "chest", color: "#3b82f6", name: "Груди" },
              { key: "hips", color: "#60a5fa", name: "Стегна" },
              { key: "arm", color: "#f472b6", name: "Біцепс" },
            ]} />
          </div>
        </div>
      )}

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="text-muted text-xs uppercase tracking-wider">
            <th className="text-left p-3">Дата</th><th className="text-right p-3">Вага</th>
            <th className="text-right p-3">%жиру</th><th className="text-right p-3">Талія</th>
            <th className="text-right p-3">Груди</th><th className="text-right p-3">Стегна</th>
            <th className="text-right p-3">Біцепс</th><th className="text-right p-3"></th>
          </tr></thead>
          <tbody>
            {items.slice().reverse().map(m => (
              <tr key={m.id} className="border-t border-border">
                <td className="p-3">{new Date(m.date).toLocaleDateString("uk-UA")}</td>
                <td className="text-right">{m.weight?.toFixed(1) ?? "—"}</td>
                <td className="text-right">{m.bodyFat?.toFixed(1) ?? "—"}</td>
                <td className="text-right">{m.waist ?? "—"}</td>
                <td className="text-right">{m.chest ?? "—"}</td>
                <td className="text-right">{m.hips ?? "—"}</td>
                <td className="text-right">{m.arm ?? "—"}</td>
                <td className="text-right p-3"><div className="flex gap-1 justify-end">
                  <button onClick={() => setEditing(m)} className="btn text-sm"><Pencil className="w-3.5 h-3.5" /></button>
                  <button onClick={() => del(m.id)} className="btn text-sm text-danger"><Trash2 className="w-3.5 h-3.5" /></button>
                </div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
