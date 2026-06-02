"use client";
import { useState, useTransition } from "react";
import { resetOnlineSessions } from "./actions";
import { RotateCcw, Loader2, Check, Wifi } from "lucide-react";

export function ResetOnlineSessions() {
  const [pending, start] = useTransition();
  const [done, setDone] = useState<number | null>(null);

  function reset() {
    if (!confirm("Скинути лічильник тренувань для ВСІХ онлайн-клієнтів? Лічильник почне рахувати з нуля.")) return;
    setDone(null);
    start(async () => {
      const res = await resetOnlineSessions();
      setDone(res.count);
    });
  }

  return (
    <div className="card p-5 md:p-6">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-accent2/10 text-accent2 flex items-center justify-center shrink-0">
          <Wifi className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold">Скинути тренування онлайн-клієнтам</h3>
          <p className="text-sm text-muted mt-1">
            Обнуляє лічильник «Тренувань» для всіх онлайн-клієнтів одразу. Корисно,
            якщо потрібно скинути серед місяця — інакше він і так автоматично
            обнулюється 1 числа.
          </p>
          <button
            onClick={reset}
            disabled={pending}
            className="btn mt-3 border-accent2/40 text-accent2 hover:bg-accent2/10"
          >
            {pending ? <Loader2 className="w-4 h-4 animate-spin" /> :
             done !== null ? <Check className="w-4 h-4" /> :
             <RotateCcw className="w-4 h-4" />}
            {pending ? "Скидаю…" : done !== null ? `Скинуто (${done})` : "Скинути всім онлайн"}
          </button>
        </div>
      </div>
    </div>
  );
}
