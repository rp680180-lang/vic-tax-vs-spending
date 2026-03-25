"use client";

import { useState, useMemo } from "react";
import { VICTORIAN_POSTCODES } from "@/data/postcodes";
import { FEDERAL_SPENDING_DATA } from "@/data/federal-spending";
import StatCard from "@/components/StatCard";
import TimeSeriesChart from "@/components/TimeSeriesChart";
import RegionChart from "@/components/RegionChart";
import PostcodeMap from "@/components/PostcodeMap";
import YearSlider from "@/components/YearSlider";

export default function FederalPage() {
  const [year, setYear] = useState(2023);

  const yearData = useMemo(
    () => FEDERAL_SPENDING_DATA.filter((d) => d.year === year),
    [year]
  );

  const totals = useMemo(() => {
    const t = { medicare: 0, welfare: 0, education: 0, infrastructure: 0, other: 0, total: 0 };
    for (const d of yearData) {
      t.medicare += d.medicare;
      t.welfare += d.welfare;
      t.education += d.education;
      t.infrastructure += d.infrastructure;
      t.other += d.other;
      t.total += d.total;
    }
    return t;
  }, [yearData]);

  // By region stacked
  const regionData = useMemo(() => {
    const regions = new Map<string, { medicare: number; welfare: number; education: number; infrastructure: number }>();
    for (const d of yearData) {
      const pc = VICTORIAN_POSTCODES.find((p) => p.postcode === d.postcode);
      if (!pc) continue;
      const r = regions.get(pc.region) || { medicare: 0, welfare: 0, education: 0, infrastructure: 0 };
      r.medicare += d.medicare;
      r.welfare += d.welfare;
      r.education += d.education;
      r.infrastructure += d.infrastructure;
      regions.set(pc.region, r);
    }
    return Array.from(regions.entries())
      .map(([region, v]) => ({
        region,
        Medicare: Math.round(v.medicare),
        Welfare: Math.round(v.welfare),
        Education: Math.round(v.education),
        Infrastructure: Math.round(v.infrastructure),
      }))
      .sort((a, b) => (b.Medicare + b.Welfare + b.Education + b.Infrastructure) - (a.Medicare + a.Welfare + a.Education + a.Infrastructure));
  }, [yearData]);

  // Time series by category
  const timeSeries = useMemo(() => {
    const years = Array.from({ length: 10 }, (_, i) => 2014 + i);
    return years.map((y) => {
      const yd = FEDERAL_SPENDING_DATA.filter((d) => d.year === y);
      return {
        year: y.toString(),
        Medicare: Math.round(yd.reduce((s, d) => s + d.medicare, 0)),
        Welfare: Math.round(yd.reduce((s, d) => s + d.welfare, 0)),
        Education: Math.round(yd.reduce((s, d) => s + d.education, 0)),
        Infrastructure: Math.round(yd.reduce((s, d) => s + d.infrastructure, 0)),
      };
    });
  }, []);

  const mapData = useMemo(
    () =>
      yearData.map((d) => ({
        postcode: d.postcode,
        value: d.total,
        label: `${VICTORIAN_POSTCODES.find((p) => p.postcode === d.postcode)?.suburb || d.postcode}: $${d.total.toFixed(1)}M`,
      })),
    [yearData]
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Federal Government Spending</h1>
        <p className="text-slate-400 text-sm mt-1">
          Commonwealth spending allocated to Victorian postcodes — Medicare, welfare, education, and infrastructure.
        </p>
      </div>

      <YearSlider year={year} onChange={setYear} />

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard title="Total Federal" value={`$${(totals.total / 1000).toFixed(1)}B`} subtitle={`${year}`} />
        <StatCard title="Medicare/Health" value={`$${(totals.medicare / 1000).toFixed(1)}B`} />
        <StatCard title="Welfare" value={`$${(totals.welfare / 1000).toFixed(1)}B`} />
        <StatCard title="Education" value={`$${(totals.education / 1000).toFixed(1)}B`} />
        <StatCard title="Infrastructure" value={`$${(totals.infrastructure / 1000).toFixed(1)}B`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PostcodeMap data={mapData} colorScale="green" title={`Federal Spending by Postcode (${year})`} />
        <RegionChart
          data={regionData}
          bars={[
            { key: "Medicare", color: "#34d399", name: "Medicare" },
            { key: "Welfare", color: "#f472b6", name: "Welfare" },
            { key: "Education", color: "#60a5fa", name: "Education" },
            { key: "Infrastructure", color: "#fbbf24", name: "Infrastructure" },
          ]}
          title={`Federal Spending by Region & Category (${year})`}
        />
      </div>

      <TimeSeriesChart
        data={timeSeries}
        lines={[
          { key: "Medicare", color: "#34d399", name: "Medicare/Health" },
          { key: "Welfare", color: "#f472b6", name: "Welfare" },
          { key: "Education", color: "#60a5fa", name: "Education" },
          { key: "Infrastructure", color: "#fbbf24", name: "Infrastructure" },
        ]}
        title="Federal Spending by Category (2014-2023)"
      />

      <div className="bg-slate-800 rounded-xl p-4">
        <h3 className="text-sm font-medium text-slate-300 mb-3">Top 15 Postcodes by Federal Spending ({year})</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-slate-400 border-b border-slate-700">
                <th className="text-left py-2 px-2">Postcode</th>
                <th className="text-left py-2 px-2">Suburb</th>
                <th className="text-right py-2 px-2">Medicare</th>
                <th className="text-right py-2 px-2">Welfare</th>
                <th className="text-right py-2 px-2">Education</th>
                <th className="text-right py-2 px-2">Infra</th>
                <th className="text-right py-2 px-2 font-bold">Total</th>
              </tr>
            </thead>
            <tbody>
              {[...yearData]
                .sort((a, b) => b.total - a.total)
                .slice(0, 15)
                .map((d) => {
                  const pc = VICTORIAN_POSTCODES.find((p) => p.postcode === d.postcode);
                  return (
                    <tr key={d.postcode} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                      <td className="py-1.5 px-2 text-slate-300">{d.postcode}</td>
                      <td className="py-1.5 px-2 text-slate-300">{pc?.suburb}</td>
                      <td className="py-1.5 px-2 text-right text-emerald-400">${d.medicare.toFixed(1)}M</td>
                      <td className="py-1.5 px-2 text-right text-pink-400">${d.welfare.toFixed(1)}M</td>
                      <td className="py-1.5 px-2 text-right text-blue-400">${d.education.toFixed(1)}M</td>
                      <td className="py-1.5 px-2 text-right text-yellow-400">${d.infrastructure.toFixed(1)}M</td>
                      <td className="py-1.5 px-2 text-right text-white font-bold">${d.total.toFixed(1)}M</td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
