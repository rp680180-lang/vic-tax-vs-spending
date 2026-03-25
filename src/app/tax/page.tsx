"use client";

import { useState, useMemo } from "react";
import { VICTORIAN_POSTCODES } from "@/data/postcodes";
import { TAX_REVENUE_DATA } from "@/data/tax-revenue";
import StatCard from "@/components/StatCard";
import TimeSeriesChart from "@/components/TimeSeriesChart";
import RegionChart from "@/components/RegionChart";
import PostcodeMap from "@/components/PostcodeMap";
import YearSlider from "@/components/YearSlider";

export default function TaxPage() {
  const [year, setYear] = useState(2023);

  const yearData = useMemo(
    () => TAX_REVENUE_DATA.filter((d) => d.year === year),
    [year]
  );

  const totalTax = yearData.reduce((s, d) => s + d.totalTaxPaid, 0);
  const totalIncome = yearData.reduce((s, d) => s + d.totalTaxableIncome, 0);
  const totalTaxpayers = yearData.reduce((s, d) => s + d.numberOfTaxpayers, 0);
  const avgMedian = yearData.length > 0
    ? Math.round(yearData.reduce((s, d) => s + d.medianTaxableIncome, 0) / yearData.length)
    : 0;

  // By region
  const regionData = useMemo(() => {
    const regions = new Map<string, { tax: number; income: number; taxpayers: number }>();
    for (const d of yearData) {
      const pc = VICTORIAN_POSTCODES.find((p) => p.postcode === d.postcode);
      if (!pc) continue;
      const r = regions.get(pc.region) || { tax: 0, income: 0, taxpayers: 0 };
      r.tax += d.totalTaxPaid;
      r.income += d.totalTaxableIncome;
      r.taxpayers += d.numberOfTaxpayers;
      regions.set(pc.region, r);
    }
    return Array.from(regions.entries())
      .map(([region, v]) => ({
        region,
        "Tax Paid": Math.round(v.tax),
        "Taxable Income": Math.round(v.income),
      }))
      .sort((a, b) => b["Tax Paid"] - a["Tax Paid"]);
  }, [yearData]);

  // Time series by region group
  const timeSeriesTop = useMemo(() => {
    const years = Array.from({ length: 10 }, (_, i) => 2014 + i);
    const topRegions = ["Inner East", "Inner Melbourne", "Bayside", "Eastern Melbourne", "Western Melbourne"];
    return years.map((y) => {
      const row: Record<string, string | number> = { year: y.toString() };
      for (const region of topRegions) {
        const postcodes = VICTORIAN_POSTCODES.filter((p) => p.region === region).map((p) => p.postcode);
        const total = TAX_REVENUE_DATA.filter((d) => d.year === y && postcodes.includes(d.postcode))
          .reduce((s, d) => s + d.totalTaxPaid, 0);
        row[region] = Math.round(total);
      }
      return row;
    });
  }, []);

  // Map data
  const mapData = useMemo(
    () =>
      yearData.map((d) => ({
        postcode: d.postcode,
        value: d.totalTaxPaid,
        label: `${VICTORIAN_POSTCODES.find((p) => p.postcode === d.postcode)?.suburb || d.postcode}: $${d.totalTaxPaid.toFixed(1)}M`,
      })),
    [yearData]
  );

  // Top/bottom postcodes table
  const sorted = useMemo(
    () => [...yearData].sort((a, b) => b.medianTaxableIncome - a.medianTaxableIncome),
    [yearData]
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Tax Revenue by Postcode</h1>
        <p className="text-slate-400 text-sm mt-1">
          Individual income tax collected from Victorian postcodes, based on ATO Taxation Statistics patterns.
        </p>
      </div>

      <YearSlider year={year} onChange={setYear} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Total Tax Paid" value={`$${(totalTax / 1000).toFixed(1)}B`} subtitle={`${year}`} />
        <StatCard title="Total Taxable Income" value={`$${(totalIncome / 1000).toFixed(1)}B`} subtitle={`${year}`} />
        <StatCard title="Total Taxpayers" value={`${(totalTaxpayers / 1000).toFixed(0)}K`} subtitle={`${year}`} />
        <StatCard title="Avg Median Income" value={`$${(avgMedian / 1000).toFixed(0)}K`} subtitle={`${year}`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PostcodeMap data={mapData} colorScale="blue" title={`Tax Paid by Postcode (${year})`} />
        <RegionChart
          data={regionData}
          bars={[
            { key: "Tax Paid", color: "#60a5fa", name: "Tax Paid ($M)" },
          ]}
          title={`Tax Paid by Region (${year})`}
        />
      </div>

      <TimeSeriesChart
        data={timeSeriesTop}
        lines={[
          { key: "Inner East", color: "#a78bfa", name: "Inner East" },
          { key: "Inner Melbourne", color: "#60a5fa", name: "Inner Melbourne" },
          { key: "Bayside", color: "#c084fc", name: "Bayside" },
          { key: "Eastern Melbourne", color: "#818cf8", name: "Eastern Melbourne" },
          { key: "Western Melbourne", color: "#fb923c", name: "Western Melbourne" },
        ]}
        title="Tax Revenue Trends by Region (2014-2023)"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-800 rounded-xl p-4">
          <h3 className="text-sm font-medium text-slate-300 mb-3">Top 10 — Highest Median Income</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-slate-400 border-b border-slate-700">
                  <th className="text-left py-2 px-2">Postcode</th>
                  <th className="text-left py-2 px-2">Suburb</th>
                  <th className="text-right py-2 px-2">Median Income</th>
                  <th className="text-right py-2 px-2">Tax Paid</th>
                </tr>
              </thead>
              <tbody>
                {sorted.slice(0, 10).map((d) => {
                  const pc = VICTORIAN_POSTCODES.find((p) => p.postcode === d.postcode);
                  return (
                    <tr key={d.postcode} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                      <td className="py-1.5 px-2 text-slate-300">{d.postcode}</td>
                      <td className="py-1.5 px-2 text-slate-300">{pc?.suburb}</td>
                      <td className="py-1.5 px-2 text-right text-emerald-400">${(d.medianTaxableIncome / 1000).toFixed(0)}K</td>
                      <td className="py-1.5 px-2 text-right text-blue-400">${d.totalTaxPaid.toFixed(1)}M</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        <div className="bg-slate-800 rounded-xl p-4">
          <h3 className="text-sm font-medium text-slate-300 mb-3">Bottom 10 — Lowest Median Income</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-slate-400 border-b border-slate-700">
                  <th className="text-left py-2 px-2">Postcode</th>
                  <th className="text-left py-2 px-2">Suburb</th>
                  <th className="text-right py-2 px-2">Median Income</th>
                  <th className="text-right py-2 px-2">Tax Paid</th>
                </tr>
              </thead>
              <tbody>
                {sorted.slice(-10).reverse().map((d) => {
                  const pc = VICTORIAN_POSTCODES.find((p) => p.postcode === d.postcode);
                  return (
                    <tr key={d.postcode} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                      <td className="py-1.5 px-2 text-slate-300">{d.postcode}</td>
                      <td className="py-1.5 px-2 text-slate-300">{pc?.suburb}</td>
                      <td className="py-1.5 px-2 text-right text-orange-400">${(d.medianTaxableIncome / 1000).toFixed(0)}K</td>
                      <td className="py-1.5 px-2 text-right text-blue-400">${d.totalTaxPaid.toFixed(1)}M</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
