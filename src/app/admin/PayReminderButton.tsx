"use client";
import { useState, useTransition } from "react";
import { sendPaymentReminder } from "./clients/actions";
import { Bell, Loader2, Check, AlertCircle } from "lucide-react";

// Rendered inside the client-card <Link>, so it's a <span role=button> (not a
// <button>, which would be invalid nested-in-anchor) and stops propagation so
// clicking it doesn't navigate to the client page.
export function PayReminderButton({ clientId }: { clientId: string }) {
  const [pending, start] = useTransition();
  const [state, setState] = useState<"idle" | "sent" | "no-tg">("idle");

  function go(e: React.MouseEvent | React.KeyboardEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (pending) return;
    start(async () => {
      const res = await sendPaymentReminder(clientId);
      setState(res.ok ? (res.telegram ? "sent" : "no-tg") : "idle");
    });
  }

  return (
    <span
      role="button"
      tabIndex={0}
      onClick={go}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") go(e); }}
      className="chip text-[10px] py-0.5 px-2 border-accent2/50 text-accent2 hover:bg-accent2/20 active:scale-95 transition shrink-0 cursor-pointer"
      title="Надіслати нагадування про оплату"
    >
      {pending ? <Loader2 className="w-3 h-3 animate-spin" /> :
       state === "sent" ? <Check className="w-3 h-3" /> :
       state === "no-tg" ? <AlertCircle className="w-3 h-3" /> :
       <Bell className="w-3 h-3" />}
      {pending ? "…" :
       state === "sent" ? "Надіслано" :
       state === "no-tg" ? "Без Telegram" :
       "Нагадати"}
    </span>
  );
}
