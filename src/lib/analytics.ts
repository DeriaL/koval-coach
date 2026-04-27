// Pure computation helpers for analytics

export function movingAverage<T>(arr: T[], key: (t: T) => number | null | undefined, window = 7): number[] {
  const vals = arr.map(key);
  return vals.map((_, i) => {
    const slice = vals.slice(Math.max(0, i - window + 1), i + 1).filter((v): v is number => typeof v === "number");
    if (!slice.length) return NaN;
    return slice.reduce((s, v) => s + v, 0) / slice.length;
  });
}

export function linearRegression(points: { x: number; y: number }[]) {
  if (points.length < 2) return { slope: 0, intercept: points[0]?.y ?? 0 };
  const n = points.length;
  const sumX = points.reduce((s, p) => s + p.x, 0);
  const sumY = points.reduce((s, p) => s + p.y, 0);
  const sumXY = points.reduce((s, p) => s + p.x * p.y, 0);
  const sumXX = points.reduce((s, p) => s + p.x * p.x, 0);
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX || 1);
  const intercept = (sumY - slope * sumX) / n;
  return { slope, intercept };
}

export function bmi(weightKg?: number | null, heightCm?: number | null) {
  if (!weightKg || !heightCm) return null;
  const h = heightCm / 100;
  return weightKg / (h * h);
}

export function bmiCategory(b: number | null) {
  if (b == null) return { label: "—", color: "#6b6b78" };
  if (b < 18.5) return { label: "Недостатня", color: "#60a5fa" };
  if (b < 25) return { label: "Норма", color: "#34d399" };
  if (b < 30) return { label: "Надмірна", color: "#fbbf24" };
  return { label: "Ожиріння", color: "#ff4d6d" };
}

export function daysAgo(d: Date, today = new Date()) {
  return Math.floor((today.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
}

export function calcStreak(dates: Date[]): number {
  const set = new Set(dates.map((d) => new Date(d).toISOString().slice(0, 10)));
  let s = 0;
  const d = new Date();
  while (set.has(d.toISOString().slice(0, 10))) { s++; d.setDate(d.getDate() - 1); }
  return s;
}

export function buildHeatmap(dates: Date[], weeks = 13) {
  // returns a 2D grid weeks × 7 of counts
  const set = new Map<string, number>();
  dates.forEach((d) => {
    const k = new Date(d).toISOString().slice(0, 10);
    set.set(k, (set.get(k) ?? 0) + 1);
  });
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = weeks * 7;
  // align end of grid to today (grid ends on today's column)
  const grid: { date: string; count: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const k = d.toISOString().slice(0, 10);
    grid.push({ date: k, count: set.get(k) ?? 0 });
  }
  return grid;
}
