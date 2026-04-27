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
  const safeMax = max > 0 ? max : 1;
  const pct = Math.max(0, Math.min(1, value / safeMax));
  const stroke = Math.max(8, Math.round(size * 0.1));
  const r = (size - stroke) / 2;
  const C = 2 * Math.PI * r;
  const dash = pct * C;
  const display = value >= 1000 ? `${(value/1000).toFixed(value % 1000 === 0 ? 0 : 1)}k` : String(Math.round(value));
  const maxDisplay = max >= 1000 ? `${(max/1000).toFixed(max % 1000 === 0 ? 0 : 1)}k` : String(max);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90 overflow-visible">
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke="rgb(var(--border))" strokeWidth={stroke}
        />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke={color} strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${C}`}
          style={{ transition: "stroke-dasharray .8s cubic-bezier(.2,.7,.2,1)", filter: `drop-shadow(0 0 6px ${color}66)` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <div className="text-base md:text-lg font-bold leading-none">
          {display}<span className="text-muted text-xs font-medium">/{maxDisplay}</span>
        </div>
        <div className="text-[9px] md:text-[10px] text-muted uppercase tracking-wider mt-1">{label}</div>
      </div>
    </div>
  );
}
