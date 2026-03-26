"use client";

import { useMemo } from "react";
import { getRegion } from "@/data/postcodes";

interface MapDataPoint {
  postcode: string;
  value: number;
  label: string;
}

interface PostcodeMapProps {
  data: MapDataPoint[];
  colorScale?: "blue" | "green" | "red" | "diverging";
  title?: string;
  unit?: string;
}

function getColor(t: number, colorScale: string): string {
  if (colorScale === "blue") {
    return `rgb(${Math.round(30 + t * 190)},${Math.round(80 + t * 130)},${Math.round(180 + t * 75)})`;
  } else if (colorScale === "green") {
    return `rgb(${Math.round(20 + t * 30)},${Math.round(100 + t * 155)},${Math.round(60 + t * 60)})`;
  } else if (colorScale === "red") {
    return `rgb(${Math.round(140 + t * 115)},${Math.round(50 + t * 30)},${Math.round(40 + t * 20)})`;
  } else {
    if (t < 0.5) {
      const s = t * 2;
      return `rgb(${Math.round(220 - s * 120)},${Math.round(80 + s * 100)},${Math.round(80 + s * 100)})`;
    } else {
      const s = (t - 0.5) * 2;
      return `rgb(${Math.round(100 - s * 60)},${Math.round(180 - s * 50)},${Math.round(180 + s * 75)})`;
    }
  }
}

function formatValue(val: number, unit: string): string {
  if (unit === "$M") {
    if (Math.abs(val) >= 1000) return `$${(val / 1000).toFixed(1)}B`;
    return `$${val.toFixed(0)}M`;
  }
  if (unit === "recipients") {
    if (val >= 1e6) return `${(val / 1e6).toFixed(1)}M`;
    if (val >= 1e3) return `${(val / 1e3).toFixed(1)}K`;
    return val.toFixed(0);
  }
  // Default
  if (val >= 1e6) return `${(val / 1e6).toFixed(1)}M`;
  if (val >= 1e3) return `${(val / 1e3).toFixed(1)}K`;
  return val.toFixed(0);
}

export default function PostcodeMap({ data, colorScale = "blue", title, unit = "" }: PostcodeMapProps) {
  const { regionRows, minVal, maxVal } = useMemo(() => {
    const values = data.map((d) => d.value);
    const min = Math.min(...values);
    const max = Math.max(...values);

    const regionAgg = new Map<string, { total: number; count: number; postcodes: Array<{ postcode: string; value: number }> }>();

    for (const d of data) {
      const region = getRegion(d.postcode);
      const existing = regionAgg.get(region) || { total: 0, count: 0, postcodes: [] };
      existing.total += d.value;
      existing.count += 1;
      existing.postcodes.push({ postcode: d.postcode, value: d.value });
      regionAgg.set(region, existing);
    }

    const rows = Array.from(regionAgg.entries())
      .map(([region, agg]) => ({
        region,
        total: agg.total,
        avg: agg.total / agg.count,
        count: agg.count,
        topPostcodes: [...agg.postcodes].sort((a, b) => b.value - a.value).slice(0, 3),
      }))
      .sort((a, b) => b.total - a.total);

    return { regionRows: rows, minVal: min, maxVal: max };
  }, [data]);

  const range = maxVal - minVal || 1;

  return (
    <div className="bg-slate-800 rounded-xl p-4">
      {title && <h3 className="text-sm font-medium text-slate-300 mb-3">{title}</h3>}
      <div className="space-y-1.5 max-h-[460px] overflow-y-auto">
        {regionRows.map((row) => {
          const clampedT = Math.max(0, Math.min(1, (row.avg - minVal) / range));
          return (
            <div key={row.region}>
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-sm flex-shrink-0"
                  style={{ backgroundColor: getColor(clampedT, colorScale) }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-200 truncate">{row.region}</span>
                    <span className="text-xs font-mono text-slate-300 ml-2">
                      {formatValue(row.total, unit)}
                    </span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-1.5 mt-0.5">
                    <div
                      className="h-1.5 rounded-full transition-all"
                      style={{
                        width: `${Math.max(2, (row.total / regionRows[0].total) * 100)}%`,
                        backgroundColor: getColor(clampedT, colorScale),
                      }}
                    />
                  </div>
                </div>
              </div>
              <div className="ml-5 mt-0.5 flex gap-3">
                {row.topPostcodes.map((pc) => (
                  <span key={pc.postcode} className="text-[10px] text-slate-500">
                    {pc.postcode}: {formatValue(pc.value, unit)}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-4 flex items-center gap-2">
        <span className="text-[10px] text-slate-500">{formatValue(minVal, unit)}</span>
        <div
          className="flex-1 h-2 rounded-full"
          style={{
            background: `linear-gradient(to right, ${getColor(0, colorScale)}, ${getColor(0.5, colorScale)}, ${getColor(1, colorScale)})`,
          }}
        />
        <span className="text-[10px] text-slate-500">{formatValue(maxVal, unit)}</span>
      </div>
    </div>
  );
}
