"use client";
import { useMemo, useState, useTransition } from "react";
import { saveNutrition, deleteNutrition } from "../../actions";
import {
  parsePlanContent, emptyPlan, sumMeals,
  type NutritionPlanData, type NutritionMeal,
} from "@/lib/nutritionPlan";
import {
  Pencil, Trash2, Plus, Save, X, Loader2, GripVertical, Calculator,
  Utensils, Replace, StickyNote, Flame,
} from "lucide-react";

type Plan = {
  id?: string;
  title?: string;
  content?: string | null;
  notes?: string | null;
  calories?: number | null;
  protein?: number | null;
  carbs?: number | null;
  fats?: number | null;
};

export function NutritionTab({ clientId, items }: { clientId: string; items: any[] }) {
  const [editing, setEditing] = useState<Plan | null>(null);
  const [pending, start] = useTransition();

  function del(id: string) {
    if (!confirm("Видалити план?")) return;
    start(async () => { await deleteNutrition(id, clientId); });
  }

  if (editing) {
    return (
      <PlanEditor
        clientId={clientId}
        plan={editing}
        onCancel={() => setEditing(null)}
        onSaved={() => setEditing(null)}
      />
    );
  }

  return (
    <div>
      <button onClick={() => setEditing({})} className="btn btn-primary mb-4">
        <Plus className="w-4 h-4" /> Новий план
      </button>

      <div className="space-y-3">
        {items.length === 0 && <div className="card p-6 text-muted text-center">Планів поки немає</div>}
        {items.map((p) => {
          const data = parsePlanContent(p.content);
          return (
            <div key={p.id} className="card p-5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="font-semibold break-words">{p.title}</div>
                  <div className="text-xs text-muted mt-1 break-words flex flex-wrap gap-x-3 gap-y-1">
                    {p.calories ? <span>🔥 {p.calories} ккал</span> : null}
                    {(p.protein || p.carbs || p.fats) ? <span>Б{p.protein ?? "—"} / Ж{p.fats ?? "—"} / В{p.carbs ?? "—"}</span> : null}
                    {data?.meals?.length ? <span>🍽 {data.meals.length} прийомів</span> : null}
                    {data?.waterL ? <span>💧 {data.waterL} л</span> : null}
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => setEditing(p)} className="btn text-sm"><Pencil className="w-3.5 h-3.5" /></button>
                  <button onClick={() => del(p.id)} className="btn text-sm text-danger"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─────────────────────────────── Editor ─────────────────────────────── */

function PlanEditor({
  clientId, plan, onCancel, onSaved,
}: {
  clientId: string;
  plan: Plan;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [pending, start] = useTransition();
  const initial = useMemo<NutritionPlanData>(() => parsePlanContent(plan.content) ?? emptyPlan(), [plan]);

  const [title, setTitle] = useState(plan.title ?? "План харчування");
  const [goal, setGoal] = useState(initial.goal ?? "");
  const [phase, setPhase] = useState(initial.phase ?? "");
  const [waterL, setWaterL] = useState<string>(initial.waterL ? String(initial.waterL) : "");
  const [stepsTarget, setStepsTarget] = useState<string>(initial.stepsTarget ? String(initial.stepsTarget) : "");
  const [calories, setCalories] = useState<string>(plan.calories ? String(plan.calories) : "");
  const [protein, setProtein] = useState<string>(plan.protein ? String(plan.protein) : "");
  const [fats, setFats] = useState<string>(plan.fats ? String(plan.fats) : "");
  const [carbs, setCarbs] = useState<string>(plan.carbs ? String(plan.carbs) : "");

  const [meals, setMeals] = useState<NutritionMeal[]>(
    initial.meals.length
      ? initial.meals
      : [{ name: "Сніданок", time: "08:00", items: [{ name: "", amount: "" }] }]
  );
  const [swaps, setSwaps] = useState(initial.swaps);
  const [notes, setNotes] = useState<string[]>(initial.notes);

  // ── helpers ──
  function updMeal(i: number, patch: Partial<NutritionMeal>) {
    setMeals((p) => p.map((m, idx) => (idx === i ? { ...m, ...patch } : m)));
  }
  function addMeal() {
    const n = meals.length + 1;
    setMeals((p) => [...p, { name: `Прийом ${n}`, time: "", items: [{ name: "", amount: "" }] }]);
  }
  function delMeal(i: number) { setMeals((p) => p.filter((_, idx) => idx !== i)); }

  function addItem(mi: number) { updMeal(mi, { items: [...meals[mi].items, { name: "", amount: "" }] }); }
  function delItem(mi: number, ii: number) {
    updMeal(mi, { items: meals[mi].items.filter((_, idx) => idx !== ii) });
  }
  function updItem(mi: number, ii: number, patch: Partial<{ name: string; amount: string }>) {
    updMeal(mi, { items: meals[mi].items.map((it, idx) => (idx === ii ? { ...it, ...patch } : it)) });
  }

  function recalcTotals() {
    const t = sumMeals(meals);
    setCalories(String(t.calories || ""));
    setProtein(String(t.protein || ""));
    setFats(String(t.fats || ""));
    setCarbs(String(t.carbs || ""));
  }

  function submit() {
    const data: NutritionPlanData = {
      goal: goal.trim() || undefined,
      phase: phase.trim() || undefined,
      waterL: waterL ? Number(waterL) : undefined,
      stepsTarget: stepsTarget ? Number(stepsTarget) : undefined,
      meals: meals.map((m) => ({
        name: m.name.trim(),
        time: m.time?.trim() || undefined,
        items: m.items.filter((it) => it.name.trim() || it.amount.trim()),
        protein: m.protein ? Number(m.protein) : undefined,
        fats: m.fats ? Number(m.fats) : undefined,
        carbs: m.carbs ? Number(m.carbs) : undefined,
        calories: m.calories ? Number(m.calories) : undefined,
      })),
      swaps: swaps.filter((s) => s.from.trim() || s.to.trim()),
      notes: notes.map((n) => n.trim()).filter(Boolean),
    };
    const content = JSON.stringify(data);
    start(async () => {
      await saveNutrition(clientId, {
        id: plan.id,
        title,
        content,
        notes: "", // legacy field — нотатки тепер у структурованому списку
        calories,
        protein,
        carbs,
        fats,
      });
      onSaved();
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-semibold text-lg">{plan.id ? "Редагувати план" : "Новий план харчування"}</h3>
        <button type="button" onClick={onCancel} className="btn"><X className="w-4 h-4" /> Скасувати</button>
      </div>

      {/* HEADER */}
      <div className="card p-5 space-y-3">
        <div>
          <label className="label">Назва плану</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="input" required />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div><label className="label">Ціль</label><input value={goal} onChange={(e) => setGoal(e.target.value)} className="input" placeholder="напр. Набір маси" /></div>
          <div><label className="label">Фаза</label><input value={phase} onChange={(e) => setPhase(e.target.value)} className="input" placeholder="напр. Дефіцит" /></div>
          <div><label className="label">Вода (л)</label><input value={waterL} onChange={(e) => setWaterL(e.target.value)} className="input" inputMode="decimal" placeholder="3.5" /></div>
          <div><label className="label">Кроки (ціль)</label><input value={stepsTarget} onChange={(e) => setStepsTarget(e.target.value)} className="input" inputMode="numeric" placeholder="10000" /></div>
        </div>
      </div>

      {/* TOTALS */}
      <div className="card p-5 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="text-sm font-semibold flex items-center gap-2"><Flame className="w-4 h-4 text-accent" /> Підсумок за день</div>
          <button type="button" onClick={recalcTotals} className="btn text-xs"><Calculator className="w-3.5 h-3.5" /> Пересумувати з прийомів</button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div><label className="label">Ккал</label><input value={calories} onChange={(e) => setCalories(e.target.value)} className="input" inputMode="numeric" /></div>
          <div><label className="label">Білки (г)</label><input value={protein} onChange={(e) => setProtein(e.target.value)} className="input" inputMode="numeric" /></div>
          <div><label className="label">Жири (г)</label><input value={fats} onChange={(e) => setFats(e.target.value)} className="input" inputMode="numeric" /></div>
          <div><label className="label">Вуглеводи (г)</label><input value={carbs} onChange={(e) => setCarbs(e.target.value)} className="input" inputMode="numeric" /></div>
        </div>
      </div>

      {/* MEALS */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold flex items-center gap-2"><Utensils className="w-4 h-4 text-accent" /> Прийоми їжі</div>
          <button type="button" onClick={addMeal} className="btn btn-primary text-sm"><Plus className="w-3.5 h-3.5" /> Прийом</button>
        </div>

        {meals.map((m, mi) => (
          <div key={mi} className="card p-4 space-y-3">
            <div className="flex items-center gap-2">
              <span className="h-7 w-7 rounded-lg accent-shine grid place-items-center text-white text-sm font-bold shrink-0">{mi + 1}</span>
              <input value={m.name} onChange={(e) => updMeal(mi, { name: e.target.value })} className="input flex-1" placeholder="Назва (напр. Сніданок)" />
              <input value={m.time ?? ""} onChange={(e) => updMeal(mi, { time: e.target.value })} className="input w-24" placeholder="08:00" />
              <button type="button" onClick={() => delMeal(mi)} className="btn text-danger shrink-0" title="Видалити прийом"><Trash2 className="w-4 h-4" /></button>
            </div>

            <div className="space-y-2">
              {m.items.map((it, ii) => (
                <div key={ii} className="flex items-center gap-2">
                  <GripVertical className="w-4 h-4 text-muted shrink-0 hidden sm:block" />
                  <input value={it.name} onChange={(e) => updItem(mi, ii, { name: e.target.value })} className="input flex-1" placeholder="Продукт" />
                  <input value={it.amount} onChange={(e) => updItem(mi, ii, { amount: e.target.value })} className="input w-24" placeholder="80 г" />
                  <button type="button" onClick={() => delItem(mi, ii)} className="btn shrink-0" title="Прибрати"><X className="w-4 h-4" /></button>
                </div>
              ))}
              <button type="button" onClick={() => addItem(mi)} className="btn text-sm w-full justify-center"><Plus className="w-3.5 h-3.5" /> Додати продукт</button>
            </div>

            <div className="grid grid-cols-4 gap-2 pt-1">
              <div><label className="label">Б</label><input value={m.protein ?? ""} onChange={(e) => updMeal(mi, { protein: e.target.value === "" ? undefined : Number(e.target.value) })} className="input" inputMode="numeric" /></div>
              <div><label className="label">Ж</label><input value={m.fats ?? ""} onChange={(e) => updMeal(mi, { fats: e.target.value === "" ? undefined : Number(e.target.value) })} className="input" inputMode="numeric" /></div>
              <div><label className="label">В</label><input value={m.carbs ?? ""} onChange={(e) => updMeal(mi, { carbs: e.target.value === "" ? undefined : Number(e.target.value) })} className="input" inputMode="numeric" /></div>
              <div><label className="label">Ккал</label><input value={m.calories ?? ""} onChange={(e) => updMeal(mi, { calories: e.target.value === "" ? undefined : Number(e.target.value) })} className="input" inputMode="numeric" /></div>
            </div>
          </div>
        ))}
      </div>

      {/* SWAPS */}
      <div className="card p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold flex items-center gap-2"><Replace className="w-4 h-4 text-accent" /> Заміни продуктів</div>
          <button type="button" onClick={() => setSwaps((p) => [...p, { from: "", to: "" }])} className="btn text-sm"><Plus className="w-3.5 h-3.5" /> Додати</button>
        </div>
        {swaps.length === 0 && <div className="text-xs text-muted">Поки порожньо</div>}
        {swaps.map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            <input value={s.from} onChange={(e) => setSwaps((p) => p.map((x, idx) => idx === i ? { ...x, from: e.target.value } : x))} className="input flex-1" placeholder="Можна замінити (напр. Рис 100 г)" />
            <span className="text-muted">→</span>
            <input value={s.to} onChange={(e) => setSwaps((p) => p.map((x, idx) => idx === i ? { ...x, to: e.target.value } : x))} className="input flex-1" placeholder="На (напр. Булгур 100 г)" />
            <button type="button" onClick={() => setSwaps((p) => p.filter((_, idx) => idx !== i))} className="btn shrink-0"><X className="w-4 h-4" /></button>
          </div>
        ))}
      </div>

      {/* NOTES */}
      <div className="card p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold flex items-center gap-2"><StickyNote className="w-4 h-4 text-accent" /> Нотатки тренера</div>
          <button type="button" onClick={() => setNotes((p) => [...p, ""])} className="btn text-sm"><Plus className="w-3.5 h-3.5" /> Пункт</button>
        </div>
        {notes.length === 0 && <div className="text-xs text-muted">Поки порожньо</div>}
        {notes.map((n, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
            <input value={n} onChange={(e) => setNotes((p) => p.map((x, idx) => idx === i ? e.target.value : x))} className="input flex-1" placeholder="Напр. Вага круп вказана у сухому вигляді." />
            <button type="button" onClick={() => setNotes((p) => p.filter((_, idx) => idx !== i))} className="btn shrink-0"><X className="w-4 h-4" /></button>
          </div>
        ))}
      </div>

      {/* SUBMIT */}
      <div className="sticky bottom-0 -mx-4 px-4 py-3 bg-bg/80 backdrop-blur border-t border-border flex gap-2 justify-end">
        <button type="button" onClick={onCancel} className="btn" disabled={pending}>Скасувати</button>
        <button type="button" onClick={submit} className="btn btn-primary" disabled={pending}>
          {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> Зберегти</>}
        </button>
      </div>
    </div>
  );
}
