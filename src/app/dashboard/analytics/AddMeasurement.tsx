"use client";
import { useState, useTransition, useEffect } from "react";
import { createPortal } from "react-dom";
import { saveOwnMeasurement, updateOwnMeasurement, deleteOwnMeasurement } from "./actions";
import { Plus, X, Save, Loader2, Ruler, Pencil, Trash2, HelpCircle, ChevronDown } from "lucide-react";

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

              <MeasurementGuide />

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

// Collapsible "Як правильно мірятися" panel — text + diagram of every body region
function MeasurementGuide() {
  const [open, setOpen] = useState(false);
  const items = [
    { emoji: "💪", name: "Плечовий пояс", hint: "Обхват по найширшій точці плечей, через дельти. Стій рівно, руки вздовж тіла." },
    { emoji: "🫁", name: "Груди",         hint: "По найширшій частині грудної клітки. Стрічка горизонтально, видих без втягування." },
    { emoji: "📏", name: "Талія",         hint: "Найвужча частина живота (на 1-2 см вище пупка). Не втягуй живіт, видих." },
    { emoji: "🍑", name: "Сідниці",       hint: "По найширшій частині сідниць. Стопи разом, ноги рівно." },
    { emoji: "🦾", name: "Руки",          hint: "Біцепс у напруженому стані, в найтовстішій точці. Окремо ліва і права." },
    { emoji: "🦵", name: "Стегна",        hint: "Трохи вище середини стегна, по найтовстішій точці. Окремо ліве і праве." },
    { emoji: "🦿", name: "Гомілки",       hint: "По найширшій частині литки. Стопа на підлозі, нога розслаблена." },
  ];

  return (
    <div className="rounded-2xl border border-accent/25 bg-accent/5 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-accent/5 transition"
      >
        <div className="w-8 h-8 rounded-lg bg-accent/15 text-accent flex items-center justify-center shrink-0">
          <HelpCircle className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm">Як правильно мірятися</div>
          <div className="text-[11px] text-muted truncate">Натисни щоб подивитися інструкцію по кожній зоні</div>
        </div>
        <ChevronDown className={`w-4 h-4 text-muted shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      <div
        className="grid transition-all duration-300"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div className="px-4 pb-4 space-y-2.5">
            {/* Diagram — full-bleed image, falls back to emoji silhouette if file missing */}
            <div className="rounded-xl bg-surface border border-border overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/measurement-guide.jpg"
                alt="Як правильно знімати заміри — схема тіла"
                className="w-full h-auto block"
                loading="lazy"
                onError={(e) => {
                  // If the file isn't uploaded yet, hide the image gracefully
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                  const fb = (e.currentTarget.parentElement?.querySelector(".fb") as HTMLElement);
                  if (fb) fb.style.display = "block";
                }}
              />
              <div className="fb p-4 text-center" style={{ display: "none" }}>
                <div className="text-5xl leading-none">🧍‍♂️</div>
                <div className="text-[11px] text-muted mt-2">
                  Стрічку тримай горизонтально, без натягу. Не втягуй живіт. Краще робити вранці натщесерце.
                </div>
              </div>
            </div>
            {items.map(it => (
              <div key={it.name} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-surface border border-border">
                <span className="text-xl shrink-0 leading-none">{it.emoji}</span>
                <div className="min-w-0">
                  <div className="font-semibold text-xs">{it.name}</div>
                  <div className="text-[11px] text-muted mt-0.5 leading-relaxed">{it.hint}</div>
                </div>
              </div>
            ))}
            <div className="text-[10px] text-muted text-center pt-1">
              💡 Заміряй у тих самих умовах — однаковий час доби, однакова поза. Тоді динаміка буде точною.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  name, label, defaultValue,
}: {
  name: string; label: string; step?: string; defaultValue?: number | null;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      <input
        name={name}
        type="number"
        step="any" /* accept any decimal — server validates ≥ 0.1 */
        min="0"
        inputMode="decimal"
        className="input"
        defaultValue={defaultValue ?? ""}
        // Block typing of "-" character (browsers vary on min validation)
        onKeyDown={(e) => { if (e.key === "-" || e.key === "e" || e.key === "E") e.preventDefault(); }}
      />
    </div>
  );
}
