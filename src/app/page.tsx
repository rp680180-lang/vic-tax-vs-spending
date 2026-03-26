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
      const individuals = yd.reduce((s, d) => s + d.individuals, 0);
      return {
        year: fy,
        "Tax Paid ($B)": Math.round(taxPaid / 1e9 * 10) / 10,
        "Taxable Income ($B)": Math.round(taxableIncome / 1e9 * 10) / 10,
        "Avg Income ($K)": Math.round(taxableIncome / individuals / 1000 * 10) / 10,
      };
    });
  }, []);

  // Key correlation: Tax paid per postcode vs welfare recipients per postcode
  const taxVsWelfare = useMemo(() => {
    const welfareMap = new Map(WELFARE_DATA.map((d) => [d.postcode, d]));
    return yearTax
      .filter((d) => welfareMap.has(d.postcode))
      .map((d) => {
        const w = welfareMap.get(d.postcode)!;
        return {
          x: d.medianTaxableIncome / 1000,
          y: w.totalRecipients,
          label: d.postcode,
          region: getRegion(d.postcode),
        };
      });
  }, [yearTax]);

  // Per-capita correlation: median income vs welfare recipients per individual
  const incomeVsWelfareRate = useMemo(() => {
    const welfareMap = new Map(WELFARE_DATA.map((d) => [d.postcode, d]));
    return yearTax
      .filter((d) => welfareMap.has(d.postcode) && d.individuals > 100)
      .map((d) => {
        const w = welfareMap.get(d.postcode)!;
        return {
          x: d.medianTaxableIncome / 1000,
          y: Math.round(w.totalRecipients / d.individuals * 1000) / 10,
          label: d.postcode,
          region: getRegion(d.postcode),
        };
      });
  }, [yearTax]);

  // Correlation coefficient
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
          Tax data: ATO Individual Tax Statistics (Table 6B), 2014-15 to 2022-23.
          Welfare data: DSS Payment Demographics, March 2025 snapshot.
        </p>
      </div>

      <YearSlider year={yearIdx} onChange={setYearIdx} min={0} max={TAX_YEARS.length - 1} labels={TAX_YEARS} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Tax Paid"
          value={`$${(totalTaxPaid / 1e9).toFixed(1)}B`}
          subtitle={year}
        />
        <StatCard
          title="Total Taxable Income"
          value={`$${(totalTaxableIncome / 1e9).toFixed(0)}B`}
          subtitle={year}
        />
        <StatCard
          title="Taxpayers"
          value={`${(totalIndividuals / 1e6).toFixed(2)}M`}
          subtitle={year}
        />
        <StatCard
          title="Welfare Recipients"
          value={`${(totalWelfareRecipients / 1000).toFixed(0)}K`}
          subtitle="Mar 2025"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ScatterPlot
          data={incomeVsWelfareRate}
          xLabel="Median Taxable Income ($K)"
          yLabel="Welfare Recipients per 10 Taxpayers"
          title={`Income vs Welfare Dependency Rate by Postcode (${year}) — r = ${corrCoeff.toFixed(3)}`}
        />
        <ScatterPlot
          data={taxVsWelfare}
          xLabel="Median Taxable Income ($K)"
          yLabel="Total Welfare Recipients"
          title={`Median Income vs Welfare Recipients by Postcode (${year})`}
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
          <p><strong>Tax Revenue:</strong> ATO Taxation Statistics — Individual Tax Return data by postcode (Table 6B). 9 financial years from 2014-15 to 2022-23. ~700 Victorian postcodes per year.</p>
          <p><strong>Welfare Spending:</strong> DSS Benefit and Payment Recipient Demographics by postcode (March 2025 snapshot). Shows recipient counts for JobSeeker, Age Pension, DSP, Family Tax Benefit, and other payments.</p>
          <p><strong>Note:</strong> Infrastructure, education, and health spending are not available at postcode level from any government source. Welfare recipient counts (not dollar amounts) are used; estimated costs use standard payment rates.</p>
        </div>
      </div>
    </div>
  );
}
