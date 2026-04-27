"use client";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, AreaChart, Area } from "recharts";

export function WeightChart({ data }: { data: { date: string; weight: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
        <defs>
          <linearGradient id="g1" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" stopOpacity={0.5} />
            <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="#24242c" vertical={false} />
        <XAxis dataKey="date" stroke="#6b6b78" fontSize={12} />
        <YAxis stroke="#6b6b78" fontSize={12} domain={["dataMin - 1", "dataMax + 1"]} />
        <Tooltip contentStyle={{ background: "#15151a", border: "1px solid #24242c", borderRadius: 12 }} />
        <Area type="monotone" dataKey="weight" stroke="#6366f1" strokeWidth={2} fill="url(#g1)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function MultiLineChart({ data, keys }: { data: any[]; keys: { key: string; color: string; name: string }[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
        <CartesianGrid stroke="#24242c" vertical={false} />
        <XAxis dataKey="date" stroke="#6b6b78" fontSize={12} />
        <YAxis stroke="#6b6b78" fontSize={12} />
        <Tooltip contentStyle={{ background: "#15151a", border: "1px solid #24242c", borderRadius: 12 }} />
        {keys.map((k) => (
          <Line key={k.key} type="monotone" dataKey={k.key} stroke={k.color} strokeWidth={2} dot={false} name={k.name} />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
