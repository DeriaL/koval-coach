"use client";
import { useState, useEffect, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { finishWorkout } from "./actions";
import { Play, Pause, Check, X, ChevronDown, ChevronUp, Plus, Minus, Trophy, ExternalLink, Loader2, StickyNote, Sparkles, Wallet } from "lucide-react";
import { Confetti } from "@/components/Confetti";

type Ex = { id: string; name: string; targetSets: number; targetReps: string; restSec: number; videoUrl: string | null; notes: string | null };
type SetData = { weight: string; reps: string; completed: boolean };

type LastSet = { weight: number | null; reps: number | null };
export function WorkoutPlayer({ day, exercises, prevBest, lastSession }: { day: string; exercises: Ex[]; prevBest: Record<string, { weight: number; reps: number } | null>; lastSession: Record<string, LastSet[]> }) {
  const router = useRouter();
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(true);
  const [rest, setRest] = useState(0);
  const [restFor, setRestFor] = useState<number>(0);
  const [expanded, setExpanded] = useState<string | null>(exercises[0]?.id ?? null);
  const [sets, setSets] = useState<Record<string, SetData[]>>(() => {
    const s: Record<string, SetData[]> = {};
    exercises.forEach((e) => {
      s[e.id] = Array.from({ length: e.targetSets }, () => ({ weight: "", reps: "", completed: false }));
    });
    return s;
  });
  const [pending, start] = useTransition();
  const [celebrate, setCelebrate] = useState<null | { count: number; amount: number | null; prs: string[] }>(null);
  const intervalRef = useRef<any>(null);
  const restRef = useRef<any>(null);

  // Anchor timestamps so timers stay accurate when the browser throttles
  // setInterval (locked screen, background tab). We always compute time
  // from Date.now() instead of relying on tick counts.
  const startTsRef = useRef<number>(Date.now());        // wall-clock when workout started
  const accumPausedRef = useRef<number>(0);             // accumulated paused ms
  const pauseStartRef = useRef<number | null>(null);    // wall-clock when current pause began
  const restEndTsRef = useRef<number | null>(null);     // wall-clock when current rest ends

  // ── elapsed timer ──────────────────────────────────────────────────────────
  // Recompute from anchors every second AND every time the tab becomes visible.
  useEffect(() => {
    function recompute() {
      const pauseMs = (pauseStartRef.current ? Date.now() - pauseStartRef.current : 0) + accumPausedRef.current;
      const newElapsed = Math.max(0, Math.floor((Date.now() - startTsRef.current - pauseMs) / 1000));
      setElapsed(newElapsed);
    }

    // Always run a 1-second tick; even if the browser throttles it to 1/min in
    // the background, when it does fire we still resync to wall-clock time.
    intervalRef.current = setInterval(recompute, 1000);
    document.addEventListener("visibilitychange", recompute);
    window.addEventListener("focus", recompute);

    return () => {
      clearInterval(intervalRef.current);
      document.removeEventListener("visibilitychange", recompute);
      window.removeEventListener("focus", recompute);
    };
  }, []);

  // Handle pause / resume by stamping pauseStartRef
  useEffect(() => {
    if (running) {
      // resuming — add any accumulated pause duration
      if (pauseStartRef.current !== null) {
        accumPausedRef.current += Date.now() - pauseStartRef.current;
        pauseStartRef.current = null;
      }
    } else {
      // pausing
      if (pauseStartRef.current === null) pauseStartRef.current = Date.now();
    }
  }, [running]);

  // ── rest timer ─────────────────────────────────────────────────────────────
  // Uses absolute deadline so it stays correct when screen sleeps.
  useEffect(() => {
    function tick() {
      if (restEndTsRef.current === null) return;
      const remaining = Math.max(0, Math.ceil((restEndTsRef.current - Date.now()) / 1000));
      setRest(remaining);
      if (remaining === 0) {
        if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
        try { new Audio("data:audio/mp3;base64,").play().catch(() => {}); } catch {}
        restEndTsRef.current = null;
        if (restRef.current) { clearInterval(restRef.current); restRef.current = null; }
      }
    }
    if (rest > 0 && restEndTsRef.current !== null) {
      restRef.current = setInterval(tick, 250); // faster poll so unlock catches up quickly
      document.addEventListener("visibilitychange", tick);
      window.addEventListener("focus", tick);
      return () => {
        clearInterval(restRef.current);
        document.removeEventListener("visibilitychange", tick);
        window.removeEventListener("focus", tick);
      };
    }
  }, [rest > 0]); // eslint-disable-line react-hooks/exhaustive-deps

  function fmtTime(s: number) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  }

  function updateSet(exId: string, idx: number, patch: Partial<SetData>) {
    setSets((p) => ({ ...p, [exId]: p[exId].map((s, i) => (i === idx ? { ...s, ...patch } : s)) }));
  }

  function toggleSet(exId: string, idx: number) {
    const ex = exercises.find(e => e.id === exId)!;
    const cur = sets[exId][idx];
    const nowCompleted = !cur.completed;
    updateSet(exId, idx, { completed: nowCompleted });
    if (nowCompleted) {
      // anchor the rest deadline so it survives screen lock / tab background
      restEndTsRef.current = Date.now() + ex.restSec * 1000;
      setRest(ex.restSec);
      setRestFor(ex.restSec);
    }
  }

  function addSet(exId: string) {
    setSets((p) => ({ ...p, [exId]: [...p[exId], { weight: "", reps: "", completed: false }] }));
  }
  function removeSet(exId: string) {
    setSets((p) => ({ ...p, [exId]: p[exId].slice(0, -1) }));
  }

  const totalSets = Object.values(sets).reduce((a, arr) => a + arr.length, 0);
  const doneSets = Object.values(sets).reduce((a, arr) => a + arr.filter(s => s.completed).length, 0);
  const progress = totalSets ? Math.round((doneSets / totalSets) * 100) : 0;

  function finish() {
    if (!confirm(`Завершити тренування? Підходів: ${doneSets}/${totalSets}`)) return;
    const payload = {
      title: `Тренування: ${day}`,
      durationSec: elapsed,
      sets: Object.entries(sets).flatMap(([exId, arr]) => {
        const ex = exercises.find(e => e.id === exId)!;
        return arr.map((s, i) => ({
          exerciseName: ex.name,
          setIndex: i,
          weight: s.weight === "" ? null : Number(s.weight),
          reps: s.reps === "" ? null : Number(s.reps),
          completed: s.completed,
        }));
      }),
    };
    start(async () => {
      const res = await finishWorkout(payload);
      if (res.milestone || res.prs.length) {
        setCelebrate({ count: res.milestone?.count ?? 0, amount: res.milestone?.amount ?? null, prs: res.prs });
      } else {
        router.push("/dashboard/workout");
      }
    });
  }

  if (celebrate) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
        <Confetti duration={3500} count={180} />
        <div className="card p-6 md:p-8 max-w-md w-full text-center animate-pop border-accent/50 shadow-glow relative overflow-hidden">
          <div className="absolute inset-0 opacity-40 pointer-events-none bg-gradient-to-br from-accent/30 via-transparent to-accent2/30 animate-gradient-spin" />
          <div className="relative">
            <div className="w-20 h-20 mx-auto rounded-3xl accent-shine flex items-center justify-center text-white mb-4 animate-pop">
              {celebrate.count > 0 ? <Sparkles className="w-10 h-10" /> : <Trophy className="w-10 h-10" />}
            </div>
            {celebrate.count > 0 ? (
              <>
                <h2 className="text-2xl font-black text-gradient">🎉 {celebrate.count} тренувань!</h2>
                <p className="text-muted text-sm mt-2">
                  Круто! Ти пройшов черговий пакет із 10 тренувань.
                  {celebrate.amount ? ` Автоматично сформовано рахунок на ${celebrate.amount} ₴.` : " Я додам рахунок."}
                </p>
                <div className="mt-4 p-3 rounded-xl bg-accent/10 border border-accent/30 text-sm flex items-center gap-2 justify-center">
                  <Wallet className="w-4 h-4 text-accent" /> Перевір вкладку «Оплати»
                </div>
              </>
            ) : (
              <h2 className="text-2xl font-black text-gradient">🏆 Новий рекорд!</h2>
            )}
            {celebrate.prs.length > 0 && (
              <div className="mt-4 text-sm text-left">
                <div className="font-semibold mb-1">Особисті рекорди:</div>
                <ul className="space-y-1">
                  {celebrate.prs.map(p => (
                    <li key={p} className="flex items-center gap-2"><Trophy className="w-3.5 h-3.5 text-accent" /> {p}</li>
                  ))}
                </ul>
              </div>
            )}
            <button onClick={() => router.push("/dashboard/workout")} className="btn btn-primary w-full mt-6">
              Чудово, далі!
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-20">
      {/* sticky header */}
      <div className="sticky top-14 md:top-0 z-10 -mx-4 md:-mx-8 px-4 md:px-8 py-3 bg-bg/95 backdrop-blur border-b border-border">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="text-xs text-muted uppercase tracking-wider truncate">Тренування {day}</div>
            <div className="text-2xl font-black">{fmtTime(elapsed)}</div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={() => setRunning(r => !r)} className="btn px-3">
              {running ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
            <button onClick={finish} disabled={pending} className="btn btn-primary px-3 sm:px-4">
              {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Check className="w-4 h-4" /> <span className="hidden sm:inline">Завершити</span></>}
            </button>
          </div>
        </div>
        <div className="mt-3 h-1.5 rounded-full bg-surface overflow-hidden">
          <div className="h-full accent-shine transition-all" style={{ width: `${progress}%` }} />
        </div>
        <div className="mt-1 text-xs text-muted">{doneSets}/{totalSets} підходів · {progress}%</div>
      </div>

      {/* rest overlay */}
      {rest > 0 && (
        <div className="fixed inset-x-0 bottom-0 md:bottom-0 z-20 p-4 md:p-6 pointer-events-none">
          <div className="max-w-md mx-auto card p-5 border-accent/50 bg-card/95 backdrop-blur pointer-events-auto shadow-glow">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-muted uppercase">Відпочинок</div>
                <div className="text-3xl font-black text-accent">{fmtTime(rest)}</div>
              </div>
              <button onClick={() => { restEndTsRef.current = null; setRest(0); }} className="btn"><X className="w-4 h-4" /> Пропустити</button>
            </div>
            <div className="mt-3 h-1.5 rounded-full bg-surface overflow-hidden">
              <div className="h-full bg-accent transition-all" style={{ width: `${(rest / restFor) * 100}%` }} />
            </div>
          </div>
        </div>
      )}

      {/* exercises */}
      <div className="mt-4 space-y-3">
        {exercises.map((ex) => {
          const open = expanded === ex.id;
          const exSets = sets[ex.id];
          const doneCount = exSets.filter(s => s.completed).length;
          const best = prevBest[ex.name];
          return (
            <div key={ex.id} className="card overflow-hidden">
              <button
                type="button"
                onClick={() => setExpanded(open ? null : ex.id)}
                className="w-full p-4 flex items-center justify-between gap-3"
              >
                <div className="text-left min-w-0 flex-1">
                  <div className="font-semibold truncate">{ex.name}</div>
                  <div className="text-xs text-muted mt-0.5">
                    {ex.targetSets}×{ex.targetReps} · відпочинок {ex.restSec}с
                    {best && <span className="ml-2 text-accent">· PB {best.weight.toFixed(1)}×{best.reps}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`chip text-xs ${doneCount === exSets.length ? "text-success" : ""}`}>
                    {doneCount}/{exSets.length}
                  </span>
                  {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </button>

              {open && (
                <div className="px-4 pb-4 space-y-2">
                  {ex.videoUrl && (
                    <a href={ex.videoUrl} target="_blank" rel="noreferrer" className="text-xs text-accent hover:underline inline-flex items-center gap-1">
                      <ExternalLink className="w-3 h-3" /> Відео техніки
                    </a>
                  )}
                  {ex.notes && (
                    <div className="text-xs text-muted flex items-start gap-1.5">
                      <StickyNote className="w-3 h-3 mt-0.5 text-accent" /> {ex.notes}
                    </div>
                  )}

                  {lastSession[ex.name] && lastSession[ex.name].length > 0 && (
                    <div className="text-xs text-muted flex items-center gap-2 flex-wrap">
                      <span className="text-accent font-medium">Минулого разу:</span>
                      {lastSession[ex.name].map((ls, i) => (
                        <span key={i} className="chip text-[10px] py-0.5 px-2">
                          {ls.weight != null ? Number(ls.weight).toFixed(1) : "—"}×{ls.reps ?? "—"}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="grid grid-cols-[auto_1fr_1fr_auto] gap-2 items-center text-xs text-muted">
                    <div className="w-8">#</div>
                    <div>Вага (кг)</div>
                    <div>Повт.</div>
                    <div className="w-10"></div>
                  </div>
                  {exSets.map((s, i) => {
                    const ls = lastSession[ex.name]?.[i];
                    return (
                      <div key={i} className="grid grid-cols-[auto_1fr_1fr_auto] gap-2 items-center">
                        <div className="w-8 text-center text-sm font-bold text-muted">{i + 1}</div>
                        <input
                          className="input text-center"
                          type="number" step="0.5" inputMode="decimal"
                          placeholder={ls?.weight != null ? Number(ls.weight).toFixed(1) : best ? Number(best.weight).toFixed(1) : "-"}
                          value={s.weight}
                          onChange={(e) => updateSet(ex.id, i, { weight: e.target.value })}
                        />
                        <input
                          className="input text-center"
                          type="number" inputMode="numeric"
                          placeholder={ls?.reps != null ? String(ls.reps) : ex.targetReps}
                          value={s.reps}
                          onChange={(e) => updateSet(ex.id, i, { reps: e.target.value })}
                        />
                        <button
                          onClick={() => toggleSet(ex.id, i)}
                          className={`w-10 h-10 rounded-xl flex items-center justify-center transition active:scale-90 ${
                            s.completed ? "accent-shine text-white shadow-glow" : "bg-surface border border-border"
                          }`}
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                  <div className="flex gap-2 pt-1">
                    <button type="button" onClick={() => addSet(ex.id)} className="btn text-xs flex-1"><Plus className="w-3 h-3" /> Підхід</button>
                    {exSets.length > 1 && <button type="button" onClick={() => removeSet(ex.id)} className="btn text-xs"><Minus className="w-3 h-3" /></button>}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
