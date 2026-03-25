"use client";

import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { linearRegression } from "@/lib/analysis";

interface ScatterPlotProps {
  data: Array<{ x: number; y: number; label: string; region?: string }>;
  xLabel: string;
  yLabel: string;
  title?: string;
  showTrendLine?: boolean;
}

const REGION_COLORS: Record<string, string> = {
  "Inner Melbourne": "#60a5fa",
  "Inner East": "#a78bfa",
  "Inner North": "#34d399",
  "Inner South East": "#f472b6",
  "Western Melbourne": "#fb923c",
  "Northern Melbourne": "#fbbf24",
  "Eastern Melbourne": "#818cf8",
  "Outer East": "#2dd4bf",
  "South East Melbourne": "#f87171",
  "Bayside": "#c084fc",
  "Mornington Peninsula": "#4ade80",
  "Geelong": "#38bdf8",
  "Ballarat": "#fb7185",
  "Bendigo": "#a3e635",
  "Goulburn Valley": "#e879f9",
  "Gippsland": "#22d3ee",
  "East Gippsland": "#facc15",
  "North East": "#f97316",
  "Wimmera": "#94a3b8",
  "Sunraysia": "#d946ef",
};

export default function ScatterPlot({
  data,
  xLabel,
  yLabel,
  title,
  showTrendLine = true,
}: ScatterPlotProps) {
  const xValues = data.map((d) => d.x);
  const yValues = data.map((d) => d.y);
  const regression = linearRegression(xValues, yValues);

  // Group by region
  const grouped = new Map<string, typeof data>();
  for (const d of data) {
    const region = d.region || "Other";
    if (!grouped.has(region)) grouped.set(region, []);
    grouped.get(region)!.push(d);
  }

  const xMin = Math.min(...xValues);
  const xMax = Math.max(...xValues);

  return (
    <div className="bg-slate-800 rounded-xl p-4">
      {title && (
        <div className="mb-3">
          <h3 className="text-sm font-medium text-slate-300">{title}</h3>
          <p className="text-xs text-slate-500 mt-1">
            R² = {regression.rSquared.toFixed(3)} | Slope = {regression.slope.toFixed(3)}
          </p>
        </div>
      )}
      <ResponsiveContainer width="100%" height={400}>
        <ScatterChart margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis
            dataKey="x"
            type="number"
            name={xLabel}
            tick={{ fill: "#94a3b8", fontSize: 11 }}
            label={{ value: xLabel, position: "insideBottom", offset: -5, fill: "#94a3b8" }}
          />
          <YAxis
            dataKey="y"
            type="number"
            name={yLabel}
            tick={{ fill: "#94a3b8", fontSize: 11 }}
            label={{ value: yLabel, angle: -90, position: "insideLeft", fill: "#94a3b8" }}
          />
          <Tooltip
            content={({ payload }) => {
              if (!payload || payload.length === 0) return null;
              const d = payload[0].payload;
              return (
                <div className="bg-slate-900 border border-slate-600 rounded-lg p-2 text-xs">
                  <p className="text-white font-medium">{d.label}</p>
                  <p className="text-slate-400">{xLabel}: ${d.x.toFixed(1)}M</p>
                  <p className="text-slate-400">{yLabel}: ${d.y.toFixed(1)}M</p>
                </div>
              );
            }}
          />
          {Array.from(grouped.entries()).map(([region, points]) => (
            <Scatter
              key={region}
              name={region}
              data={points}
              fill={REGION_COLORS[region] || "#94a3b8"}
              opacity={0.8}
            />
          ))}
          {showTrendLine && (
            <ReferenceLine
              segment={[
                { x: xMin, y: regression.intercept + regression.slope * xMin },
                { x: xMax, y: regression.intercept + regression.slope * xMax },
              ]}
              stroke="#f59e0b"
              strokeWidth={2}
              strokeDasharray="6 4"
            />
          )}
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
