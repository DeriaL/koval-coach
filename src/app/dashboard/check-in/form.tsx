"use client";
import { useState, useTransition } from "react";
import { saveCheckIn } from "./actions";
import { useDraft, DraftBanner } from "@/lib/useDraft";
import { Loader2, Check } from "lucide-react";

export function CheckInForm({ defaults }: { defaults: any | null }) {
  // Autosaved draft only when there's no server-side check-in for today yet.
  const draft = useDraft<{
    mood: number; energy: number; stress: number; sleep: number;
    water: number | ""; steps: number | ""; notes: string;
  }>("checkin", {
    mood: defaults?.mood ?? 4,
    energy: defaults?.energy ?? 4,
    stress: defaults?.stress ?? 2,
    sleep: defaults?.sleep ?? 7,
    water: defaults?.water ?? "",
    steps: defaults?.steps ?? "",
    notes: defaults?.notes ?? "",
  });
  const { mood, energy, stress, sleep, water, steps, notes } = draft.value;
  const setMood = (v: number) => draft.setValue(p => ({ ...p, mood: v }));
  const setEnergy = (v: number) => draft.setValue(p => ({ ...p, energy: v }));
  const setStress = (v: number) => draft.setValue(p => ({ ...p, stress: v }));
  const setSleep = (v: number) => draft.setValue(p => ({ ...p, sleep: v }));
  const setWater = (v: number | "") => draft.setValue(p => ({ ...p, water: v }));
  const setSteps = (v: number | "") => draft.setValue(p => ({ ...p, steps: v }));
  const setNotes = (v: string) => draft.setValue(p => ({ ...p, notes: v }));
  const [saved, setSaved] = useState(false);
  const [pending, start] = useTransition();

  const moods = ["😞", "🙁", "😐", "🙂", "😄"];

  function submit() {
    const data = {
      mood, energy, stress, sleep,
      weight: null,
      water: water === "" ? null : Number(water),
      steps: steps === "" ? null : Number(steps),
      notes,
    };
    start(async () => {
      await saveCheckIn(data);
      draft.clear();
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    });
  }

  return (
    <div className="mt-6">
      {draft.restored && <div className="mb-4"><DraftBanner onDiscard={draft.discard} /></div>}
      <div className="grid md:grid-cols-2 gap-5">
      <div>
        <label className="label">Настрій</label>
        <div className="flex gap-2">
          {moods.map((m, i) => (
            <button key={i} type="button" onClick={() => setMood(i + 1)}
              className={`flex-1 text-2xl py-2 rounded-xl border transition ${mood === i + 1 ? "border-accent bg-accent/10" : "border-border bg-surface"}`}>
              {m}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="label">Енергія</label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <button key={i} type="button" onClick={() => setEnergy(i)}
              className={`flex-1 py-2 rounded-xl border text-sm font-bold transition ${energy >= i ? "border-accent bg-accent/10 text-accent" : "border-border bg-surface"}`}>
              {i}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="label">Сон (годин): {sleep.toFixed(1)}</label>
        <input type="range" min={3} max={12} step={0.5} value={sleep}
          onChange={(e) => setSleep(Number(e.target.value))}
          className="w-full accent-[#6366f1]" />
      </div>
      <div>
        <label className="label flex items-center justify-between">
          <span>Рівень стресу: <b className="text-text">{stress}</b> / 5</span>
          <span className="text-xs text-muted">{
            stress === 1 ? "🧘 спокій" :
            stress === 2 ? "🙂 норм" :
            stress === 3 ? "😐 середній" :
            stress === 4 ? "😟 напружений" :
                           "🥵 сильний"
          }</span>
        </label>
        <input
          type="range" min={1} max={5} step={1} value={stress}
          onChange={(e) => setStress(Number(e.target.value))}
          className="w-full accent-[#6366f1]"
          style={{
            background: `linear-gradient(to right,
              #10b981 0%, #facc15 50%, #ef4444 100%)`,
            height: 6, borderRadius: 999, appearance: "none", outline: "none",
          }}
        />
        <div className="flex justify-between text-[10px] text-muted mt-1">
          <span>1</span><span>2</span><span>3</span><span>4</span><span>5</span>
        </div>
      </div>
      <div>
        <label className="label">Вода (літри)</label>
        <input className="input" type="number" step="0.1" min={0} value={water}
          onChange={(e) => setWater(e.target.value === "" ? "" : Math.max(0, Number(e.target.value)))} />
      </div>
      <div>
        <label className="label">Кроки</label>
        <input className="input" type="number" min={0} value={steps}
          onChange={(e) => setSteps(e.target.value === "" ? "" : Math.max(0, Number(e.target.value)))} />
      </div>
      <div className="md:col-span-2">
        <label className="label">Нотатка (необовʼязково)</label>
        <textarea className="textarea" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>
      <div className="md:col-span-2">
        <button onClick={submit} disabled={pending} className="btn btn-primary px-6 py-3">
          {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <><Check className="w-4 h-4" /> Збережено</> : "Зберегти check-in"}
        </button>
      </div>
      </div>
    </div>
  );
}
