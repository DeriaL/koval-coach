"use client";
import { ResponsiveContainer, AreaChart, Area, LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, RadialBarChart, RadialBar } from "recharts";

export function TinyArea({ data, color = "#6366f1", height = 60 }: { data: any[]; color?: string; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={`tiny-${color}`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.5} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="v" stroke={color} strokeWidth={2} fill={`url(#tiny-${color})`} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function TrendChart({ data, color = "#6366f1", label = "val" }: { data: any[]; color?: string; label?: string }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={`grad-${label}`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.35} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="#24242c" vertical={false} />
        <XAxis dataKey="date" stroke="#6b6b78" fontSize={11} />
        <YAxis stroke="#6b6b78" fontSize={11} domain={["auto", "auto"]} />
        <Tooltip contentStyle={{ background: "#15151a", border: "1px solid #24242c", borderRadius: 12 }} />
        <Area type="monotone" dataKey="v" stroke={color} strokeWidth={2} fill={`url(#grad-${label})`} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function WeightWithAverage({ data }: { data: any[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid stroke="#24242c" vertical={false} />
        <XAxis dataKey="date" stroke="#6b6b78" fontSize={11} />
        <YAxis stroke="#6b6b78" fontSize={11} domain={["dataMin - 0.5", "dataMax + 0.5"]} />
        <Tooltip contentStyle={{ background: "#15151a", border: "1px solid #24242c", borderRadius: 12 }} />
        <Line type="monotone" dataKey="weight" stroke="#6b6b78" strokeWidth={1} dot={{ r: 2 }} name="вага" />
        <Line type="monotone" dataKey="avg" stroke="#6366f1" strokeWidth={3} dot={false} name="7д середнє" />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function BarsChart({ data, color = "#6366f1", dataKey = "v" }: { data: any[]; color?: string; dataKey?: string }) {
  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid stroke="#24242c" vertical={false} />
        <XAxis dataKey="date" stroke="#6b6b78" fontSize={11} />
        <YAxis stroke="#6b6b78" fontSize={11} />
        <Tooltip contentStyle={{ background: "#15151a", border: "1px solid #24242c", borderRadius: 12 }} />
        <Bar dataKey={dataKey} fill={color} radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function ProgressRing({ value, max, color, label, size = 120 }: { value: number; max: number; color: string; label: string; size?: number }) {
  const pct = Math.min(100, (value / max) * 100);
  const data = [{ name: label, v: pct, fill: color }];
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <ResponsiveContainer>
        <RadialBarChart innerRadius="72%" outerRadius="100%" data={data} startAngle={90} endAngle={-270}>
          <RadialBar background={{ fill: "#24242c" } as any} dataKey="v" cornerRadius={12} />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-lg font-bold">{Math.round(value)}<span className="text-muted text-xs">/{max}</span></div>
        <div className="text-[10px] text-muted uppercase tracking-wider">{label}</div>
      </div>
    </div>
  );
}
