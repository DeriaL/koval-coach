"use client";
import { useState, useEffect, useTransition } from "react";
import { createPortal } from "react-dom";
import { X, AlertTriangle, Loader2 } from "lucide-react";

const CLIENT_REASONS = [
  "Захворів(ла)",
  "Зайнятий(а) на роботі",
  "Сімейні обставини",
  "Травма",
  "Перенесу на інший день",
];
const TRAINER_REASONS = [
  "Перенесу на інший день",
  "Хворію",
  "Форс-мажор",
  "Конфлікт у розкладі",
];

export function CancelModal({
  open, onClose, onConfirm, who = "CLIENT", title,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
  who?: "CLIENT" | "TRAINER";
  title?: string;
}) {
  const [mounted, setMounted] = useState(false);
  const [reason, setReason] = useState("");
  const [pending, start] = useTransition();
  const presets = who === "CLIENT" ? CLIENT_REASONS : TRAINER_REASONS;

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    setReason("");
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = ""; window.removeEventListener("keydown", onKey); };
  }, [open, onClose]);

  function submit() {
    start(async () => {
      await onConfirm(reason || "Без причини");
      onClose();
    });
  }

  if (!open || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-4 bg-black/70 backdrop-blur-sm animate-fade-in"
      onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()}
        className="card w-full md:max-w-md p-5 md:p-6 rounded-t-3xl md:rounded-3xl border-danger/30 animate-slide-in-up md:animate-pop max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-danger/15 text-danger flex items-center justify-center"><AlertTriangle className="w-4 h-4" /></div>
            Скасувати тренування
          </h3>
          <button onClick={onClose} className="btn px-3 py-2"><X className="w-4 h-4" /></button>
        </div>

        {title && <div className="text-sm text-muted mb-3">«{title}»</div>}

        <div>
          <label className="label">Оберіть причину</label>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {presets.map(p => (
              <button key={p} type="button" onClick={() => setReason(p)}
                className={`chip text-[11px] active:scale-95 ${reason === p ? "border-accent text-accent bg-accent/10" : "hover:border-accent/40"}`}>
                {p}
              </button>
            ))}
          </div>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Або напишіть свою причину..."
            rows={3}
            className="textarea"
          />
        </div>

        <div className="text-[11px] text-muted mt-2">
          {who === "CLIENT" ? "Я одразу отримаю сповіщення про скасування." : "Клієнт отримає сповіщення про скасування."}
        </div>

        <div className="flex gap-2 pt-4">
          <button onClick={submit} disabled={pending} className="btn btn-danger flex-1">
            {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Підтвердити скасування"}
          </button>
          <button onClick={onClose} className="btn">Назад</button>
        </div>
      </div>
    </div>,
    document.body
  );
}
