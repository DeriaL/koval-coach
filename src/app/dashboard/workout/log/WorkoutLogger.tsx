"use client";
import { useState, useTransition, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { logManualWorkout, updateWorkoutSession } from "./actions";
import {
  Plus, Trash2, Save, Loader2, Play, Pause, Dumbbell,
  Check, X, ChevronDown, ChevronUp, Sparkles,
} from "lucide-react";

type SetRow = { weight: string; reps: string };
type Ex = { id: string; name: string; sets: SetRow[]; expanded: boolean };

function uid() {
  return Math.random().toString(36).slice(2, 8);
}

function emptyEx(): Ex {
  return { id: uid(), name: "", sets: [{ weight: "", reps: "" }], expanded: true };
}

type EditSession = {
  id: string;
  title: string;
  notes: string | null;
  durationSec: number | null;
  exercises: { name: string; sets: { weight: string; reps: string }[] }[];
};

export function WorkoutLogger({
  clientId,
  isTrainer,
  recentExercises,
  editSession,
}: {
  clientId?: string;            // when trainer creates for a client
  isTrainer: boolean;
  recentExercises: string[];    // for suggestions
  editSession?: EditSession;    // when editing an existing saved workout
}) {
  const router = useRouter();
  const isEdit = !!editSession;
  const [title, setTitle] = useState(editSession?.title ?? "");
  const [exercises, setExercises] = useState<Ex[]>(
    editSession && editSession.exercises.length
      ? editSession.exercises.map(e => ({ id: uid(), name: e.name, expanded: true, sets: e.sets.length ? e.sets : [{ weight: "", reps: "" }] }))
      : [emptyEx()]
  );
  const [notes, setNotes] = useState(editSession?.notes ?? "");

  // Workout timer (anchor-based, survives screen lock). Not used when editing —
  // the duration is already recorded.
  const [running, setRunning] = useState(!isEdit);
  const [elapsed, setElapsed] = useState(0);
  const startTsRef = useRef<number>(Date.now());
  const accumPausedRef = useRef<number>(0);
  const pauseStartRef = useRef<number | null>(null);

  const [err, setErr] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [pending, start] = useTransition();

  useEffect(() => {
    function recompute() {
      const pauseMs = (pauseStartRef.current ? Date.now() - pauseStartRef.current : 0) + accumPausedRef.current;
      const e = Math.max(0, Math.floor((Date.now() - startTsRef.current - pauseMs) / 1000));
      setElapsed(e);
    }
    const id = setInterval(recompute, 1000);
    document.addEventListener("visibilitychange", recompute);
    window.addEventListener("focus", recompute);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", recompute);
      window.removeEventListener("focus", recompute);
    };
  }, []);

  useEffect(() => {
    if (running) {
      if (pauseStartRef.current !== null) {
        accumPausedRef.current += Date.now() - pauseStartRef.current;
        pauseStartRef.current = null;
      }
    } else {
      if (pauseStartRef.current === null) pauseStartRef.current = Date.now();
    }
  }, [running]);

  function fmt(s: number) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  }

  function addExercise() {
    setExercises(p => [...p, emptyEx()]);
  }
  function delExercise(id: string) {
    setExercises(p => p.filter(e => e.id !== id));
  }
  function patchEx(id: string, patch: Partial<Ex>) {
    setExercises(p => p.map(e => e.id === id ? { ...e, ...patch } : e));
  }
  function addSet(exId: string) {
    setExercises(p => p.map(e => {
      if (e.id !== exId) return e;
      // copy last set's weight to streamline data entry
      const last = e.sets[e.sets.length - 1];
      return { ...e, sets: [...e.sets, { weight: last?.weight ?? "", reps: "" }] };
    }));
  }
  function delSet(exId: string, idx: number) {
    setExercises(p => p.map(e => e.id === exId ? { ...e, sets: e.sets.filter((_, i) => i !== idx) } : e));
  }
  function patchSet(exId: string, idx: number, patch: Partial<SetRow>) {
    setExercises(p => p.map(e => e.id === exId ? {
      ...e, sets: e.sets.map((s, i) => i === idx ? { ...s, ...patch } : s),
    } : e));
  }

  function submit() {
    setErr(null);
    if (!title.trim()) { setErr("Вкажи назву тренування"); return; }
    const cleanEx = exercises
      .map(e => ({
        name: e.name.trim(),
        sets: e.sets.filter(s => s.weight !== "" || s.reps !== ""),
      }))
      .filter(e => e.name.length > 0);
    if (cleanEx.length === 0) {
      setErr("Додай хоча б одну вправу з підходами");
      return;
    }
    start(async () => {
      try {
        const res = isEdit
          ? await updateWorkoutSession(editSession!.id, {
              title: title.trim(),
              notes: notes.trim(),
              exercises: cleanEx,
            })
          : await logManualWorkout({
              clientId,
              title: title.trim(),
              durationSec: elapsed,
              notes: notes.trim(),
              exercises: cleanEx,
            });
        if (res?.ok) {
          // Show success state so user gets clear feedback, then navigate.
          setSuccess(true);
          // Force the destination page to refetch fresh data
          router.refresh();
          setTimeout(() => {
            router.push(
              isTrainer && clientId
                ? `/admin/clients/${clientId}?tab=sessions`
                : "/dashboard/sessions"
            );
          }, 900);
        } else {
          setErr((res as any)?.error ?? "Не вдалось зберегти. Спробуй ще раз.");
        }
      } catch (e: any) {
        setErr(e?.message ?? "Не вдалось зберегти");
      }
    });
  }

  const totalSets = exercises.reduce((a, e) => a + e.sets.filter(s => s.weight || s.reps).length, 0);

  return (
    <div className="space-y-4">
      {/* Header card with title + timer */}
      <div className="card p-4 md:p-5 border-accent/30">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl accent-shine flex items-center justify-center text-white shrink-0">
            <Dumbbell className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-muted">Назва тренування</div>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Наприклад: «Спина + біцепс» або «Кардіо»"
              className="w-full bg-transparent border-0 outline-none font-bold text-lg p-0 mt-0.5 placeholder:text-muted/60"
              autoFocus
            />
          </div>
        </div>
        {!isEdit && (
          <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-surface border border-border">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-muted">Час тренування</div>
              <div className="text-2xl font-black font-mono mt-0.5">{fmt(elapsed)}</div>
            </div>
            <button
              type="button"
              onClick={() => setRunning(v => !v)}
              className="w-12 h-12 rounded-2xl accent-shine flex items-center justify-center text-white active:scale-90 transition"
              aria-label={running ? "Пауза" : "Старт"}
            >
              {running ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </button>
          </div>
        )}
      </div>

      {/* Exercises */}
      <div className="space-y-3">
        {exercises.map((ex, exIdx) => (
          <ExerciseBlock
            key={ex.id}
            ex={ex}
            num={exIdx + 1}
            suggestions={recentExercises}
            onPatch={(patch) => patchEx(ex.id, patch)}
            onDel={() => delExercise(ex.id)}
            onAddSet={() => addSet(ex.id)}
            onDelSet={(i) => delSet(ex.id, i)}
            onPatchSet={(i, patch) => patchSet(ex.id, i, patch)}
            canDelete={exercises.length > 1}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={addExercise}
        className="btn w-full justify-center border-dashed border-accent/40 text-accent gap-2"
      >
        <Plus className="w-4 h-4" /> Додати вправу
      </button>

      {/* Notes */}
      <div className="card p-4">
        <label className="label">Нотатка (необов&apos;язково)</label>
        <textarea
          className="textarea min-h-[80px]"
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Як себе почував, що було важко, прогрес…"
          rows={3}
        />
      </div>

      {err && (
        <div className="card p-3 border-danger/40 bg-danger/5 text-danger text-sm flex items-center gap-2">
          <X className="w-4 h-4 shrink-0" />
          <span>{err}</span>
        </div>
      )}

      {success && (
        <div className="card p-3 border-success/40 bg-success/10 text-success text-sm flex items-center gap-2">
          <Check className="w-4 h-4 shrink-0" />
          <span>✓ {isEdit ? "Зміни збережено" : "Тренування збережено"}! Перенаправляю…</span>
        </div>
      )}

      {/* Submit row — normal flow, NOT sticky (was overlapping the notes field) */}
      <div className="flex flex-col sm:flex-row gap-2 pt-2 pb-4">
        <button
          onClick={submit}
          disabled={pending || success || !title.trim()}
          className="btn btn-primary flex-1 py-3 gap-2 shadow-glow"
        >
          {pending ? <Loader2 className="w-4 h-4 animate-spin" /> :
           success ? <Check className="w-4 h-4" /> :
           <Save className="w-4 h-4" />}
          {pending ? "Зберігаю…" :
           success ? "Збережено!" :
           isEdit ? <>Оновити тренування{totalSets ? ` (${totalSets} підходів)` : ""}</> :
           <>Зберегти тренування{totalSets ? ` (${totalSets} підходів)` : ""}</>}
        </button>
        <button
          onClick={() => router.back()}
          disabled={pending || success}
          className="btn"
        >
          Скасувати
        </button>
      </div>
    </div>
  );
}

function ExerciseBlock({
  ex, num, suggestions, onPatch, onDel, onAddSet, onDelSet, onPatchSet, canDelete,
}: {
  ex: Ex;
  num: number;
  suggestions: string[];
  onPatch: (p: Partial<Ex>) => void;
  onDel: () => void;
  onAddSet: () => void;
  onDelSet: (i: number) => void;
  onPatchSet: (i: number, p: Partial<SetRow>) => void;
  canDelete: boolean;
}) {
  const [showSug, setShowSug] = useState(false);
  const filtered = ex.name.trim()
    ? suggestions.filter(s => s.toLowerCase().includes(ex.name.toLowerCase().trim())).slice(0, 5)
    : suggestions.slice(0, 5);

  return (
    <div className="card overflow-hidden">
      <div className="h-[3px] bg-gradient-to-r from-[rgb(var(--accent))] to-[rgb(var(--accent2))]" />
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-accent/15 text-accent font-bold text-sm flex items-center justify-center shrink-0">
            {num}
          </span>
          <div className="relative flex-1 min-w-0">
            <input
              value={ex.name}
              onChange={e => onPatch({ name: e.target.value })}
              onFocus={() => setShowSug(suggestions.length > 0)}
              onBlur={() => setTimeout(() => setShowSug(false), 150)}
              placeholder="Назва вправи (наприклад: «Жим лежачи»)"
              className="input"
            />
            {showSug && filtered.length > 0 && (
              <div className="absolute z-20 left-0 right-0 top-full mt-1 card border-accent/30 max-h-48 overflow-y-auto">
                {filtered.map(s => (
                  <button
                    key={s}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => { onPatch({ name: s }); setShowSug(false); }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-surface transition"
                  >
                    <Sparkles className="w-3 h-3 inline text-accent mr-1" />
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => onPatch({ expanded: !ex.expanded })}
            className="btn px-2 py-2 shrink-0"
            aria-label="Згорнути"
          >
            {ex.expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {canDelete && (
            <button
              type="button"
              onClick={onDel}
              className="btn px-2 py-2 text-danger shrink-0"
              aria-label="Видалити"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>

        {ex.expanded && (
          <>
            {/* Sets table */}
            <div className="space-y-2">
              <div className="grid grid-cols-[2rem_1fr_1fr_2rem] gap-2 text-[10px] uppercase tracking-wider text-muted px-1">
                <div>#</div>
                <div>Вага (кг)</div>
                <div>Повтори</div>
                <div></div>
              </div>
              {ex.sets.map((s, i) => (
                <div key={i} className="grid grid-cols-[2rem_1fr_1fr_2rem] gap-2 items-center">
                  <div className="w-7 h-7 rounded-lg bg-surface border border-border text-muted text-xs font-bold flex items-center justify-center">
                    {i + 1}
                  </div>
                  <input
                    inputMode="decimal"
                    type="number"
                    step="0.5"
                    value={s.weight}
                    onChange={e => onPatchSet(i, { weight: e.target.value })}
                    placeholder="—"
                    className="input text-center font-mono"
                  />
                  <input
                    inputMode="numeric"
                    type="number"
                    step="1"
                    value={s.reps}
                    onChange={e => onPatchSet(i, { reps: e.target.value })}
                    placeholder="—"
                    className="input text-center font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => onDelSet(i)}
                    disabled={ex.sets.length === 1}
                    className="w-7 h-7 rounded-lg border border-border text-muted hover:text-danger hover:border-danger/40 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition"
                    aria-label="Видалити підхід"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={onAddSet}
              className="btn w-full justify-center text-xs border-dashed gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> Додати підхід
            </button>
          </>
        )}
      </div>
    </div>
  );
}
