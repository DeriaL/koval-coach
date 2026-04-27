"use client";
import { useState, useTransition } from "react";
import { saveTraining, deleteTraining, saveExercise, deleteExercise } from "../../actions";
import { Pencil, Trash2, Plus, Save, X, Loader2, Dumbbell } from "lucide-react";

export function TrainingTab({ clientId, items }: { clientId: string; items: any[] }) {
  const [editing, setEditing] = useState<any | null>(null);
  const [exEditing, setExEditing] = useState<{ planId: string; ex: any } | null>(null);
  const [pending, start] = useTransition();

  function save(fd: FormData) {
    const data = Object.fromEntries(fd);
    start(async () => { await saveTraining(clientId, { ...data, id: editing?.id }); setEditing(null); });
  }
  function del(id: string) {
    if (!confirm("Видалити програму?")) return;
    start(async () => { await deleteTraining(id, clientId); });
  }
  function saveEx(fd: FormData) {
    const data = Object.fromEntries(fd);
    start(async () => {
      await saveExercise(clientId, { ...data, id: exEditing?.ex?.id, trainingPlanId: exEditing!.planId });
      setExEditing(null);
    });
  }
  function delEx(id: string) {
    if (!confirm("Видалити вправу?")) return;
    start(async () => { await deleteExercise(id, clientId); });
  }

  return (
    <div>
      {!editing && !exEditing && (
        <button onClick={() => setEditing({})} className="btn btn-primary mb-4"><Plus className="w-4 h-4" /> Нова програма</button>
      )}
      {editing && (
        <form action={save} className="card p-6 space-y-3 mb-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">{editing.id ? "Редагувати" : "Нова програма"}</h3>
            <button type="button" onClick={() => setEditing(null)} className="btn"><X className="w-4 h-4" /></button>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            <div><label className="label">Назва</label><input name="title" defaultValue={editing.title ?? ""} required className="input" /></div>
            <div><label className="label">Днів на тиждень</label><input name="daysPerWeek" type="number" defaultValue={editing.daysPerWeek ?? ""} className="input" /></div>
          </div>
          <div><label className="label">Опис програми</label><textarea name="content" rows={6} defaultValue={editing.content ?? ""} required className="textarea font-mono text-sm" /></div>
          <div><label className="label">Нотатка</label><textarea name="notes" rows={3} defaultValue={editing.notes ?? ""} className="textarea" /></div>
          <button className="btn btn-primary" disabled={pending}>
            {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> Зберегти</>}
          </button>
        </form>
      )}

      {exEditing && (
        <form action={saveEx} className="card p-6 space-y-3 mb-4 border-accent/30">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">{exEditing.ex?.id ? "Редагувати вправу" : "Нова вправа"}</h3>
            <button type="button" onClick={() => setExEditing(null)} className="btn"><X className="w-4 h-4" /></button>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            <div><label className="label">Назва</label><input name="name" defaultValue={exEditing.ex?.name ?? ""} required className="input" /></div>
            <div><label className="label">День</label>
              <select name="day" defaultValue={exEditing.ex?.day ?? "Пн"} className="select">
                {["Пн","Вт","Ср","Чт","Пт","Сб","Нд"].map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div><label className="label">Підходів</label><input name="targetSets" type="number" defaultValue={exEditing.ex?.targetSets ?? 3} className="input" /></div>
            <div><label className="label">Повторень</label><input name="targetReps" defaultValue={exEditing.ex?.targetReps ?? "10"} placeholder="8-10 / max" className="input" /></div>
            <div><label className="label">Відпочинок (сек)</label><input name="restSec" type="number" defaultValue={exEditing.ex?.restSec ?? 90} className="input" /></div>
            <div><label className="label">Порядок</label><input name="order" type="number" defaultValue={exEditing.ex?.order ?? 0} className="input" /></div>
            <div className="md:col-span-2"><label className="label">Відео (YouTube URL)</label><input name="videoUrl" defaultValue={exEditing.ex?.videoUrl ?? ""} className="input" /></div>
            <div className="md:col-span-2"><label className="label">Нотатка</label><input name="notes" defaultValue={exEditing.ex?.notes ?? ""} className="input" /></div>
          </div>
          <button className="btn btn-primary" disabled={pending}>
            {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> Зберегти</>}
          </button>
        </form>
      )}

      <div className="space-y-4">
        {items.length === 0 && <div className="card p-6 text-muted text-center">Програм ще немає</div>}
        {items.map(p => (
          <div key={p.id} className="card p-5">
            <div className="flex items-start justify-between">
              <div>
                <div className="font-semibold text-lg">{p.title}</div>
                <div className="text-xs text-muted mt-1">{p.daysPerWeek ?? "—"}× на тиждень · {p.exercises?.length ?? 0} вправ</div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setEditing(p)} className="btn text-sm"><Pencil className="w-3.5 h-3.5" /></button>
                <button onClick={() => del(p.id)} className="btn text-sm text-danger"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>

            <div className="mt-4">
              <div className="flex items-center justify-between">
                <div className="text-xs uppercase text-muted tracking-wider flex items-center gap-1.5"><Dumbbell className="w-3.5 h-3.5" /> Вправи</div>
                <button onClick={() => setExEditing({ planId: p.id, ex: {} })} className="btn text-xs"><Plus className="w-3 h-3" /> Додати</button>
              </div>
              {p.exercises && p.exercises.length > 0 ? (
                <div className="mt-3 grid sm:grid-cols-2 gap-2">
                  {p.exercises.map((ex: any) => (
                    <div key={ex.id} className="flex items-center justify-between p-3 rounded-xl bg-surface border border-border">
                      <div className="min-w-0">
                        <div className="font-medium text-sm truncate">{ex.name}</div>
                        <div className="text-xs text-muted">{ex.day} · {ex.targetSets}×{ex.targetReps} · {ex.restSec}с</div>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button onClick={() => setExEditing({ planId: p.id, ex })} className="btn text-xs"><Pencil className="w-3 h-3" /></button>
                        <button onClick={() => delEx(ex.id)} className="btn text-xs text-danger"><Trash2 className="w-3 h-3" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-3 text-muted text-sm">Вправ поки немає. Додай — і в клієнта зʼявиться режим «В залі» з таймерами.</div>
              )}
            </div>

            {p.content && (
              <details className="mt-3">
                <summary className="text-xs text-muted cursor-pointer">Опис у вільній формі</summary>
                <pre className="mt-2 text-sm whitespace-pre-wrap font-sans text-muted">{p.content}</pre>
              </details>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
