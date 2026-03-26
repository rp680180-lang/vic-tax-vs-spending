"use client";

import { useState, useMemo } from "react";
import { TAX_REVENUE_DATA, TAX_YEARS } from "@/data/tax-revenue";
import { WELFARE_DATA } from "@/data/welfare-spending";
import { getRegion } from "@/data/postcodes";
import { pearsonCorrelation } from "@/lib/analysis";
import StatCard from "@/components/StatCard";
import TimeSeriesChart from "@/components/TimeSeriesChart";
import ScatterPlot from "@/components/ScatterPlot";
import YearSlider from "@/components/YearSlider";

function formatBigNumber(n: number): string {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(0)}K`;
  return n.toString();
}

export default function OverviewPage() {
  const [yearIdx, setYearIdx] = useState(TAX_YEARS.length - 1);
  const year = TAX_YEARS[yearIdx];

  const yearTax = useMemo(
    () => TAX_REVENUE_DATA.filter((d) => d.financialYear === year),
    [year]
  );

  const totalTaxPaid = yearTax.reduce((s, d) => s + d.taxPaid, 0);
  const totalTaxableIncome = yearTax.reduce((s, d) => s + d.taxableIncome, 0);
  const totalIndividuals = yearTax.reduce((s, d) => s + d.individuals, 0);
  const totalWelfareRecipients = WELFARE_DATA.reduce((s, d) => s + d.totalRecipients, 0);

  // Time series
  const timeSeries = useMemo(() => {
    return TAX_YEARS.map((fy) => {
      const yd = TAX_REVENUE_DATA.filter((d) => d.financialYear === fy);
      const taxPaid = yd.reduce((s, d) => s + d.taxPaid, 0);
      const taxableIncome = yd.reduce((s, d) => s + d.taxableIncome, 0);
      return {
        year: fy,
        "Tax Paid ($B)": Math.round(taxPaid / 1e9 * 10) / 10,
        "Taxable Income ($B)": Math.round(taxableIncome / 1e9 * 10) / 10,
      };
    });
  }, []);

  // Aggregate by region for scatter plots
  const welfareMap = useMemo(
    () => new Map(WELFARE_DATA.map((d) => [d.postcode, d])),
    []
  );

  const regionScatter = useMemo(() => {
    const regionAgg = new Map<string, { income: number; individuals: number; welfareRecipients: number; taxPaid: number }>();

    for (const d of yearTax) {
      const region = getRegion(d.postcode);
      const w = welfareMap.get(d.postcode);
      const agg = regionAgg.get(region) || { income: 0, individuals: 0, welfareRecipients: 0, taxPaid: 0 };
      agg.income += d.taxableIncome;
      agg.individuals += d.individuals;
      agg.taxPaid += d.taxPaid;
      if (w) agg.welfareRecipients += w.totalRecipients;
      regionAgg.set(region, agg);
    }

    return Array.from(regionAgg.entries())
      .filter(([, v]) => v.individuals > 0 && v.welfareRecipients > 0)
      .map(([region, v]) => ({
        region,
        avgIncome: v.income / v.individuals,
        welfareRate: v.welfareRecipients / v.individuals,
        taxPaid: v.taxPaid,
        welfareRecipients: v.welfareRecipients,
        individuals: v.individuals,
      }));
  }, [yearTax, welfareMap]);

  const incomeVsWelfareRate = regionScatter.map((d) => ({
    x: Math.round(d.avgIncome / 1000),
    y: Math.round(d.welfareRate * 1000) / 10,
    label: d.region,
    region: d.region,
  }));

  const taxVsWelfareRecipients = regionScatter.map((d) => ({
    x: Math.round(d.taxPaid / 1e6),
    y: d.welfareRecipients,
    label: d.region,
    region: d.region,
  }));

  const corrCoeff = useMemo(() => {
    if (incomeVsWelfareRate.length === 0) return 0;
    return pearsonCorrelation(
      incomeVsWelfareRate.map((d) => d.x),
      incomeVsWelfareRate.map((d) => d.y)
    );
  }, [incomeVsWelfareRate]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Victoria: Tax vs Public Spending</h1>
        <p className="text-slate-400 text-sm mt-1">
          Real ATO tax statistics and DSS welfare payment data across ~700 Victorian postcodes.
        </p>
        <p className="text-xs text-slate-500 mt-1">
          Tax: ATO Table 6B, 2014-15 to 2022-23 | Welfare: DSS Demographics, March 2025
        </p>
      </div>

      <YearSlider year={yearIdx} onChange={setYearIdx} min={0} max={TAX_YEARS.length - 1} labels={TAX_YEARS} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Total Tax Paid" value={formatBigNumber(totalTaxPaid)} subtitle={year} />
        <StatCard title="Total Taxable Income" value={formatBigNumber(totalTaxableIncome)} subtitle={year} />
        <StatCard title="Taxpayers" value={formatBigNumber(totalIndividuals)} subtitle={year} />
        <StatCard title="Welfare Recipients" value={formatBigNumber(totalWelfareRecipients)} subtitle="Mar 2025" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ScatterPlot
          data={incomeVsWelfareRate}
          xLabel="Avg Taxable Income ($K)"
          yLabel="Welfare Recipients / 10 Taxpayers"
          title={`Income vs Welfare Rate by Region (${year}) — r = ${corrCoeff.toFixed(3)}`}
        />
        <ScatterPlot
          data={taxVsWelfareRecipients}
          xLabel="Tax Paid ($M)"
          yLabel="Welfare Recipients"
          title={`Tax Paid vs Welfare Recipients by Region (${year})`}
        />
      </div>

      <TimeSeriesChart
        data={timeSeries}
        lines={[
          { key: "Tax Paid ($B)", color: "#60a5fa", name: "Tax Paid ($B)" },
          { key: "Taxable Income ($B)", color: "#34d399", name: "Taxable Income ($B)" },
        ]}
        title="Victorian Tax Revenue Over Time (ATO Data)"
        yLabel="$B"
      />

      <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
        <h3 className="text-sm font-medium text-slate-300 mb-2">Data Sources</h3>
        <div className="text-xs text-slate-400 space-y-1">
          <p><strong>Tax Revenue:</strong> ATO Taxation Statistics — Individual Tax Return data (Table 6B). ~700 Victorian postcodes, 2014-15 to 2022-23.</p>
          <p><strong>Welfare:</strong> DSS Benefit and Payment Recipient Demographics by postcode (March 2025). Recipient counts for JobSeeker, Age Pension, DSP, Family Tax Benefit, etc.</p>
          <p><strong>Note:</strong> Infrastructure, education, and health spending are not published at postcode level. Scatter plots aggregate postcodes by region.</p>
        </div>
      </div>
    </div>
  );
}
