"use client";
import { useState } from "react";
import { CreditCard, Loader2, ExternalLink, ChevronDown } from "lucide-react";

const PRESET_AMOUNTS = [3000, 4000, 5000, 6000, 8000, 10000];

export function PayButton({ defaultAmount }: { defaultAmount?: number }) {
  const [amount, setAmount] = useState<number>(defaultAmount ?? 5000);
  const [custom, setCustom] = useState(!defaultAmount);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePay() {
    if (!amount || amount <= 0) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });
      const data = await res.json();
      if (!res.ok || !data.pageUrl) {
        setError(data.error ?? "Помилка при створенні платежу");
        return;
      }
      window.location.href = data.pageUrl;
    } catch {
      setError("Мережева помилка. Спробуй ще раз.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card overflow-hidden mb-6">
      <div className="h-[3px] bg-gradient-to-r from-[rgb(var(--accent))] to-[rgb(var(--accent2))]" />
      <div className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-9 h-9 rounded-xl accent-shine flex items-center justify-center text-white shrink-0">
            <CreditCard className="w-4 h-4" />
          </div>
          <div>
            <div className="font-semibold">Оплата онлайн</div>
            <div className="text-xs text-muted">Plata by Mono · безпечний платіж</div>
          </div>
        </div>

        {/* Amount selector */}
        <div className="mb-4">
          <div className="text-xs text-muted mb-2">Сума пакету</div>
          {defaultAmount ? (
            <div className="flex items-center gap-2 flex-wrap">
              <div className="text-2xl font-black text-gradient">{amount.toLocaleString("uk-UA")} ₴</div>
              <button
                onClick={() => setCustom(v => !v)}
                className="btn text-xs py-1 px-2 gap-1"
              >
                Змінити <ChevronDown className={`w-3 h-3 transition-transform ${custom ? "rotate-180" : ""}`} />
              </button>
            </div>
          ) : null}

          {(custom || !defaultAmount) && (
            <div className="mt-2 space-y-2">
              <div className="flex flex-wrap gap-2">
                {PRESET_AMOUNTS.map(a => (
                  <button
                    key={a}
                    onClick={() => setAmount(a)}
                    className={`btn text-sm py-1.5 px-3 ${amount === a ? "btn-primary" : ""}`}
                  >
                    {a.toLocaleString("uk-UA")} ₴
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={100}
                  step={100}
                  placeholder="Інша сума"
                  value={amount || ""}
                  onChange={e => setAmount(Number(e.target.value))}
                  className="input w-40 text-sm"
                />
                <span className="text-muted text-sm">₴</span>
              </div>
            </div>
          )}
        </div>

        <button
          onClick={handlePay}
          disabled={loading || !amount || amount <= 0}
          className="btn btn-primary gap-2 w-full sm:w-auto"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
          {loading ? "Створення платежу…" : `Сплатити ${amount ? amount.toLocaleString("uk-UA") + " ₴" : ""}`}
          {!loading && <ExternalLink className="w-3.5 h-3.5 opacity-60" />}
        </button>

        {error && <p className="text-danger text-xs mt-2">{error}</p>}

        <p className="text-[11px] text-muted mt-3">
          Після оплати ти будеш повернутий назад. Платіж автоматично відображається в історії.
        </p>
      </div>
    </div>
  );
}
