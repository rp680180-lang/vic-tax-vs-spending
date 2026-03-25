"use client";

import { useState, useMemo } from "react";
import { VICTORIAN_POSTCODES } from "@/data/postcodes";
import { STATE_SPENDING_DATA } from "@/data/state-spending";
import StatCard from "@/components/StatCard";
import TimeSeriesChart from "@/components/TimeSeriesChart";
import RegionChart from "@/components/RegionChart";
import PostcodeMap from "@/components/PostcodeMap";
import YearSlider from "@/components/YearSlider";

export default function StatePage() {
  const [year, setYear] = useState(2023);

  const yearData = useMemo(
    () => STATE_SPENDING_DATA.filter((d) => d.year === year),
    [year]
  );

  const totals = useMemo(() => {
    const t = { health: 0, education: 0, transport: 0, policeEmergency: 0, housing: 0, other: 0, total: 0 };
    for (const d of yearData) {
      t.health += d.health;
      t.education += d.education;
      t.transport += d.transport;
      t.policeEmergency += d.policeEmergency;
      t.housing += d.housing;
      t.other += d.other;
      t.total += d.total;
    }
    return t;
  }, [yearData]);

  const regionData = useMemo(() => {
    const regions = new Map<string, { health: number; education: number; transport: number; housing: number }>();
    for (const d of yearData) {
      const pc = VICTORIAN_POSTCODES.find((p) => p.postcode === d.postcode);
      if (!pc) continue;
      const r = regions.get(pc.region) || { health: 0, education: 0, transport: 0, housing: 0 };
      r.health += d.health;
      r.education += d.education;
      r.transport += d.transport;
      r.housing += d.housing;
      regions.set(pc.region, r);
    }
    return Array.from(regions.entries())
      .map(([region, v]) => ({
        region,
        Health: Math.round(v.health),
        Education: Math.round(v.education),
        Transport: Math.round(v.transport),
        Housing: Math.round(v.housing),
      }))
      .sort((a, b) => (b.Health + b.Education + b.Transport + b.Housing) - (a.Health + a.Education + a.Transport + a.Housing));
  }, [yearData]);

  const timeSeries = useMemo(() => {
    const years = Array.from({ length: 10 }, (_, i) => 2014 + i);
    return years.map((y) => {
      const yd = STATE_SPENDING_DATA.filter((d) => d.year === y);
      return {
        year: y.toString(),
        Health: Math.round(yd.reduce((s, d) => s + d.health, 0)),
        Education: Math.round(yd.reduce((s, d) => s + d.education, 0)),
        Transport: Math.round(yd.reduce((s, d) => s + d.transport, 0)),
        "Police/Emergency": Math.round(yd.reduce((s, d) => s + d.policeEmergency, 0)),
        Housing: Math.round(yd.reduce((s, d) => s + d.housing, 0)),
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
        <h1 className="text-2xl font-bold text-white">Victorian State Government Spending</h1>
        <p className="text-slate-400 text-sm mt-1">
          State government spending allocated to Victorian postcodes — health, education, transport, police, and housing.
        </p>
      </div>

      <YearSlider year={year} onChange={setYear} />

      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <StatCard title="Total State" value={`$${(totals.total / 1000).toFixed(1)}B`} subtitle={`${year}`} />
        <StatCard title="Health" value={`$${(totals.health / 1000).toFixed(1)}B`} />
        <StatCard title="Education" value={`$${(totals.education / 1000).toFixed(1)}B`} />
        <StatCard title="Transport" value={`$${(totals.transport / 1000).toFixed(1)}B`} />
        <StatCard title="Police/Emergency" value={`$${(totals.policeEmergency / 1000).toFixed(1)}B`} />
        <StatCard title="Housing" value={`$${(totals.housing / 1000).toFixed(1)}B`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PostcodeMap data={mapData} colorScale="red" title={`State Spending by Postcode (${year})`} />
        <RegionChart
          data={regionData}
          bars={[
            { key: "Health", color: "#f87171", name: "Health" },
            { key: "Education", color: "#60a5fa", name: "Education" },
            { key: "Transport", color: "#fbbf24", name: "Transport" },
            { key: "Housing", color: "#a78bfa", name: "Housing" },
          ]}
          title={`State Spending by Region & Category (${year})`}
        />
      </div>

      <TimeSeriesChart
        data={timeSeries}
        lines={[
          { key: "Health", color: "#f87171", name: "Health" },
          { key: "Education", color: "#60a5fa", name: "Education" },
          { key: "Transport", color: "#fbbf24", name: "Transport" },
          { key: "Police/Emergency", color: "#34d399", name: "Police/Emergency" },
          { key: "Housing", color: "#a78bfa", name: "Housing" },
        ]}
        title="State Spending by Category (2014-2023)"
      />

      <div className="bg-slate-800 rounded-xl p-4">
        <h3 className="text-sm font-medium text-slate-300 mb-3">Top 15 Postcodes by State Spending ({year})</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-slate-400 border-b border-slate-700">
                <th className="text-left py-2 px-2">Postcode</th>
                <th className="text-left py-2 px-2">Suburb</th>
                <th className="text-right py-2 px-2">Health</th>
                <th className="text-right py-2 px-2">Education</th>
                <th className="text-right py-2 px-2">Transport</th>
                <th className="text-right py-2 px-2">Housing</th>
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
                      <td className="py-1.5 px-2 text-right text-red-400">${d.health.toFixed(1)}M</td>
                      <td className="py-1.5 px-2 text-right text-blue-400">${d.education.toFixed(1)}M</td>
                      <td className="py-1.5 px-2 text-right text-yellow-400">${d.transport.toFixed(1)}M</td>
                      <td className="py-1.5 px-2 text-right text-purple-400">${d.housing.toFixed(1)}M</td>
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
