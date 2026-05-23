// Structured nutrition-plan data stored as JSON inside NutritionPlan.content.
// Old plans whose content is plain text still render via a text fallback.

export type NutritionItem = { name: string; amount: string };

export type NutritionMeal = {
  name: string;           // "Сніданок"
  time?: string;          // "08:00"
  items: NutritionItem[]; // [{name:"Вівсянка", amount:"80 г"}, ...]
  protein?: number;
  fats?: number;
  carbs?: number;
  calories?: number;
};

export type NutritionSwap = { from: string; to: string };

export type NutritionPlanData = {
  goal?: string;          // "Lean Bulk" / "Схуднення"
  phase?: string;         // "Mass Gain" / "Дефіцит"
  waterL?: number;        // 3.5
  meals: NutritionMeal[];
  swaps: NutritionSwap[];
  notes: string[];        // bullet list — тренерські нотатки
};

function numOrUndef(v: any): number | undefined {
  if (v === "" || v === null || v === undefined) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

export function parsePlanContent(content: string | null | undefined): NutritionPlanData | null {
  if (!content) return null;
  const trimmed = content.trim();
  if (!trimmed.startsWith("{")) return null;
  try {
    const v = JSON.parse(trimmed);
    if (!v || typeof v !== "object" || !Array.isArray(v.meals)) return null;
    return {
      goal: typeof v.goal === "string" && v.goal.trim() ? v.goal : undefined,
      phase: typeof v.phase === "string" && v.phase.trim() ? v.phase : undefined,
      waterL: numOrUndef(v.waterL),
      meals: v.meals.map((m: any) => ({
        name: typeof m?.name === "string" ? m.name : "",
        time: typeof m?.time === "string" && m.time.trim() ? m.time : undefined,
        items: Array.isArray(m?.items)
          ? m.items.map((i: any) => ({
              name: typeof i?.name === "string" ? i.name : "",
              amount: typeof i?.amount === "string" ? i.amount : "",
            }))
          : [],
        protein: numOrUndef(m?.protein),
        fats: numOrUndef(m?.fats),
        carbs: numOrUndef(m?.carbs),
        calories: numOrUndef(m?.calories),
      })),
      swaps: Array.isArray(v.swaps)
        ? v.swaps.map((s: any) => ({
            from: typeof s?.from === "string" ? s.from : "",
            to: typeof s?.to === "string" ? s.to : "",
          })).filter((s: NutritionSwap) => s.from.trim() || s.to.trim())
        : [],
      notes: Array.isArray(v.notes)
        ? v.notes.filter((x: any) => typeof x === "string" && x.trim())
        : [],
    };
  } catch {
    return null;
  }
}

export function emptyPlan(): NutritionPlanData {
  return { meals: [], swaps: [], notes: [] };
}

export function sumMeals(meals: NutritionMeal[]) {
  return meals.reduce(
    (a, m) => ({
      protein: a.protein + (m.protein ?? 0),
      fats: a.fats + (m.fats ?? 0),
      carbs: a.carbs + (m.carbs ?? 0),
      calories: a.calories + (m.calories ?? 0),
    }),
    { protein: 0, fats: 0, carbs: 0, calories: 0 }
  );
}
