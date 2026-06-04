"use client";
import { useState, useTransition } from "react";
import Link from "next/link";
import { ChevronDown, Dumbbell, Trash2, Trophy, Clock, StickyNote, Loader2, Pencil } from "lucide-react";

type Set = {
  id: string;
  exerciseName: string;
  setIndex: number;
  weight: number | null;
  reps: number | null;
  isPR: boolean;
};

type Session = {
  id: string;
  title: string;
  date: Date | string;
  durationSec: number | null;
  notes: string | null;
  completed: boolean;
  confirmedByTrainer: boolean;
  sets: Set[];
};

function groupByExercise(sets: Set[]) {
  // setIndex is a session-wide running counter, so sorting by it first makes the
  // exercise order (first-encounter) and the within-exercise set order both
  // reflect the original logged sequence — regardless of how sets arrived.
  const sorted = [...sets].sort((a, b) => a.setIndex - b.setIndex);
  const map = new Map<string, Set[]>();
  for (const s of sorted) {
    const arr = map.get(s.exerciseName) ?? [];
    arr.push(s);
    map.set(s.exerciseName, arr);
  }
  return Array.from(map.entries());
}

export function WorkoutDetailRow({
  session,
  onDelete,
  editHref,
}: {
  session: Session;
  onDelete?: (id: string) => Promise<void> | void;
  editHref?: string;          // when set, shows an "edit" button linking there
}) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();

  const groups = groupByExercise(session.sets ?? []);
  const totalSets = session.sets?.length ?? 0;
  const subtitle =
    new Date(session.date).toLocaleString("uk-UA", { dateStyle: "short", timeStyle: "short", timeZone: "Europe/Kyiv" }) +
    (session.durationSec ? ` · ${Math.round(session.durationSec / 60)} хв` : "") +
    (session.confirmedByTrainer ? " · записано тренером" : session.completed ? " · самостійно" : "");

  function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
    if (!onDelete) return;
    if (!confirm("Видалити це тренування?")) return;
    start(async () => { await onDelete(session.id); });
  }

  return (
    <div className="card overflow-hidden transition-all">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full p-3 flex items-center gap-2 sm:gap-3 text-left hover:bg-surface/40 transition"
      >
        <div className="w-9 h-9 rounded-lg bg-success/10 text-success flex items-center justify-center shrink-0">
          <Dumbbell className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm truncate flex items-center gap-1.5">
            {session.title}
            {totalSets > 0 && (
              <span className="chip text-[9px] py-0 px-1.5 text-muted">
                {totalSets} підх.
              </span>
            )}
          </div>
          <div className="text-[11px] text-muted truncate">{subtitle}</div>
        </div>
        {editHref && (
          <Link
            href={editHref}
            onClick={(e) => e.stopPropagation()}
            className="w-8 h-8 rounded-lg border border-border text-muted hover:text-accent hover:border-accent/40 flex items-center justify-center shrink-0 transition"
            aria-label="Редагувати"
            title="Редагувати тренування"
          >
            <Pencil className="w-3.5 h-3.5" />
          </Link>
        )}
        {onDelete && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={pending}
            className="w-8 h-8 rounded-lg border border-border text-muted hover:text-danger hover:border-danger/40 flex items-center justify-center shrink-0 transition"
            aria-label="Видалити"
          >
            {pending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
          </button>
        )}
        <ChevronDown className={`w-4 h-4 text-muted shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      <div
        className="grid transition-all duration-300"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div className="px-3 pb-3 border-t border-border/60 pt-3 space-y-3">
            {/* Header info */}
            <div className="flex flex-wrap gap-2 text-[11px] text-muted">
              {session.durationSec ? (
                <span className="chip text-[10px] py-0 px-2 gap-1">
                  <Clock className="w-3 h-3" /> {Math.round(session.durationSec / 60)} хв
                </span>
              ) : null}
              <span className="chip text-[10px] py-0 px-2 gap-1">
                <Dumbbell className="w-3 h-3" /> {groups.length} вправ
              </span>
              <span className="chip text-[10px] py-0 px-2 gap-1">
                {totalSets} підходів
              </span>
            </div>

            {/* Exercises with sets */}
            {groups.length === 0 ? (
              <div className="text-xs text-muted text-center py-3 italic">
                Без деталей по підходах
              </div>
            ) : (
              <div className="space-y-2">
                {groups.map(([name, sets], i) => (
                  <div key={name} className="rounded-xl bg-surface border border-border overflow-hidden">
                    <div className="px-3 py-2 flex items-center gap-2 bg-surface/60">
                      <span className="w-6 h-6 rounded-md bg-accent/15 text-accent text-xs font-bold flex items-center justify-center shrink-0">
                        {i + 1}
                      </span>
                      <span className="text-sm font-semibold flex-1 min-w-0 truncate">{name}</span>
                      <span className="text-[10px] text-muted shrink-0">{sets.length} підх.</span>
                    </div>
                    <div className="px-3 py-2 space-y-1">
                      {sets.map((s, idx) => (
                        <div key={s.id} className="flex items-center gap-2 text-xs">
                          <span className="w-5 h-5 rounded bg-card border border-border text-muted text-[10px] font-bold flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <span className="font-mono">
                            {s.weight != null ? <b className="text-text">{s.weight} кг</b> : <span className="text-muted">— кг</span>}
                            <span className="text-muted mx-1.5">×</span>
                            {s.reps != null ? <b className="text-text">{s.reps}</b> : <span className="text-muted">—</span>}
                          </span>
                          {s.isPR && (
                            <span className="chip text-[9px] py-0 px-1.5 text-yellow-400 border-yellow-400/40 gap-0.5 ml-auto">
                              <Trophy className="w-2.5 h-2.5" /> PR
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Notes */}
            {session.notes && (
              <div className="rounded-xl bg-accent/5 border border-accent/20 p-3">
                <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-accent mb-1">
                  <StickyNote className="w-3 h-3" /> Нотатка
                </div>
                <div className="text-xs leading-relaxed whitespace-pre-wrap break-words">{session.notes}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
