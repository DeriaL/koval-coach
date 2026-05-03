"use client";
import { useState, useTransition } from "react";
import Link from "next/link";
import { addLedgerEntry, deleteLedgerEntry } from "./actions";
import { ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, Legend, LineChart, Line } from "recharts";
import {
  TrendingUp, TrendingDown, Plus, Save, Loader2, Trash2, X, ArrowUpCircle, ArrowDownCircle,
  Wallet, BarChart3, PieChart, Calendar, Download
} from "lucide-react";
import { PageHeader } from "@/components/ui";

type Entry = {
  id: string; type: string; amount: number; currency: string;
  date: string; category: string | null; notes: string | null;
};
type Props = {
  period: "month" | "year" | "all";
  kpi: { income: number; expense: number; profit: number; margin: number };
  year: { income: number; expense: number; profit: number };
  monthly: { label: string; income: number; expense: number; profit: number }[];
  incomeCats: { name: string; value: number }[];
  expenseCats: { name: string; value: number }[];
  entries: Entry[];
};

const INCOME_CATEGORIES = ["Тренування", "Курс", "Консультація", "Інше"];
const EXPENSE_CATEGORIES = ["Реклама", "Оренда залу", "Обладнання", "Курси/освіта", "Податки", "Інше"];

const fmt = (n: number) => `${n.toLocaleString("uk-UA")} ₴`;

