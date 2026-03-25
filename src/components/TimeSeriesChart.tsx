"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface TimeSeriesChartProps {
  data: Array<Record<string, string | number>>;
  lines: Array<{ key: string; color: string; name: string; dashed?: boolean }>;
  xKey?: string;
  title?: string;
  yLabel?: string;
}

export default function TimeSeriesChart({
  data,
  lines,
  xKey = "year",
  title,
  yLabel = "$M",
}: TimeSeriesChartProps) {
  return (
    <div className="bg-slate-800 rounded-xl p-4">
      {title && <h3 className="text-sm font-medium text-slate-300 mb-3">{title}</h3>}
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey={xKey} tick={{ fill: "#94a3b8", fontSize: 12 }} />
          <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} label={{ value: yLabel, angle: -90, position: "insideLeft", fill: "#94a3b8" }} />
          <Tooltip
            contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569", borderRadius: "8px" }}
            labelStyle={{ color: "#e2e8f0" }}
            itemStyle={{ color: "#cbd5e1" }}
          />
          <Legend />
          {lines.map((line) => (
            <Line
              key={line.key}
              type="monotone"
              dataKey={line.key}
              stroke={line.color}
              name={line.name}
              strokeWidth={2}
              strokeDasharray={line.dashed ? "5 5" : undefined}
              dot={{ r: 3 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
