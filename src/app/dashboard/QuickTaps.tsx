"use client";
import { useTransition, useState } from "react";
import { quickAddWater, quickAddSteps } from "./check-in/actions";
import { Droplet, Footprints, Plus, Loader2 } from "lucide-react";

export function QuickTaps({ water, steps }: { water: number; steps: number }) {
  const [pending, start] = useTransition();
  const [bumpedW, setBumpedW] = useState(false);
  const [bumpedS, setBumpedS] = useState(false);

  function addWater(v: number) {
    setBumpedW(true);
    setTimeout(() => setBumpedW(false), 350);
    start(() => quickAddWater(v));
  }
  function addSteps(v: number) {
    setBumpedS(true);
    setTimeout(() => setBumpedS(false), 350);
    start(() => quickAddSteps(v));
  }

  return (
    <div className="grid grid-cols-2 gap-3 mt-4">
      <div className="card p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted">
            <span className="h-6 w-6 rounded-lg bg-sky-400/15 grid place-items-center text-sky-400">
              <Droplet className="w-3.5 h-3.5 fill-current" />
            </span>
            Вода
          </div>
          <div className={`text-lg font-bold transition-transform ${bumpedW ? "scale-125 text-accent" : ""}`}>
            {water.toFixed(1)} л
          </div>
        </div>
        <div className="grid grid-cols-3 gap-1.5 mt-3">
          {[0.25, 0.5, 1].map(v => (
            <button key={v} onClick={() => addWater(v)} disabled={pending}
              className="btn text-[11px] px-1 py-2 active:scale-90 whitespace-nowrap justify-center">
              +{v} л
            </button>
          ))}
        </div>
      </div>

      <div className="card p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted">
            <span className="h-6 w-6 rounded-lg bg-pink-400/15 grid place-items-center text-pink-400">
              <Footprints className="w-3.5 h-3.5" />
            </span>
            Кроки
          </div>
          <div className={`text-lg font-bold transition-transform ${bumpedS ? "scale-125 text-accent" : ""}`}>
            {steps.toLocaleString("uk-UA")}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-1.5 mt-3">
          {[1000, 2500, 5000].map(v => (
            <button key={v} onClick={() => addSteps(v)} disabled={pending}
              className="btn text-[11px] px-1 py-2 active:scale-90 whitespace-nowrap justify-center">
              +{(v/1000)}k
            </button>
          ))}
        </div>
        {pending && <Loader2 className="w-3 h-3 animate-spin text-muted mt-2 mx-auto" />}
      </div>
    </div>
  );
}
