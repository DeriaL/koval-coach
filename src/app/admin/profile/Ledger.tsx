"use client";
import { useState, useTransition } from "react";
import { addLedgerEntry, deleteLedgerEntry } from "./actions";
import { TrendingUp, TrendingDown, Plus, Save, Loader2, Trash2, X, ArrowDownCircle, ArrowUpCircle } from "lucide-react";

type Entry = {
  id: string;
  type: string;
  amount: number;
  currency: string;
  date: string;
  category: string | null;
  notes: string | null;
};

const INCOME_CATEGORIES = ["Тренування", "Курс", "Консультація", "Інше"];
const EXPENSE_CATEGORIES = ["Реклама", "Оренда залу", "Обладнання", "Курси/освіта", "Податки", "Інше"];

export function Ledger({ entries }: { entries: Entry[] }) {
  const [adding, setAdding] = useState<null | "income" | "expense">(null);
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const today = new Date().toISOString().slice(0, 10);

  // ---- Stats ----
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const yearStart = new Date(now.getFullYear(), 0, 1);

  function sum(arr: Entry[], type: string) {
    return arr.filter(e => e.type === type).reduce((s, e) => s + e.amount, 0);
  }

  const monthEntries = entries.filter(e => new Date(e.date) >= monthStart);
  const yearEntries = entries.filter(e => new Date(e.date) >= yearStart);

  const monthIncome = sum(monthEntries, "income");
  const monthExpense = sum(monthEntries, "expense");
  const monthProfit = monthIncome - monthExpense;
  const monthMargin = monthIncome > 0 ? Math.round((monthProfit / monthIncome) * 100) : 0;

  const yearIncome = sum(yearEntries, "income");
  const yearExpense = sum(yearEntries, "expense");
  const yearProfit = yearIncome - yearExpense;

  function submit(fd: FormData) {
    setErr(null);
    const data: any = {
      type: adding,
      amount: fd.get("amount"),
      date: fd.get("date") || today,
      category: fd.get("category") || "",
      notes: fd.get("notes") || "",
    };
    start(async () => {
      try { await addLedgerEntry(data); setAdding(null); }
      catch (e: any) { setErr(e?.message ?? "Помилка"); }
    });
  }

  function del(id: string) {
    if (!window.confirm("Видалити запис?")) return;
    start(() => deleteLedgerEntry(id));
  }

  const fmt = (n: number) => `${n.toLocaleString("uk-UA")} ₴`;

  return (
    <div className="space-y-4">
      {/* THIS MONTH KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi icon={TrendingUp} label="Дохід · міс." value={fmt(monthIncome)} color="success" />
        <Kpi icon={TrendingDown} label="Витрати · міс." value={fmt(monthExpense)} color="danger" />
        <Kpi icon={ArrowUpCircle} label="Прибуток · міс." value={fmt(monthProfit)} color={monthProfit >= 0 ? "accent" : "danger"} />
        <Kpi icon={ArrowDownCircle} label="Маржа" value={`${monthMargin}%`} color={monthMargin >= 30 ? "success" : monthMargin >= 0 ? "accent2" : "danger"} />
      </div>

      {/* YEAR */}
      <div className="card p-4 flex items-center justify-between gap-3 flex-wrap">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted">З початку року</div>
          <div className="text-sm md:text-base font-medium mt-1">
            <span className="text-success">{fmt(yearIncome)}</span>
            {" — "}
            <span className="text-danger">{fmt(yearExpense)}</span>
            {" = "}
            <span className={yearProfit >= 0 ? "text-accent font-bold" : "text-danger font-bold"}>{fmt(yearProfit)}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setAdding("income")} className="btn btn-primary text-sm">
            <Plus className="w-4 h-4" /> Дохід
          </button>
          <button onClick={() => setAdding("expense")} className="btn text-sm hover:border-danger/40 hover:text-danger">
            <Plus className="w-4 h-4" /> Витрата
          </button>
        </div>
      </div>

      {/* ADD FORM */}
      {adding && (
        <form action={submit} className={`card p-5 space-y-3 animate-fade-up ${adding === "income" ? "border-success/30 bg-success/5" : "border-danger/30 bg-danger/5"}`}>
          <div className="flex items-center justify-between">
            <h4 className="font-semibold flex items-center gap-2">
              {adding === "income" ? <><TrendingUp className="w-4 h-4 text-success" /> Новий дохід</> : <><TrendingDown className="w-4 h-4 text-danger" /> Нова витрата</>}
            </h4>
            <button type="button" onClick={() => setAdding(null)} className="btn px-3 py-2"><X className="w-4 h-4" /></button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div>
              <label className="label">Сума (₴)</label>
              <input name="amount" type="number" step="50" required className="input" autoFocus />
            </div>
            <div>
              <label className="label">Дата</label>
              <input name="date" type="date" defaultValue={today} className="input" />
            </div>
            <div>
              <label className="label">Категорія</label>
              <select name="category" className="select">
                <option value="">—</option>
                {(adding === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Нотатка</label>
            <input name="notes" className="input" placeholder="напр. клієнт Олег, пакет №3" />
          </div>
          {err && <div className="text-danger text-xs">{err}</div>}
          <button className="btn btn-primary" disabled={pending}>
            {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> Додати</>}
          </button>
        </form>
      )}

      {/* RECENT ENTRIES */}
      <div className="card p-5">
        <h3 className="font-semibold mb-3">Останні операції</h3>
        {entries.length === 0 ? (
          <div className="text-muted text-sm text-center py-6">Записів ще немає. Додай перший дохід або витрату вище.</div>
        ) : (
          <div className="divide-y divide-border">
            {entries.slice(0, 30).map(e => (
              <div key={e.id} className="py-3 flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${e.type === "income" ? "bg-success/15 text-success" : "bg-danger/15 text-danger"}`}>
                  {e.type === "income" ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">
                    {e.notes || e.category || (e.type === "income" ? "Дохід" : "Витрата")}
                  </div>
                  <div className="text-[11px] text-muted">
                    {new Date(e.date).toLocaleDateString("uk-UA")}
                    {e.category ? ` · ${e.category}` : ""}
                  </div>
                </div>
                <div className={`font-bold text-sm shrink-0 ${e.type === "income" ? "text-success" : "text-danger"}`}>
                  {e.type === "income" ? "+" : "−"}{e.amount.toLocaleString("uk-UA")} ₴
                </div>
                <button onClick={() => del(e.id)} disabled={pending}
                  className="btn text-xs text-muted hover:text-danger px-2"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Kpi({ icon: Icon, label, value, color }: any) {
  const cls =
    color === "success" ? "border-success/30 text-success"
    : color === "danger" ? "border-danger/30 text-danger"
    : color === "accent2" ? "border-accent2/30 text-accent2"
    : "border-accent/30 text-accent";
  return (
    <div className={`card p-3 md:p-4 ${cls}`}>
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider"><Icon className="w-3.5 h-3.5" /> {label}</div>
      <div className="text-lg md:text-xl font-black mt-1.5 text-text">{value}</div>
    </div>
  );
}
