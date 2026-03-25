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
  Cell,
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

  const xMin = Math.min(...xValues);
  const xMax = Math.max(...xValues);

  // Collect unique regions for legend
  const regions = Array.from(new Set(data.map((d) => d.region || "Other")));

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
        <ScatterChart margin={{ top: 10, right: 20, left: 10, bottom: 30 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis
            dataKey="x"
            type="number"
            name={xLabel}
            tick={{ fill: "#94a3b8", fontSize: 11 }}
            label={{ value: xLabel, position: "insideBottom", offset: -15, fill: "#94a3b8", fontSize: 12 }}
          />
          <YAxis
            dataKey="y"
            type="number"
            name={yLabel}
            tick={{ fill: "#94a3b8", fontSize: 11 }}
            label={{ value: yLabel, angle: -90, position: "insideLeft", fill: "#94a3b8", fontSize: 12 }}
          />
          <Tooltip
            content={({ payload }) => {
              if (!payload || payload.length === 0) return null;
              const d = payload[0]?.payload;
              if (!d) return null;
              return (
                <div className="bg-slate-900 border border-slate-600 rounded-lg p-2 text-xs">
                  <p className="text-white font-medium">{d.label}</p>
                  <p className="text-slate-400">{d.region}</p>
                  <p className="text-slate-400">{xLabel}: {d.x.toFixed(1)}</p>
                  <p className="text-slate-400">{yLabel}: {d.y.toFixed(1)}</p>
                </div>
              );
            }}
          />
          <Scatter data={data} isAnimationActive={false}>
            {data.map((entry, index) => (
              <Cell
                key={index}
                fill={REGION_COLORS[entry.region || "Other"] || "#94a3b8"}
                fillOpacity={0.8}
                r={5}
              />
            ))}
          </Scatter>
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
      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-3">
        {regions.slice(0, 10).map((region) => (
          <div key={region} className="flex items-center gap-1">
            <div
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: REGION_COLORS[region] || "#94a3b8" }}
            />
            <span className="text-[10px] text-slate-400">{region}</span>
          </div>
        ))}
        {regions.length > 10 && (
          <span className="text-[10px] text-slate-500">+{regions.length - 10} more</span>
        )}
      </div>
    </div>
  );
}
