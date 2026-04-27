"use client";

export function Heatmap({ data, color = "#6366f1" }: { data: { date: string; count: number }[]; color?: string }) {
  // group into 7-row columns (weekday rows, columns = weeks)
  const cols: { date: string; count: number }[][] = [];
  let cur: any[] = [];
  // start: first day of data — align by weekday (Mon=0)
  const firstDate = new Date(data[0].date);
  const firstDow = (firstDate.getDay() + 6) % 7; // Mon=0..Sun=6
  for (let i = 0; i < firstDow; i++) cur.push(null);
  data.forEach((d) => {
    cur.push(d);
    if (cur.length === 7) { cols.push(cur); cur = []; }
  });
  if (cur.length) { while (cur.length < 7) cur.push(null); cols.push(cur); }

  const maxCount = Math.max(1, ...data.map((d) => d.count));
  function intensity(c: number) {
    if (c === 0) return "#1a1a20";
    const t = 0.25 + 0.75 * (c / maxCount);
    return `color-mix(in srgb, ${color} ${Math.round(t * 100)}%, #0a0a0b)`;
  }

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-[3px]">
        {cols.map((col, i) => (
          <div key={i} className="flex flex-col gap-[3px]">
            {col.map((d, j) => (
              <div
                key={j}
                title={d ? `${d.date}: ${d.count}` : ""}
                className="w-3 h-3 rounded-[3px]"
                style={{ background: d ? intensity(d.count) : "transparent" }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
