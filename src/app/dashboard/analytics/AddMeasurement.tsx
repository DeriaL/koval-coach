"use client";
import { useState, useTransition, useEffect } from "react";
import { createPortal } from "react-dom";
import { saveOwnMeasurement, updateOwnMeasurement, deleteOwnMeasurement } from "./actions";
import { Plus, X, Save, Loader2, Ruler, Pencil, Trash2 } from "lucide-react";

type MeasurementInitial = {
  id: string;
  date: Date;
  weight: number | null;
  bodyFat: number | null;
  shoulders: number | null;
  chest: number | null;
  waist: number | null;
  hips: number | null;
  leftArm: number | null;
  rightArm: number | null;
  leftThigh: number | null;
  rightThigh: number | null;
  leftCalf: number | null;
  rightCalf: number | null;
  notes: string | null;
};

interface Props {
  initial?: MeasurementInitial;
  // Optional custom trigger render (for inline edit buttons)
  trigger?: React.ReactNode;
}

export function AddMeasurement({ initial, trigger }: Props) {
  const isEdit = !!initial;
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
  const dateValue = initial ? initial.date.toISOString().slice(0, 10) : today;
  // Restrict client date picker to current year
  const currentYear = new Date().getFullYear();
  const minDate = `${currentYear}-01-01`;
  const maxDate = today; // can't enter future dates either

  function submit(fd: FormData) {
    setErr(null);
    const data = Object.fromEntries(fd) as any;
    if (!data.date) { setErr("Вкажи дату"); return; }
    start(async () => {
      try {
        if (isEdit) {
          await updateOwnMeasurement(initial!.id, data);
        } else {
          await saveOwnMeasurement(data);
        }
        setOpen(false);
      } catch (e: any) { setErr(e?.message ?? "Помилка"); }
    });
  }

  function handleDelete() {
    if (!initial) return;
    if (!confirm("Видалити цей замір?")) return;
    start(async () => {
      try {
        await deleteOwnMeasurement(initial.id);
        setOpen(false);
      } catch (e: any) { setErr(e?.message ?? "Помилка"); }
    });
  }

  return (
    <>
      {trigger ? (
        <span onClick={() => setOpen(true)} className="contents">{trigger}</span>
      ) : (
        <button onClick={() => setOpen(true)} className="btn btn-primary text-sm">
          {isEdit ? <><Pencil className="w-4 h-4" /> Редагувати</> : <><Plus className="w-4 h-4" /> Додати замір</>}
        </button>
      )}

      {open && mounted && createPortal(
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-4 bg-black/70 backdrop-blur-sm animate-fade-in"
          onClick={() => setOpen(false)}>
          <div onClick={(e) => e.stopPropagation()}
            className="card w-full md:max-w-xl p-5 md:p-6 rounded-t-3xl md:rounded-3xl border-accent/30 animate-slide-in-up md:animate-pop max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl accent-shine flex items-center justify-center text-white"><Ruler className="w-4 h-4" /></div>
                {isEdit ? "Редагувати замір" : "Новий замір"}
              </h3>
              <button onClick={() => setOpen(false)} className="btn px-3 py-2"><X className="w-4 h-4" /></button>
            </div>

            <form action={submit} className="space-y-3">
              <div>
                <label className="label">Дата</label>
                <input
                  name="date"
                  type="date"
                  defaultValue={dateValue}
                  min={minDate}
                  max={maxDate}
                  className="input"
                  required
                />
                <div className="text-[10px] text-muted mt-1">тільки {currentYear} рік</div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <Field name="weight" label="Вага (кг)" step="0.1" defaultValue={initial?.weight} />
                <Field name="bodyFat" label="% жиру" step="0.1" defaultValue={initial?.bodyFat} />
                <Field name="shoulders" label="Плечовий пояс" step="0.5" defaultValue={initial?.shoulders} />
                <Field name="chest" label="Груди" step="0.5" defaultValue={initial?.chest} />
                <Field name="waist" label="Талія" step="0.5" defaultValue={initial?.waist} />
                <Field name="hips" label="Сідниці" step="0.5" defaultValue={initial?.hips} />
                <Field name="leftArm" label="Ліва рука" step="0.5" defaultValue={initial?.leftArm} />
                <Field name="rightArm" label="Права рука" step="0.5" defaultValue={initial?.rightArm} />
                <Field name="leftThigh" label="Ліве стегно" step="0.5" defaultValue={initial?.leftThigh} />
                <Field name="rightThigh" label="Праве стегно" step="0.5" defaultValue={initial?.rightThigh} />
                <Field name="leftCalf" label="Ліва гомілка" step="0.5" defaultValue={initial?.leftCalf} />
                <Field name="rightCalf" label="Права гомілка" step="0.5" defaultValue={initial?.rightCalf} />
              </div>
              <div className="text-[10px] text-muted -mt-1">всі обхвати — у см · мінімум 0.1, тільки додатні числа</div>

              <div>
                <label className="label">Нотатка</label>
                <input name="notes" className="input" placeholder="напр. ранкове зважування натщесерце" defaultValue={initial?.notes ?? ""} />
              </div>

              <div className="text-[11px] text-muted">Усі поля необов&apos;язкові — заповни лише ті, що міряв.</div>

              {err && <div className="text-danger text-xs">{err}</div>}

              <div className="flex gap-2 pt-2 flex-wrap">
                <button className="btn btn-primary flex-1" disabled={pending}>
                  {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> Зберегти</>}
                </button>
                <button type="button" onClick={() => setOpen(false)} className="btn">Скасувати</button>
                {isEdit && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={pending}
                    className="btn text-danger border-danger/30 hover:bg-danger/10"
                  >
                    <Trash2 className="w-4 h-4" /> Видалити
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

function Field({
  name, label, step, defaultValue,
}: {
  name: string; label: string; step?: string; defaultValue?: number | null;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      <input
        name={name}
        type="number"
        step={step}
        min="0.1"
        inputMode="decimal"
        className="input"
        defaultValue={defaultValue ?? ""}
        // Block typing of "-" character (browsers vary on min validation)
        onKeyDown={(e) => { if (e.key === "-" || e.key === "e" || e.key === "E") e.preventDefault(); }}
      />
    </div>
  );
}
