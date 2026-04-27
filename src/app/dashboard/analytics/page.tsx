import { requireClient } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PageHeader, EmptyState } from "@/components/ui";
import { TrendChart, WeightWithAverage, BarsChart } from "@/components/charts2";
import { MultiLineChart } from "@/components/Charts";
import { Heatmap } from "@/components/Heatmap";
import { movingAverage, linearRegression, bmi, bmiCategory, calcStreak, buildHeatmap } from "@/lib/analytics";
import { LineChart, Scale, TrendingDown, Target, Flame, Heart, Moon, Zap, Trophy, Calendar, Droplet, Activity, Dumbbell } from "lucide-react";

export default async function AnalyticsPage() {
  const u = await requireClient();
  const [user, measurements, checkIns, sessions, sessionSets] = await Promise.all([
    prisma.user.findUnique({ where: { id: u.id } }),
    prisma.measurement.findMany({ where: { clientId: u.id }, orderBy: { date: "asc" } }),
    prisma.checkIn.findMany({ where: { clientId: u.id }, orderBy: { date: "asc" } }),
    prisma.workoutSession.findMany({ where: { clientId: u.id, OR: [{ completed: true }, { confirmedByTrainer: true }] }, orderBy: { date: "asc" } }),
    prisma.sessionSet.findMany({
      where: { session: { clientId: u.id, completed: true }, completed: true, weight: { not: null }, reps: { not: null } },
      include: { session: { select: { date: true } } },
    }),
  ]);

  if (!user || (measurements.length === 0 && checkIns.length === 0))
    return (
      <div>
        <PageHeader title="Аналітика" />
        <EmptyState icon={LineChart} title="Ще мало даних" text="Зроби перший check-in або попроси тренера додати замір" />
      </div>
    );

  const fmt = (d: Date) => new Date(d).toLocaleDateString("uk-UA", { day: "2-digit", month: "short" });

  // ---- Weight ----
  const wSeries = checkIns.filter(c => c.weight).map(c => ({ d: c.date, v: c.weight! }));
  const wAvg = movingAverage(wSeries, (x) => x.v, 7);
  const wData = wSeries.map((p, i) => ({ date: fmt(p.d), weight: Number(p.v.toFixed(1)), avg: Number(wAvg[i].toFixed(2)) }));

  const latestWeight = wSeries.at(-1)?.v ?? measurements.at(-1)?.weight ?? null;
  const firstWeight = user.startWeight ?? wSeries[0]?.v ?? measurements[0]?.weight ?? null;
  const delta = latestWeight && firstWeight ? latestWeight - firstWeight : 0;

  // Goal projection: parse "схуднути X кг" roughly
  const goalMatch = user.goal?.match(/(-?\d+(?:[.,]\d+)?)\s*кг/);
  const goalKg = goalMatch ? Number(goalMatch[1].replace(",", ".")) : null;
  const targetWeight = firstWeight && goalKg ? firstWeight - goalKg : null;
  let daysToGoal: number | null = null;
  if (targetWeight && wSeries.length > 3) {
    const pts = wSeries.map((s, i) => ({ x: i, y: s.v }));
    const { slope, intercept } = linearRegression(pts);
    if (slope < 0 && latestWeight && latestWeight > targetWeight) {
      const idxTarget = (targetWeight - intercept) / slope;
      const currentIdx = wSeries.length - 1;
      const firstDay = wSeries[0].d.getTime();
      const lastDay = wSeries.at(-1)!.d.getTime();
      const daysPerPoint = (lastDay - firstDay) / (wSeries.length - 1) / 86400000 || 1;
      daysToGoal = Math.round((idxTarget - currentIdx) * daysPerPoint);
    }
  }

  // ---- Check-in streak / consistency ----
  const streak = calcStreak(checkIns.map(c => c.date));
  const last30 = checkIns.filter(c => (Date.now() - c.date.getTime()) < 30 * 86400000);
  const consistency = Math.round((last30.length / 30) * 100);

  // ---- Sleep / mood / energy trends ----
  const sleepData = checkIns.slice(-30).map(c => ({ date: fmt(c.date), v: Number(c.sleep?.toFixed(1) ?? 0) }));
  const moodData = checkIns.slice(-30).map(c => ({ date: fmt(c.date), v: c.mood ?? 0 }));
  const energyData = checkIns.slice(-30).map(c => ({ date: fmt(c.date), v: c.energy ?? 0 }));
  const waterData = checkIns.slice(-14).map(c => ({ date: fmt(c.date), v: Number(c.water?.toFixed(1) ?? 0) }));
  const stepsData = checkIns.slice(-14).map(c => ({ date: fmt(c.date), v: c.steps ?? 0 }));

  const avg = (arr: number[]) => arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : 0;
  const avgSleep = avg(last30.map(c => c.sleep ?? 0).filter(Boolean));
  const avgMood = avg(last30.map(c => c.mood ?? 0).filter(Boolean));
  const avgEnergy = avg(last30.map(c => c.energy ?? 0).filter(Boolean));
  const avgWater = avg(last30.map(c => c.water ?? 0).filter(Boolean));
  const avgSteps = avg(last30.map(c => c.steps ?? 0).filter(Boolean));

  // ---- BMI ----
  const b = bmi(latestWeight, user.height);
  const bCat = bmiCategory(b);

  // ---- Tonnage / Volume per week ----
  function startOfWeek(d: Date) { const x = new Date(d); const day = (x.getDay() + 6) % 7; x.setDate(x.getDate() - day); x.setHours(0,0,0,0); return x; }
  const weekMap = new Map<string, number>();
  for (const s of sessionSets) {
    const w = s.weight! * s.reps!;
    const key = startOfWeek(s.session.date).toISOString().slice(0,10);
    weekMap.set(key, (weekMap.get(key) ?? 0) + w);
  }
  const weeks: { date: string; v: number }[] = [];
  if (weekMap.size > 0) {
    const sortedKeys = Array.from(weekMap.keys()).sort();
    const first = new Date(sortedKeys[0]);
    const last = startOfWeek(new Date());
    for (let d = new Date(first); d <= last; d.setDate(d.getDate() + 7)) {
      const k = d.toISOString().slice(0,10);
      weeks.push({ date: new Date(k).toLocaleDateString("uk-UA", { day: "2-digit", month: "short" }), v: Math.round(weekMap.get(k) ?? 0) });
    }
  }
  const totalTonnage = Array.from(weekMap.values()).reduce((a,b)=>a+b,0);
  const last4w = weeks.slice(-4).reduce((a,w)=>a+w.v,0);
  const prev4w = weeks.slice(-8,-4).reduce((a,w)=>a+w.v,0);
  const tonnageDelta = prev4w > 0 ? Math.round(((last4w - prev4w) / prev4w) * 100) : null;

  // ---- Workouts ----
  const workoutDates = sessions.map(s => s.date);
  const workoutsLast30 = sessions.filter(s => (Date.now() - s.date.getTime()) < 30 * 86400000).length;
  const workoutHeatmap = buildHeatmap(workoutDates, 13);
  const checkInHeatmap = buildHeatmap(checkIns.map(c => c.date), 13);

  // ---- Insights (correlations) ----
  const goodSleepDays = checkIns.filter(c => (c.sleep ?? 0) >= 7);
  const goodSleepEnergy = avg(goodSleepDays.map(c => c.energy ?? 0).filter(Boolean));
  const badSleepDays = checkIns.filter(c => (c.sleep ?? 0) < 6);
  const badSleepEnergy = avg(badSleepDays.map(c => c.energy ?? 0).filter(Boolean));
  const sleepEnergyDiff = goodSleepEnergy - badSleepEnergy;

  // ---- Best / worst ----
  const lowestWeight = Math.min(...wSeries.map(s => s.v));
  const lowestDate = wSeries.find(s => s.v === lowestWeight)?.d;

  // ---- Measurements girth ----
  const gData = measurements.map(x => ({
    date: fmt(x.date), waist: x.waist, chest: x.chest, hips: x.hips, arm: x.arm, bodyFat: x.bodyFat,
  }));

  return (
    <div>
      <PageHeader title="Аналітика" subtitle="Твої цифри — твій шлях" />

      {/* Top KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <KPI icon={Scale} label="Поточна вага" value={latestWeight ? `${latestWeight.toFixed(1)} кг` : "—"} sub={firstWeight ? `старт: ${firstWeight.toFixed(1)}` : ""} />
        <KPI icon={TrendingDown} label="Зміна від старту" value={`${delta > 0 ? "+" : ""}${delta.toFixed(1)} кг`} accent={delta < 0 ? "success" : delta > 0 ? "danger" : undefined} />
        <KPI icon={Heart} label="BMI" value={b ? b.toFixed(1) : "—"} sub={bCat.label} customColor={bCat.color} />
        <KPI icon={Flame} label="Streak" value={`${streak} дн.`} sub={`${consistency}% днів`} />
      </div>

      {/* Goal progress */}
      {targetWeight && latestWeight && firstWeight && (
        <div className="card p-5 mt-4">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <div className="text-xs uppercase text-muted tracking-wider flex items-center gap-1.5"><Target className="w-3.5 h-3.5" /> Ціль</div>
              <div className="font-semibold mt-1">{user.goal}</div>
            </div>
            {daysToGoal !== null && daysToGoal > 0 && (
              <div className="text-right">
                <div className="text-xs text-muted">За поточним темпом</div>
                <div className="text-accent font-bold">~{daysToGoal} дн. до цілі</div>
              </div>
            )}
          </div>
          <div className="mt-4">
            <div className="flex justify-between text-xs text-muted mb-1">
              <span>{firstWeight.toFixed(1)} кг</span>
              <span>{targetWeight.toFixed(1)} кг</span>
            </div>
            <div className="h-3 rounded-full bg-surface border border-border overflow-hidden relative">
              <div
                className="h-full accent-shine transition-all"
                style={{
                  width: `${Math.max(0, Math.min(100, ((firstWeight - latestWeight) / (firstWeight - targetWeight)) * 100))}%`,
                }}
              />
            </div>
            <div className="mt-2 text-sm font-medium text-accent">
              Поточний: {latestWeight.toFixed(1)} кг · пройдено {Math.round(Math.max(0, Math.min(100, ((firstWeight - latestWeight) / (firstWeight - targetWeight)) * 100)))}%
            </div>
          </div>
        </div>
      )}

      {/* Weight chart with moving average */}
      {wData.length > 1 && (
        <div className="card p-5 mt-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">Вага + 7-денне середнє</h3>
            {lowestDate && (
              <span className="chip text-xs text-success">
                <Trophy className="w-3 h-3" /> мін. {lowestWeight.toFixed(1)} · {lowestDate.toLocaleDateString("uk-UA")}
              </span>
            )}
          </div>
          <WeightWithAverage data={wData} />
        </div>
      )}

      {/* Daily wellbeing */}
      <div className="grid md:grid-cols-3 gap-3 md:gap-4 mt-4">
        <MiniChart icon={Moon} label="Сон" avg={avgSleep.toFixed(1) + " г"} data={sleepData} color="#60a5fa" />
        <MiniChart icon={Heart} label="Настрій" avg={avgMood.toFixed(1) + "/5"} data={moodData} color="#f472b6" />
        <MiniChart icon={Zap} label="Енергія" avg={avgEnergy.toFixed(1) + "/5"} data={energyData} color="#fbbf24" />
      </div>

      {/* Tonnage / Volume */}
      {weeks.length > 1 && (
        <div className="card p-5 mt-4">
          <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
            <h3 className="font-semibold flex items-center gap-2"><Dumbbell className="w-4 h-4 text-accent" /> Тоннаж — об'єм навантаження</h3>
            <div className="flex items-center gap-2 text-xs">
              <span className="chip">Σ {Math.round(totalTonnage).toLocaleString("uk-UA")} кг</span>
              {tonnageDelta !== null && (
                <span className={`chip ${tonnageDelta >= 0 ? "text-success border-success/40" : "text-danger border-danger/40"}`}>
                  {tonnageDelta >= 0 ? "↑" : "↓"} {Math.abs(tonnageDelta)}% за 4 тижні
                </span>
              )}
            </div>
          </div>
          <BarsChart data={weeks} color="#6366f1" />
          <div className="text-xs text-muted mt-2">Сума всіх піднятих кілограмів (вага × повторення) по тижнях.</div>
        </div>
      )}

      {/* Water & steps */}
      <div className="grid md:grid-cols-2 gap-3 md:gap-4 mt-4">
        <div className="card p-5">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold flex items-center gap-2"><Droplet className="w-4 h-4 text-accent" /> Вода</h3>
            <span className="text-xs text-muted">~{avgWater.toFixed(1)} л/день</span>
          </div>
          <BarsChart data={waterData} color="#60a5fa" />
        </div>
        <div className="card p-5">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold flex items-center gap-2"><Activity className="w-4 h-4 text-accent" /> Кроки</h3>
            <span className="text-xs text-muted">~{Math.round(avgSteps).toLocaleString("uk-UA")}/день</span>
          </div>
          <BarsChart data={stepsData} color="#6366f1" />
        </div>
      </div>

      {/* Heatmaps */}
      <div className="grid md:grid-cols-2 gap-3 md:gap-4 mt-4">
        <div className="card p-5">
          <h3 className="font-semibold mb-3 flex items-center gap-2"><Calendar className="w-4 h-4 text-accent" /> Check-in консистентність (13 тижнів)</h3>
          <Heatmap data={checkInHeatmap} color="#6366f1" />
          <div className="text-xs text-muted mt-3">{last30.length}/30 днів за останній місяць</div>
        </div>
        <div className="card p-5">
          <h3 className="font-semibold mb-3 flex items-center gap-2"><Calendar className="w-4 h-4 text-accent2" /> Тренування (13 тижнів)</h3>
          <Heatmap data={workoutHeatmap} color="#3b82f6" />
          <div className="text-xs text-muted mt-3">{workoutsLast30} за останні 30 днів</div>
        </div>
      </div>

      {/* Insights */}
      {Math.abs(sleepEnergyDiff) > 0.3 && goodSleepDays.length > 3 && badSleepDays.length > 3 && (
        <div className="card p-5 mt-4 border-accent/30 bg-accent/5">
          <div className="text-xs uppercase text-accent tracking-wider">💡 Інсайт</div>
          <div className="mt-2 text-sm">
            У дні зі сном <b>7+ годин</b> твоя енергія {sleepEnergyDiff > 0 ? "вища" : "нижча"} на <b>{Math.abs(sleepEnergyDiff).toFixed(1)} бала</b> порівняно з ночами менше 6 годин. Спи більше.
          </div>
        </div>
      )}

      {/* Measurements table + chart */}
      {measurements.length > 0 && (
        <>
          <div className="card p-5 mt-4">
            <h3 className="font-semibold mb-3">Заміри (см) та %жиру</h3>
            <MultiLineChart
              data={gData}
              keys={[
                { key: "waist", color: "#6366f1", name: "Талія" },
                { key: "chest", color: "#3b82f6", name: "Груди" },
                { key: "hips", color: "#60a5fa", name: "Стегна" },
                { key: "arm", color: "#f472b6", name: "Біцепс" },
                { key: "bodyFat", color: "#fbbf24", name: "% жиру" },
              ]}
            />
          </div>
          <div className="card p-5 mt-4 overflow-x-auto">
            <h3 className="font-semibold mb-3">Історія замірів</h3>
            <table className="w-full text-sm min-w-[500px]">
              <thead>
                <tr className="text-muted text-xs uppercase tracking-wider">
                  <th className="text-left py-2">Дата</th>
                  <th className="text-right py-2">Вага</th>
                  <th className="text-right py-2">Талія</th>
                  <th className="text-right py-2">Груди</th>
                  <th className="text-right py-2">Стегна</th>
                  <th className="text-right py-2">Біцепс</th>
                  <th className="text-right py-2">%жиру</th>
                </tr>
              </thead>
              <tbody>
                {measurements.slice().reverse().map((x) => (
                  <tr key={x.id} className="border-t border-border">
                    <td className="py-2">{x.date.toLocaleDateString("uk-UA")}</td>
                    <td className="text-right">{x.weight?.toFixed(1) ?? "—"}</td>
                    <td className="text-right">{x.waist ?? "—"}</td>
                    <td className="text-right">{x.chest ?? "—"}</td>
                    <td className="text-right">{x.hips ?? "—"}</td>
                    <td className="text-right">{x.arm ?? "—"}</td>
                    <td className="text-right">{x.bodyFat?.toFixed(1) ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

function KPI({ icon: Icon, label, value, sub, accent, customColor }: any) {
  const color = accent === "success" ? "text-success" : accent === "danger" ? "text-danger" : "text-text";
  return (
    <div className="card p-4">
      <div className="flex items-center gap-2 text-muted text-xs uppercase tracking-wider"><Icon className="w-3.5 h-3.5" /> {label}</div>
      <div className={`text-xl md:text-2xl font-bold mt-1 ${color}`} style={customColor ? { color: customColor } : {}}>{value}</div>
      {sub && <div className="text-xs text-muted mt-0.5">{sub}</div>}
    </div>
  );
}

function MiniChart({ icon: Icon, label, avg, data, color }: any) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-muted text-xs uppercase tracking-wider">
          <Icon className="w-3.5 h-3.5" /> {label}
        </div>
        <div className="text-sm font-bold">{avg}</div>
      </div>
      <div className="mt-3">
        <TrendChart data={data} color={color} label={label} />
      </div>
    </div>
  );
}
