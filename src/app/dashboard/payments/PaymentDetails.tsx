"use client";
import { useState } from "react";
import { CreditCard, Copy, Check, ChevronDown } from "lucide-react";

const DETAILS = [
  { label: "Отримувач", value: "ФОП Ковальчук Дмитро Романович" },
  { label: "IBAN", value: "UA953220010000026009370058120", mono: true },
  { label: "ІПН/ЄДРПОУ", value: "3666104498", mono: true },
  { label: "Банк", value: "АТ «Універсал Банк»" },
  { label: "МФО", value: "322001", mono: true },
  { label: "ЄДРПОУ Банку", value: "21133352", mono: true },
  { label: "Призначення платежу", value: "Надання послуг у сфері спорту" },
];

export function PaymentDetails() {
  const [open, setOpen] = useState(true);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  function copy(value: string, key: string) {
    navigator.clipboard.writeText(value);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  }

  return (
    <div className="card mb-6 overflow-hidden">
      <button onClick={() => setOpen(!open)}
        className="w-full p-4 md:p-5 flex items-center gap-3 text-left hover:bg-card/60 transition">
        <div className="w-10 h-10 rounded-xl accent-shine text-white flex items-center justify-center shrink-0">
          <CreditCard className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold">Реквізити для оплати</div>
          <div className="text-xs text-muted">ФОП Ковальчук Дмитро Романович · АТ «Універсал Банк»</div>
        </div>
        <ChevronDown className={`w-5 h-5 text-muted shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      <div
        className="grid transition-all duration-500 ease-out"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div className="px-4 md:px-5 pb-5 space-y-2">
            {DETAILS.map((d) => (
              <button key={d.label}
                onClick={() => copy(d.value, d.label)}
                title="Натисни щоб скопіювати"
                className="w-full text-left p-3 rounded-xl bg-surface border border-border hover:border-accent/40 transition flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] uppercase tracking-wider text-muted">{d.label}</div>
                  <div className={`text-sm mt-0.5 truncate ${d.mono ? "font-mono" : "font-medium"}`}>
                    {d.value}
                  </div>
                </div>
                {copiedKey === d.label
                  ? <Check className="w-4 h-4 text-success shrink-0" />
                  : <Copy className="w-4 h-4 text-muted shrink-0" />}
              </button>
            ))}
            <div className="text-[11px] text-muted px-1 pt-1">
              Тапни на будь-який рядок щоб скопіювати в буфер обміну.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
