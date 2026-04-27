"use client";
import { useState, useTransition } from "react";
import { saveCheckIn } from "./actions";
import { Loader2, Check } from "lucide-react";

export function CheckInForm({ defaults }: { defaults: any | null }) {
  const [mood, setMood] = useState<number>(defaults?.mood ?? 4);
  const [energy, setEnergy] = useState<number>(defaults?.energy ?? 4);
  const [sleep, setSleep] = useState<number>(defaults?.sleep ?? 7);
  const [weight, setWeight] = useState<number | "">(defaults?.weight ?? "");
  const [water, setWater] = useState<number | "">(defaults?.water ?? "");
  const [steps, setSteps] = useState<number | "">(defaults?.steps ?? "");
  const [notes, setNotes] = useState<string>(defaults?.notes ?? "");
  const [saved, setSaved] = useState(false);
  const [pending, start] = useTransition();

  const moods = ["😞", "🙁", "😐", "🙂", "😄"];

  function submit() {
    const data = {
      mood, energy, sleep,
      weight: weight === "" ? null : Number(weight),
      water: water === "" ? null : Number(water),
      steps: steps === "" ? null : Number(steps),
      notes,
    };
    start(async () => {
      await saveCheckIn(data);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    });
  }

  return (
    <div className="mt-6 grid md:grid-cols-2 gap-5">
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
        <label className="label">Вага (кг)</label>
        <input className="input" type="number" step="0.1" value={weight}
          onChange={(e) => setWeight(e.target.value === "" ? "" : Number(e.target.value))} />
      </div>
      <div>
        <label className="label">Вода (літри)</label>
        <input className="input" type="number" step="0.1" value={water}
          onChange={(e) => setWater(e.target.value === "" ? "" : Number(e.target.value))} />
      </div>
      <div>
        <label className="label">Кроки</label>
        <input className="input" type="number" value={steps}
          onChange={(e) => setSteps(e.target.value === "" ? "" : Number(e.target.value))} />
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
  );
}