export function FinanceClient({ period, kpi, year, monthly, incomeCats, expenseCats, entries }: Props) {
  const [adding, setAdding] = useState<null | "income" | "expense">(null);
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const today = new Date().toISOString().slice(0, 10);

  // Used categories from existing entries (latest first)
  const usedIncomeCats = Array.from(new Set(entries.filter(e => e.type === "income" && e.category).map(e => e.category!)));
  const usedExpenseCats = Array.from(new Set(entries.filter(e => e.type === "expense" && e.category).map(e => e.category!)));
  const incomeSuggestions = Array.from(new Set([...usedIncomeCats, ...INCOME_CATEGORIES]));
  const expenseSuggestions = Array.from(new Set([...usedExpenseCats, ...EXPENSE_CATEGORIES]));

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

  function exportCSV() {
    const header = "Дата,Тип,Сума,Категорія,Нотатка";
    const rows = entries.map(e =>
      `${new Date(e.date).toISOString().slice(0,10)},${e.type === "income" ? "дохід" : "витрата"},${e.amount},${e.category ?? ""},"${(e.notes ?? "").replace(/"/g, '""')}"`
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `finance-${period}.csv`;
    a.click();
  }

  // Group entries by date for cleaner timeline
  const grouped = new Map<string, Entry[]>();
  for (const e of entries) {
    const k = new Date(e.date).toLocaleDateString("uk-UA", { day: "2-digit", month: "long", year: "numeric" });
    const arr = grouped.get(k) ?? [];
    arr.push(e); grouped.set(k, arr);
  }

  return (
    <>
      <PageHeader
        title="Фінанси"
        subtitle="Дохід, витрати, рентабельність — повний облік"
        action={
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={exportCSV} className="btn text-sm" disabled={entries.length === 0}>
              <Download className="w-4 h-4" /> <span className="hidden sm:inline">CSV</span>
            </button>
            <button onClick={() => setAdding("expense")} className="btn text-sm hover:border-danger/40 hover:text-danger">
              <Plus className="w-4 h-4" /> Витрата
            </button>
            <button onClick={() => setAdding("income")} className="btn btn-primary text-sm">
              <Plus className="w-4 h-4" /> Дохід
            </button>
          </div>
        }
      />

      {/* Period filter */}
      <div className="card p-2 mb-5 flex items-center gap-1 overflow-x-auto scrollbar-thin">
        <PeriodChip href="/admin/finance?period=month" label="Цей місяць" active={period === "month"} />
        <PeriodChip href="/admin/finance?period=year" label="Цей рік" active={period === "year"} />
        <PeriodChip href="/admin/finance?period=all" label="Весь час" active={period === "all"} />
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <Kpi icon={TrendingUp} label="Дохід" value={fmt(kpi.income)} color="success" />
        <Kpi icon={TrendingDown} label="Витрати" value={fmt(kpi.expense)} color="danger" />
        <Kpi icon={ArrowUpCircle} label="Прибуток" value={fmt(kpi.profit)} color={kpi.profit >= 0 ? "accent" : "danger"} />
        <Kpi icon={ArrowDownCircle} label="Маржа" value={`${kpi.margin}%`} color={kpi.margin >= 30 ? "success" : kpi.margin >= 0 ? "accent2" : "danger"} />
      </div>

      {/* ADD FORM */}
      {adding && (
        <form action={submit} className={`card p-5 mb-5 space-y-3 animate-fade-up ${adding === "income" ? "border-success/30 bg-success/5" : "border-danger/30 bg-danger/5"}`}>
          <div className="flex items-center justify-between">
            <h4 className="font-semibold flex items-center gap-2">
              {adding === "income" ? <><TrendingUp className="w-4 h-4 text-success" /> Новий дохід</> : <><TrendingDown className="w-4 h-4 text-danger" /> Нова витрата</>}
            </h4>
            <button type="button" onClick={() => setAdding(null)} className="btn px-3 py-2"><X className="w-4 h-4" /></button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div>
              <label className="label">Сума (₴)</label>
              <input name="amount" type="number" step="50" required autoFocus className="input" />
            </div>
            <div>
              <label className="label">Дата</label>
              <input name="date" type="date" defaultValue={today} className="input" />
            </div>
            <div>
              <label className="label">Категорія</label>
              <input
                name="category"
                list={`cats-${adding}`}
                className="input"
                placeholder="Обери або введи свою"
                autoComplete="off"
              />
              <datalist id={`cats-${adding}`}>
                {(adding === "income" ? incomeSuggestions : expenseSuggestions).map(c =>
                  <option key={c} value={c} />
                )}
              </datalist>
              <div className="text-[10px] text-muted mt-1">↓ кліч стрілкою або просто пиши свою</div>
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

      {/* MONTHLY CHART */}
      <div className="card p-5 mb-5">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <h3 className="font-semibold flex items-center gap-2"><BarChart3 className="w-4 h-4 text-accent" /> Динаміка · 12 місяців</h3>
          <div className="text-xs text-muted">Дохід vs Витрати</div>
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={monthly} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid stroke="rgb(var(--border))" vertical={false} />
            <XAxis dataKey="label" stroke="rgb(var(--muted))" fontSize={11} />
            <YAxis stroke="rgb(var(--muted))" fontSize={11} width={40} />
            <Tooltip contentStyle={{ background: "rgb(var(--card))", border: "1px solid rgb(var(--border))", borderRadius: 12 }} formatter={(v: any) => fmt(Number(v))} />
            <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="income" fill="rgb(var(--success))" name="Дохід" radius={[6, 6, 0, 0]} />
            <Bar dataKey="expense" fill="rgb(var(--danger))" name="Витрати" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* PROFIT TREND */}
      <div className="card p-5 mb-5">
        <h3 className="font-semibold flex items-center gap-2 mb-3"><TrendingUp className="w-4 h-4 text-accent" /> Прибуток по місяцях</h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={monthly} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid stroke="rgb(var(--border))" vertical={false} />
            <XAxis dataKey="label" stroke="rgb(var(--muted))" fontSize={11} />
            <YAxis stroke="rgb(var(--muted))" fontSize={11} width={40} />
            <Tooltip contentStyle={{ background: "rgb(var(--card))", border: "1px solid rgb(var(--border))", borderRadius: 12 }} formatter={(v: any) => fmt(Number(v))} />
            <Line type="monotone" dataKey="profit" stroke="rgb(var(--accent))" strokeWidth={3} dot={{ r: 4 }} name="Прибуток" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* CATEGORY BREAKDOWN */}
      <div className="grid md:grid-cols-2 gap-3 mb-5">
        <CategoryBlock title="Структура доходу" entries={incomeCats} color="success" />
        <CategoryBlock title="Структура витрат" entries={expenseCats} color="danger" />
      </div>

      {/* YEAR CARD */}
      <div className="card p-5 mb-5 relative overflow-hidden">
        <div className="absolute inset-0 -z-10 opacity-30 bg-gradient-to-br from-accent/15 via-transparent to-accent2/15" />
        <div className="text-[10px] uppercase tracking-wider text-muted">Підсумок з початку року</div>
        <div className="text-lg font-bold mt-2 flex flex-wrap items-baseline gap-x-2">
          <span className="text-success">{fmt(year.income)}</span>
          <span className="text-muted text-sm">мінус</span>
          <span className="text-danger">{fmt(year.expense)}</span>
          <span className="text-muted text-sm">=</span>
          <span className={year.profit >= 0 ? "text-accent" : "text-danger"}>{fmt(year.profit)}</span>
        </div>
      </div>

      {/* ENTRIES TIMELINE */}
      <div className="card p-5">
        <h3 className="font-semibold flex items-center gap-2 mb-4"><Calendar className="w-4 h-4 text-accent" /> Операції</h3>
        {entries.length === 0 ? (
          <div className="text-muted text-sm text-center py-6">Записів ще немає. Додай перший дохід або витрату згори.</div>
        ) : (
          <div className="space-y-5">
            {Array.from(grouped.entries()).map(([day, items]) => {
              const dayInc = items.filter(e => e.type === "income").reduce((s, e) => s + e.amount, 0);
              const dayExp = items.filter(e => e.type === "expense").reduce((s, e) => s + e.amount, 0);
              return (
                <div key={day}>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="text-xs uppercase tracking-wider text-accent font-semibold">{day}</div>
                    <div className="flex-1 h-px bg-border" />
                    <div className="text-[11px] text-muted">
                      {dayInc > 0 && <span className="text-success">+{fmt(dayInc)}</span>}
                      {dayInc > 0 && dayExp > 0 && " · "}
                      {dayExp > 0 && <span className="text-danger">−{fmt(dayExp)}</span>}
                    </div>
                  </div>
                  <div className="divide-y divide-border">
                    {items.map(e => (
                      <div key={e.id} className="py-2.5 flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${e.type === "income" ? "bg-success/15 text-success" : "bg-danger/15 text-danger"}`}>
                          {e.type === "income" ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">
                            {e.notes || e.category || (e.type === "income" ? "Дохід" : "Витрата")}
                          </div>
                          {e.category && e.notes && <div className="text-[11px] text-muted">{e.category}</div>}
                        </div>
                        <div className={`font-bold text-sm shrink-0 ${e.type === "income" ? "text-success" : "text-danger"}`}>
                          {e.type === "income" ? "+" : "−"}{e.amount.toLocaleString("uk-UA")} ₴
                        </div>
                        <button onClick={() => del(e.id)} disabled={pending}
                          className="btn text-xs text-muted hover:text-danger px-2"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}

function Kpi({ icon: Icon, label, value, color }: any) {
  const cls =
    color === "success" ? "border-success/30"
    : color === "danger" ? "border-danger/30"
    : color === "accent2" ? "border-accent2/30"
    : "border-accent/30";
  const iconCls =
    color === "success" ? "text-success"
    : color === "danger" ? "text-danger"
    : color === "accent2" ? "text-accent2"
    : "text-accent";
  return (
    <div className={`card p-3 md:p-4 ${cls}`}>
      <div className={`flex items-center gap-1.5 text-[10px] uppercase tracking-wider ${iconCls}`}><Icon className="w-3.5 h-3.5" /> {label}</div>
      <div className="text-lg md:text-2xl font-black mt-1.5">{value}</div>
    </div>
  );
}

function PeriodChip({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link href={href}
      className={`shrink-0 inline-flex items-center px-3 py-1.5 rounded-lg text-xs border transition active:scale-95 ${
        active ? "accent-shine text-white border-transparent shadow-glow" : "bg-surface border-border hover:border-accent/40"
      }`}>
      {label}
    </Link>
  );
}

function CategoryBlock({ title, entries, color }: { title: string; entries: { name: string; value: number }[]; color: "success" | "danger" }) {
  const total = entries.reduce((s, e) => s + e.value, 0);
  const cls = color === "success" ? "text-success" : "text-danger";
  const fillCls = color === "success" ? "bg-success" : "bg-danger";
  return (
    <div className="card p-5">
      <h3 className={`font-semibold flex items-center gap-2 mb-3 ${cls}`}><PieChart className="w-4 h-4" /> {title}</h3>
      {entries.length === 0 ? (
        <div className="text-muted text-sm text-center py-4">Поки порожньо</div>
      ) : (
        <div className="space-y-2.5">
          {entries.slice(0, 6).map(e => {
            const pct = total > 0 ? Math.round((e.value / total) * 100) : 0;
            return (
              <div key={e.name}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="truncate">{e.name}</span>
                  <span className="text-muted shrink-0 ml-2">{fmt(e.value)} <span className="text-[10px]">({pct}%)</span></span>
                </div>
                <div className="h-1.5 rounded-full bg-surface overflow-hidden">
                  <div className={`h-full ${fillCls} transition-all`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
