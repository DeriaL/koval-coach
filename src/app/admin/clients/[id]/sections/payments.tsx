"use client";
import { useState, useTransition } from "react";
import { savePayment, deletePayment } from "../../actions";
import { Pencil, Trash2, Plus, Save, X, Loader2 } from "lucide-react";

export function PaymentsTab({ clientId, items }: { clientId: string; items: any[] }) {
  const [editing, setEditing] = useState<any | null>(null);
  const [pending, start] = useTransition();

  function save(fd: FormData) {
    const data = Object.fromEntries(fd);
    start(async () => { await savePayment(clientId, { ...data, id: editing?.id }); setEditing(null); });
  }
  function del(id: string) { if (!confirm("Видалити?")) return; start(async () => { await deletePayment(id, clientId); }); }

  const total = items.filter(p => p.status === "paid").reduce((s, p) => s + p.amount, 0);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="card px-5 py-3">
          <div className="text-xs uppercase text-muted">Всього сплачено</div>
          <div className="text-xl font-bold">{total.toLocaleString("uk-UA")} ₴</div>
        </div>
        {!editing && <button onClick={() => setEditing({ date: new Date().toISOString().slice(0,10), status: "paid" })} className="btn btn-primary"><Plus className="w-4 h-4" /> Новий платіж</button>}
      </div>

      {editing && (
        <form action={save} className="card p-6 space-y-3 mb-4">
          <div className="flex justify-between items-center"><h3 className="font-semibold">{editing.id ? "Редагувати" : "Новий платіж"}</h3>
            <button type="button" onClick={() => setEditing(null)} className="btn"><X className="w-4 h-4" /></button></div>
          <div className="grid md:grid-cols-4 gap-3">
            <div><label className="label">Сума</label><input name="amount" type="number" step="0.01" defaultValue={editing.amount ?? ""} required className="input" /></div>
            <div><label className="label">Валюта</label><input name="currency" defaultValue={editing.currency ?? "UAH"} className="input" /></div>
            <div><label className="label">Дата</label><input name="date" type="date" defaultValue={editing.date ? new Date(editing.date).toISOString().slice(0,10) : ""} required className="input" /></div>
            <div><label className="label">Статус</label>
              <select name="status" defaultValue={editing.status ?? "paid"} className="select">
                <option value="paid">Оплачено</option>
                <option value="pending">Очікує</option>
                <option value="overdue">Прострочено</option>
              </select>
            </div>
            <div><label className="label">Метод</label><input name="method" defaultValue={editing.method ?? ""} className="input" placeholder="card / cash" /></div>
          </div>
          <div><label className="label">Нотатка</label><input name="notes" defaultValue={editing.notes ?? ""} className="input" /></div>
          <button className="btn btn-primary" disabled={pending}>
            {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> Зберегти</>}
          </button>
        </form>
      )}

      <div className="card divide-y divide-border">
        {items.length === 0 && <div className="p-6 text-muted text-center">Платежів немає</div>}
        {items.map(p => (
          <div key={p.id} className="p-4 flex items-center justify-between gap-3 flex-wrap">
            <div>
              <div className="font-medium">{p.amount} {p.currency}</div>
              <div className="text-xs text-muted">{new Date(p.date).toLocaleDateString("uk-UA")} · {p.method ?? "—"}</div>
            </div>
            <span className={`chip text-xs ${p.status === "paid" ? "text-success" : p.status === "pending" ? "text-accent" : "text-danger"}`}>{p.status}</span>
            <div className="flex gap-1">
              <button onClick={() => setEditing(p)} className="btn text-sm"><Pencil className="w-3.5 h-3.5" /></button>
              <button onClick={() => del(p.id)} className="btn text-sm text-danger"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
