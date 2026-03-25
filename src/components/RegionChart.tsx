"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface RegionChartProps {
  data: Array<Record<string, string | number>>;
  bars: Array<{ key: string; color: string; name: string }>;
  xKey?: string;
  title?: string;
  yLabel?: string;
}

export default function RegionChart({
  data,
  bars,
  xKey = "region",
  title,
  yLabel = "$M",
}: RegionChartProps) {
  return (
    <div className="bg-slate-800 rounded-xl p-4">
      {title && <h3 className="text-sm font-medium text-slate-300 mb-3">{title}</h3>}
      <ResponsiveContainer width="100%" height={350}>
        <BarChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis
            dataKey={xKey}
            tick={{ fill: "#94a3b8", fontSize: 11 }}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} label={{ value: yLabel, angle: -90, position: "insideLeft", fill: "#94a3b8" }} />
          <Tooltip
            contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569", borderRadius: "8px" }}
            labelStyle={{ color: "#e2e8f0" }}
            itemStyle={{ color: "#cbd5e1" }}
          />
          <Legend wrapperStyle={{ paddingTop: "10px" }} />
          {bars.map((bar) => (
            <Bar key={bar.key} dataKey={bar.key} fill={bar.color} name={bar.name} radius={[2, 2, 0, 0]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
