import { requireTrainer } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui";
import { TrendingUp, TrendingDown, Wallet, ArrowUpCircle, ArrowDownCircle, PieChart as PieIcon, BarChart3 } from "lucide-react";
import { FinanceClient } from "./client";

type Period = "month" | "year" | "all";

export default async function FinancePage({ searchParams }: { searchParams: { period?: string } }) {
  const u = await requireTrainer();
  const period: Period = (searchParams?.period === "year" ? "year" : searchParams?.period === "all" ? "all" : "month");

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const yearStart = new Date(now.getFullYear(), 0, 1);
  const since = period === "month" ? monthStart : period === "year" ? yearStart : new Date(0);

  const all = await prisma.ledgerEntry.findMany({
    where: { trainerId: u.id },
    orderBy: { date: "desc" },
  });
  const filtered = all.filter(e => new Date(e.date) >= since);

  const sumBy = (arr: typeof all, type: string) => arr.filter(e => e.type === type).reduce((s, e) => s + e.amount, 0);

  const income = sumBy(filtered, "income");
  const expense = sumBy(filtered, "expense");
  const profit = income - expense;
  const margin = income > 0 ? Math.round((profit / income) * 100) : 0;

  // ---- Monthly series (last 12 months) ----
  const monthly: { label: string; income: number; expense: number; profit: number }[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const next = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    const monthEntries = all.filter(e => {
      const ed = new Date(e.date);
      return ed >= d && ed < next;
    });
    const inc = sumBy(monthEntries, "income");
    const exp = sumBy(monthEntries, "expense");
    monthly.push({
      label: d.toLocaleDateString("uk-UA", { month: "short" }),
      income: inc,
      expense: exp,
      profit: inc - exp,
    });
  }

  // ---- Category breakdown (current period) ----
  const incomeBy = new Map<string, number>();
  const expenseBy = new Map<string, number>();
  for (const e of filtered) {
    const map = e.type === "income" ? incomeBy : expenseBy;
    const key = e.category || "Без категорії";
    map.set(key, (map.get(key) ?? 0) + e.amount);
  }
  const incomeCats = Array.from(incomeBy, ([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  const expenseCats = Array.from(expenseBy, ([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

  // ---- Year-over-period totals ----
  const yearEntries = all.filter(e => new Date(e.date) >= yearStart);
  const yearIncome = sumBy(yearEntries, "income");
  const yearExpense = sumBy(yearEntries, "expense");
  const yearProfit = yearIncome - yearExpense;

  return (
    <div className="max-w-6xl">
      <FinanceClient
        period={period}
        kpi={{ income, expense, profit, margin }}
        year={{ income: yearIncome, expense: yearExpense, profit: yearProfit }}
        monthly={monthly}
        incomeCats={incomeCats}
        expenseCats={expenseCats}
        entries={filtered.map(e => ({
          id: e.id, type: e.type, amount: e.amount, currency: e.currency,
          date: e.date.toISOString(), category: e.category, notes: e.notes,
        }))}
      />
    </div>
  );
}
