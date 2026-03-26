"use client";

import { useMemo } from "react";
import { WELFARE_DATA, estimateWelfareCost, PAYMENT_CATEGORIES } from "@/data/welfare-spending";
import { TAX_REVENUE_DATA, TAX_YEARS } from "@/data/tax-revenue";
import { getRegion } from "@/data/postcodes";
import StatCard from "@/components/StatCard";
import RegionChart from "@/components/RegionChart";
import PostcodeMap from "@/components/PostcodeMap";

export default function WelfarePage() {
  const totalRecipients = WELFARE_DATA.reduce((s, d) => s + d.totalRecipients, 0);
  const totalEstCost = WELFARE_DATA.reduce((s, d) => s + estimateWelfareCost(d), 0);

  // Payment type totals
  const paymentTotals = useMemo(() => {
    const totals = new Map<string, number>();
    for (const d of WELFARE_DATA) {
      for (const [payment, count] of Object.entries(d.payments)) {
        totals.set(payment, (totals.get(payment) || 0) + count);
      }
    }
    return Array.from(totals.entries())
      .sort((a, b) => b[1] - a[1]);
  }, []);

  // By region
  const regionData = useMemo(() => {
    const latestTax = new Map(
      TAX_REVENUE_DATA
        .filter((d) => d.financialYear === TAX_YEARS[TAX_YEARS.length - 1])
        .map((d) => [d.postcode, d])
    );

    const regions = new Map<string, { recipients: number; taxpayers: number; estCost: number }>();
    for (const d of WELFARE_DATA) {
      const region = getRegion(d.postcode);
      const r = regions.get(region) || { recipients: 0, taxpayers: 0, estCost: 0 };
      r.recipients += d.totalRecipients;
      r.estCost += estimateWelfareCost(d);
      const tax = latestTax.get(d.postcode);
      if (tax) r.taxpayers += tax.individuals;
      regions.set(region, r);
    }
    return Array.from(regions.entries())
      .map(([region, v]) => ({
        region,
        "Recipients": v.recipients,
        "Est. Cost ($M)": Math.round(v.estCost / 1e6),
        "Rate per 100": v.taxpayers > 0 ? Math.round(v.recipients / v.taxpayers * 100) : 0,
      }))
      .sort((a, b) => b["Recipients"] - a["Recipients"]);
  }, []);

  // Heatmap
  const mapData = useMemo(
    () => WELFARE_DATA.map((d) => ({
      postcode: d.postcode,
      value: d.totalRecipients,
      label: `${d.postcode}: ${d.totalRecipients.toLocaleString()} recipients`,
    })),
    []
  );

  // Payment category chart data
  const categoryData = useMemo(() => {
    return PAYMENT_CATEGORIES.map((cat) => ({
      region: cat.replace("Commonwealth ", "").replace(" (student and apprentice)", ""),
      Recipients: paymentTotals.find(([k]) => k === cat)?.[1] || 0,
    }));
  }, [paymentTotals]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Welfare Payments by Postcode</h1>
        <p className="text-slate-400 text-sm mt-1">
          DSS Payment Recipient Demographics — real data, March 2025 snapshot.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Total Recipients" value={`${(totalRecipients / 1000).toFixed(0)}K`} subtitle="Mar 2025" />
        <StatCard title="Est. Annual Cost" value={`$${(totalEstCost / 1e9).toFixed(1)}B`} subtitle="Based on std rates" />
        <StatCard title="Top Payment" value="Age Pension" subtitle={`${(paymentTotals[0]?.[1] / 1000 || 0).toFixed(0)}K recipients`} />
        <StatCard title="VIC Postcodes" value={`${WELFARE_DATA.length}`} subtitle="With welfare data" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PostcodeMap data={mapData} colorScale="red" title="Welfare Recipients by Region (Mar 2025)" unit="recipients" />
        <RegionChart
          data={categoryData}
          bars={[{ key: "Recipients", color: "#f472b6", name: "Recipients" }]}
          title="Recipients by Payment Type (VIC total)"
          yLabel="Count"
        />
      </div>

      <RegionChart
        data={regionData.slice(0, 15)}
        bars={[
          { key: "Recipients", color: "#f472b6", name: "Recipients" },
        ]}
        title="Welfare Recipients by Region"
        yLabel="Count"
      />

      <div className="bg-slate-800 rounded-xl p-4">
        <h3 className="text-sm font-medium text-slate-300 mb-3">Top 20 Postcodes by Welfare Recipients</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-slate-400 border-b border-slate-700">
                <th className="text-left py-2 px-2">Postcode</th>
                <th className="text-left py-2 px-2">Region</th>
                <th className="text-right py-2 px-2">Total</th>
                <th className="text-right py-2 px-2">JobSeeker</th>
                <th className="text-right py-2 px-2">Age Pen.</th>
                <th className="text-right py-2 px-2">DSP</th>
                <th className="text-right py-2 px-2">FTB A</th>
                <th className="text-right py-2 px-2">Est. Cost</th>
              </tr>
            </thead>
            <tbody>
              {[...WELFARE_DATA]
                .sort((a, b) => b.totalRecipients - a.totalRecipients)
                .slice(0, 20)
                .map((d) => (
                  <tr key={d.postcode} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                    <td className="py-1.5 px-2 text-slate-300">{d.postcode}</td>
                    <td className="py-1.5 px-2 text-slate-400 text-[10px]">{getRegion(d.postcode)}</td>
                    <td className="py-1.5 px-2 text-right text-white font-bold">{d.totalRecipients.toLocaleString()}</td>
                    <td className="py-1.5 px-2 text-right text-pink-400">{(d.payments["JobSeeker Payment"] || 0).toLocaleString()}</td>
                    <td className="py-1.5 px-2 text-right text-blue-400">{(d.payments["Age Pension"] || 0).toLocaleString()}</td>
                    <td className="py-1.5 px-2 text-right text-purple-400">{(d.payments["Disability Support Pension"] || 0).toLocaleString()}</td>
                    <td className="py-1.5 px-2 text-right text-yellow-400">{(d.payments["Family Tax Benefit A"] || 0).toLocaleString()}</td>
                    <td className="py-1.5 px-2 text-right text-emerald-400">${(estimateWelfareCost(d) / 1e6).toFixed(1)}M</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
        <h3 className="text-sm font-medium text-slate-300 mb-2">About this data</h3>
        <div className="text-xs text-slate-400 space-y-1">
          <p>Recipient counts from DSS Payment Demographics (March 2025). One person may receive multiple payments.</p>
          <p>Estimated costs use standard 2024-25 fortnightly payment rates annualised. Actual costs vary by individual circumstances.</p>
        </div>
      </div>
    </div>
  );
}
