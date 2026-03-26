"use client";

import { useState, useMemo } from "react";
import { TAX_REVENUE_DATA, TAX_YEARS } from "@/data/tax-revenue";
import { getRegion } from "@/data/postcodes";
import StatCard from "@/components/StatCard";
import TimeSeriesChart from "@/components/TimeSeriesChart";
import RegionChart from "@/components/RegionChart";
import PostcodeMap from "@/components/PostcodeMap";
import YearSlider from "@/components/YearSlider";

export default function TaxPage() {
  const [yearIdx, setYearIdx] = useState(TAX_YEARS.length - 1);
  const year = TAX_YEARS[yearIdx];

  const yearData = useMemo(
    () => TAX_REVENUE_DATA.filter((d) => d.financialYear === year),
    [year]
  );

  const totalTaxPaid = yearData.reduce((s, d) => s + d.taxPaid, 0);
  const totalIncome = yearData.reduce((s, d) => s + d.taxableIncome, 0);
  const totalIndividuals = yearData.reduce((s, d) => s + d.individuals, 0);
  const avgMedian = totalIndividuals > 0 ? Math.round(totalIncome / totalIndividuals) : 0;

  // By region
  const regionData = useMemo(() => {
    const regions = new Map<string, { tax: number; income: number; individuals: number }>();
    for (const d of yearData) {
      const region = getRegion(d.postcode);
      const r = regions.get(region) || { tax: 0, income: 0, individuals: 0 };
      r.tax += d.taxPaid;
      r.income += d.taxableIncome;
      r.individuals += d.individuals;
      regions.set(region, r);
    }
    return Array.from(regions.entries())
      .map(([region, v]) => ({
        region,
        "Tax Paid ($M)": Math.round(v.tax / 1e6),
        "Avg Income ($K)": v.individuals > 0 ? Math.round(v.income / v.individuals / 1000) : 0,
      }))
      .sort((a, b) => b["Tax Paid ($M)"] - a["Tax Paid ($M)"]);
  }, [yearData]);

  // Time series
  const timeSeries = useMemo(() => {
    return TAX_YEARS.map((fy) => {
      const yd = TAX_REVENUE_DATA.filter((d) => d.financialYear === fy);
      return {
        year: fy,
        "Tax Paid ($B)": Math.round(yd.reduce((s, d) => s + d.taxPaid, 0) / 1e9 * 10) / 10,
        "Taxable Income ($B)": Math.round(yd.reduce((s, d) => s + d.taxableIncome, 0) / 1e9 * 10) / 10,
      };
    });
  }, []);

  // Heatmap data
  const mapData = useMemo(
    () => yearData.map((d) => ({
      postcode: d.postcode,
      value: d.taxPaid / 1e6,
      label: `${d.postcode}: $${(d.taxPaid / 1e6).toFixed(1)}M tax paid`,
    })),
    [yearData]
  );

  // Top/bottom postcodes
  const sorted = useMemo(
    () => [...yearData].sort((a, b) => b.medianTaxableIncome - a.medianTaxableIncome),
    [yearData]
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Tax Revenue by Postcode</h1>
        <p className="text-slate-400 text-sm mt-1">
          ATO Individual Tax Statistics (Table 6B) — real data from {yearData.length} Victorian postcodes.
        </p>
      </div>

      <YearSlider year={yearIdx} onChange={setYearIdx} min={0} max={TAX_YEARS.length - 1} labels={TAX_YEARS} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Total Tax Paid" value={`$${(totalTaxPaid / 1e9).toFixed(1)}B`} subtitle={year} />
        <StatCard title="Total Taxable Income" value={`$${(totalIncome / 1e9).toFixed(0)}B`} subtitle={year} />
        <StatCard title="Taxpayers" value={`${(totalIndividuals / 1000).toFixed(0)}K`} subtitle={year} />
        <StatCard title="Avg Taxable Income" value={`$${(avgMedian / 1000).toFixed(0)}K`} subtitle={year} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PostcodeMap data={mapData} colorScale="blue" title={`Tax Paid by Region (${year})`} unit="$M" />
        <RegionChart
          data={regionData}
          bars={[{ key: "Tax Paid ($M)", color: "#60a5fa", name: "Tax Paid ($M)" }]}
          title={`Tax Paid by Region (${year})`}
        />
      </div>

      <TimeSeriesChart
        data={timeSeries}
        lines={[
          { key: "Tax Paid ($B)", color: "#60a5fa", name: "Tax Paid" },
          { key: "Taxable Income ($B)", color: "#34d399", name: "Taxable Income" },
        ]}
        title="Victorian Tax Revenue (2014-15 to 2022-23)"
        yLabel="$B"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-800 rounded-xl p-4">
          <h3 className="text-sm font-medium text-slate-300 mb-3">Top 15 — Highest Avg Taxable Income ({year})</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-slate-400 border-b border-slate-700">
                  <th className="text-left py-2 px-2">Postcode</th>
                  <th className="text-left py-2 px-2">Region</th>
                  <th className="text-right py-2 px-2">Avg Income</th>
                  <th className="text-right py-2 px-2">Tax Paid</th>
                  <th className="text-right py-2 px-2">Taxpayers</th>
                </tr>
              </thead>
              <tbody>
                {sorted.slice(0, 15).map((d) => (
                  <tr key={d.postcode} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                    <td className="py-1.5 px-2 text-slate-300">{d.postcode}</td>
                    <td className="py-1.5 px-2 text-slate-400 text-[10px]">{getRegion(d.postcode)}</td>
                    <td className="py-1.5 px-2 text-right text-emerald-400">${(d.medianTaxableIncome / 1000).toFixed(0)}K</td>
                    <td className="py-1.5 px-2 text-right text-blue-400">${(d.taxPaid / 1e6).toFixed(1)}M</td>
                    <td className="py-1.5 px-2 text-right text-slate-400">{d.individuals.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="bg-slate-800 rounded-xl p-4">
          <h3 className="text-sm font-medium text-slate-300 mb-3">Bottom 15 — Lowest Avg Taxable Income ({year})</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-slate-400 border-b border-slate-700">
                  <th className="text-left py-2 px-2">Postcode</th>
                  <th className="text-left py-2 px-2">Region</th>
                  <th className="text-right py-2 px-2">Avg Income</th>
                  <th className="text-right py-2 px-2">Tax Paid</th>
                  <th className="text-right py-2 px-2">Taxpayers</th>
                </tr>
              </thead>
              <tbody>
                {sorted.filter(d => d.individuals > 100).slice(-15).reverse().map((d) => (
                  <tr key={d.postcode} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                    <td className="py-1.5 px-2 text-slate-300">{d.postcode}</td>
                    <td className="py-1.5 px-2 text-slate-400 text-[10px]">{getRegion(d.postcode)}</td>
                    <td className="py-1.5 px-2 text-right text-orange-400">${(d.medianTaxableIncome / 1000).toFixed(0)}K</td>
                    <td className="py-1.5 px-2 text-right text-blue-400">${(d.taxPaid / 1e6).toFixed(1)}M</td>
                    <td className="py-1.5 px-2 text-right text-slate-400">{d.individuals.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
