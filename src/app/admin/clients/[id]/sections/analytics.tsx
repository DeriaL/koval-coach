"use client";
import { useState, useTransition } from "react";
import { saveMeasurement, deleteMeasurement } from "../../actions";
import { Pencil, Trash2, Plus, Save, X, Loader2 } from "lucide-react";
import { kyivDayKey } from "@/lib/kyivTime";
import { WeightChart, MultiLineChart } from "@/components/Charts";

export function AnalyticsTab({ clientId, items }: { clientId: string; items: any[] }) {
  const [editing, setEditing] = useState<any | null>(null);
  const [pending, start] = useTransition();

  function save(fd: FormData) {
    const data = Object.fromEntries(fd);
    start(async () => { await saveMeasurement(clientId, { ...data, id: editing?.id }); setEditing(null); });
  }
  function del(id: string) { if (!confirm("Видалити замір?")) return; start(async () => { await deleteMeasurement(id, clientId); }); }

  const fmt = (d: Date) => new Date(d).toLocaleDateString("uk-UA", { timeZone: "Europe/Kyiv",  day: "2-digit", month: "short" });
  const wData = items.filter(x => x.weight).map(x => ({ date: fmt(x.date), weight: Number(x.weight.toFixed(1)) }));
  const gData = items.map(x => ({
    date: fmt(x.date),
    waist: x.waist, chest: x.chest, hips: x.hips, shoulders: x.shoulders,
    leftArm: x.leftArm ?? x.arm, rightArm: x.rightArm,
    leftThigh: x.leftThigh ?? x.leg, rightThigh: x.rightThigh,
    leftCalf: x.leftCalf, rightCalf: x.rightCalf,
  }));

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold">Заміри</h3>
        {!editing && <button onClick={() => setEditing({ date: kyivDayKey(new Date()) })} className="btn btn-primary"><Plus className="w-4 h-4" /> Додати замір</button>}
      </div>

      {editing && (
        <form action={save} className="card p-6 space-y-3 mb-4 border-accent/30">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold">{editing.id ? "Редагувати замір" : "Новий замір"}</h3>
            <button type="button" onClick={() => setEditing(null)} className="btn"><X className="w-4 h-4" /></button>
          </div>
          <div className="grid md:grid-cols-4 gap-3">
            <div><label className="label">Дата</label><input name="date" type="date" defaultValue={editing.date ? kyivDayKey(new Date(editing.date)) : ""} required className="input" /></div>
            <NumField name="weight" label="Вага (кг)" defaultValue={editing.weight} />
            <NumField name="bodyFat" label="% жиру" defaultValue={editing.bodyFat} />
            <NumField name="shoulders" label="Плечовий пояс" defaultValue={editing.shoulders} />
            <NumField name="chest" label="Груди" defaultValue={editing.chest} />
            <NumField name="waist" label="Талія" defaultValue={editing.waist} />
            <NumField name="hips" label="Сідниці" defaultValue={editing.hips} />
            <NumField name="leftArm" label="Ліва рука" defaultValue={editing.leftArm} />
            <NumField name="rightArm" label="Права рука" defaultValue={editing.rightArm} />
            <NumField name="leftThigh" label="Ліве стегно" defaultValue={editing.leftThigh} />
            <NumField name="rightThigh" label="Праве стегно" defaultValue={editing.rightThigh} />
            <NumField name="leftCalf" label="Ліва гомілка" defaultValue={editing.leftCalf} />
            <NumField name="rightCalf" label="Права гомілка" defaultValue={editing.rightCalf} />
          </div>
          <div className="text-[11px] text-muted">Усі обхвати — у см · мінімум 0.1, тільки додатні числа</div>
          <div><label className="label">Нотатка</label><input name="notes" defaultValue={editing.notes ?? ""} className="input" /></div>
          <div className="flex gap-2 flex-wrap">
            <button className="btn btn-primary" disabled={pending}>
              {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> Зберегти</>}
            </button>
            <button type="button" onClick={() => setEditing(null)} className="btn">Скасувати</button>
            {editing.id && (
              <button
                type="button"
                onClick={() => del(editing.id)}
                disabled={pending}
                className="btn text-danger border-danger/30 hover:bg-danger/10 ml-auto"
              >
                <Trash2 className="w-4 h-4" /> Видалити
              </button>
            )}
          </div>
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
              { key: "shoulders", color: "#a78bfa", name: "Плечі" },
              { key: "chest", color: "#3b82f6", name: "Груди" },
              { key: "waist", color: "#6366f1", name: "Талія" },
              { key: "hips", color: "#60a5fa", name: "Сідниці" },
              { key: "leftArm", color: "#f472b6", name: "Ліва рука" },
              { key: "rightArm", color: "#fb7185", name: "Права рука" },
              { key: "leftThigh", color: "#22d3ee", name: "Ліве стегно" },
              { key: "rightThigh", color: "#34d399", name: "Праве стегно" },
            ]} />
          </div>
        </div>
      )}

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="text-muted text-[10px] uppercase tracking-wider">
            <th className="text-left p-3">Дата</th>
            <th className="text-right p-2">Вага</th>
            <th className="text-right p-2">%жир</th>
            <th className="text-right p-2">Плечі</th>
            <th className="text-right p-2">Груди</th>
            <th className="text-right p-2">Талія</th>
            <th className="text-right p-2">Сідн</th>
            <th className="text-right p-2">Л.рук</th>
            <th className="text-right p-2">П.рук</th>
            <th className="text-right p-2">Л.ст</th>
            <th className="text-right p-2">П.ст</th>
            <th className="text-right p-2">Л.гом</th>
            <th className="text-right p-2">П.гом</th>
            <th className="text-right p-3"></th>
          </tr></thead>
          <tbody>
            {items.slice().reverse().map(m => (
              <tr key={m.id} className="border-t border-border text-xs">
                <td className="p-3 whitespace-nowrap">{new Date(m.date).toLocaleDateString("uk-UA", { timeZone: "Europe/Kyiv" })}</td>
                <td className="text-right">{m.weight?.toFixed(1) ?? "—"}</td>
                <td className="text-right">{m.bodyFat?.toFixed(1) ?? "—"}</td>
                <td className="text-right">{m.shoulders?.toFixed(1) ?? "—"}</td>
                <td className="text-right">{m.chest?.toFixed(1) ?? "—"}</td>
                <td className="text-right">{m.waist?.toFixed(1) ?? "—"}</td>
                <td className="text-right">{m.hips?.toFixed(1) ?? "—"}</td>
                <td className="text-right">{(m.leftArm ?? m.arm)?.toFixed(1) ?? "—"}</td>
                <td className="text-right">{m.rightArm?.toFixed(1) ?? "—"}</td>
                <td className="text-right">{(m.leftThigh ?? m.leg)?.toFixed(1) ?? "—"}</td>
                <td className="text-right">{m.rightThigh?.toFixed(1) ?? "—"}</td>
                <td className="text-right">{m.leftCalf?.toFixed(1) ?? "—"}</td>
                <td className="text-right">{m.rightCalf?.toFixed(1) ?? "—"}</td>
                <td className="text-right p-3"><div className="flex gap-1 justify-end">
                  <button onClick={() => setEditing(m)} title="Редагувати"
                    className="btn text-xs gap-1 border-accent/30 text-accent hover:bg-accent/10">
                    <Pencil className="w-3.5 h-3.5" /><span className="hidden sm:inline">Змінити</span>
                  </button>
                  <button onClick={() => del(m.id)} title="Видалити"
                    className="btn text-xs text-danger border-danger/30 hover:bg-danger/10">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function NumField({ name, label, defaultValue }: { name: string; label: string; defaultValue?: number | null }) {
  return (
    <div>
      <label className="label">{label}</label>
      <input
        name={name}
        type="number"
        step="any"
        min="0"
        inputMode="decimal"
        defaultValue={defaultValue ?? ""}
        className="input"
        onKeyDown={(e) => { if (e.key === "-" || e.key === "e" || e.key === "E") e.preventDefault(); }}
      />
    </div>
  );
}
