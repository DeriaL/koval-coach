"use client";
import { useState } from "react";
import { CreditCard, Loader2, ExternalLink } from "lucide-react";

export function PayButton({ amount }: { amount: number }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePay() {
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
    <div className="flex flex-col items-start gap-1.5">
      <button
        onClick={handlePay}
        disabled={loading}
        className="btn btn-primary gap-2"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
        {loading ? "Створення платежу…" : `Сплатити ${amount.toLocaleString("uk-UA")} ₴`}
        {!loading && <ExternalLink className="w-3.5 h-3.5 opacity-60" />}
      </button>
      {error && <p className="text-danger text-xs">{error}</p>}
    </div>
  );
}
