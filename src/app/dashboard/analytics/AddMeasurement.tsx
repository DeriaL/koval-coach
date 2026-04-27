"use client";
import { useState, useTransition, useEffect } from "react";
import { createPortal } from "react-dom";
import { saveOwnMeasurement } from "./actions";
import { Plus, X, Save, Loader2, Ruler } from "lucide-react";

export function AddMeasurement() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = ""; window.removeEventListener("keydown", onKey); };
  }, [open]);

  const today = new Date().toISOString().slice(0, 10);

  function submit(fd: FormData) {
    setErr(null);
    const data = Object.fromEntries(fd) as any;
    if (!data.date) { setErr("Вкажи дату"); return; }
    start(async () => {
      try {
        await saveOwnMeasurement(data);
        setOpen(false);
      } catch (e: any) { setErr(e?.message ?? "Помилка"); }
    });
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn btn-primary text-sm">
        <Plus className="w-4 h-4" /> Додати замір
      </button>

      {open && mounted && createPortal(
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-4 bg-black/70 backdrop-blur-sm animate-fade-in"
          onClick={() => setOpen(false)}>
          <div onClick={(e) => e.stopPropagation()}
            className="card w-full md:max-w-xl p-5 md:p-6 rounded-t-3xl md:rounded-3xl border-accent/30 animate-slide-in-up md:animate-pop max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl accent-shine flex items-center justify-center text-white"><Ruler className="w-4 h-4" /></div>
                Новий замір
              </h3>
              <button onClick={() => setOpen(false)} className="btn px-3 py-2"><X className="w-4 h-4" /></button>
            </div>

            <form action={submit} className="space-y-3">
              <div>
                <label className="label">Дата</label>
                <input name="date" type="date" defaultValue={today} className="input" required />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <Field name="weight" label="Вага (кг)" step="0.1" />
                <Field name="bodyFat" label="% жиру" step="0.1" />
                <Field name="waist" label="Талія (см)" step="0.5" />
                <Field name="chest" label="Груди (см)" step="0.5" />
                <Field name="hips" label="Стегна (см)" step="0.5" />
                <Field name="arm" label="Біцепс (см)" step="0.5" />
                <Field name="leg" label="Стегно ноги (см)" step="0.5" />
              </div>

              <div>
                <label className="label">Нотатка</label>
                <input name="notes" className="input" placeholder="напр. ранкове зважування натщесерце" />
              </div>

              <div className="text-[11px] text-muted">Усі поля необов'язкові — заповни лише ті, що міряв сьогодні.</div>

              {err && <div className="text-danger text-xs">{err}</div>}

              <div className="flex gap-2 pt-2">
                <button className="btn btn-primary flex-1" disabled={pending}>
                  {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> Зберегти</>}
                </button>
                <button type="button" onClick={() => setOpen(false)} className="btn">Скасувати</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

function Field({ name, label, step }: { name: string; label: string; step?: string }) {
  return (
    <div>
      <label className="label">{label}</label>
      <input name={name} type="number" step={step} inputMode="decimal" className="input" />
    </div>
  );
}
