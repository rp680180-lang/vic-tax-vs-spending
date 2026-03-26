"use client";

import { useState, useMemo } from "react";
import { TAX_REVENUE_DATA, TAX_YEARS } from "@/data/tax-revenue";
import { WELFARE_DATA, estimateWelfareCost } from "@/data/welfare-spending";
import { getRegion } from "@/data/postcodes";
import { pearsonCorrelation } from "@/lib/analysis";
import ScatterPlot from "@/components/ScatterPlot";
import TimeSeriesChart from "@/components/TimeSeriesChart";
import YearSlider from "@/components/YearSlider";

function aggregateByRegion(yearTax: typeof TAX_REVENUE_DATA, welfareMap: Map<string, typeof WELFARE_DATA[0]>) {
  const regionAgg = new Map<string, {
    income: number; individuals: number; taxPaid: number;
    welfareRecipients: number; welfareCost: number;
    jobseeker: number; agePension: number; dsp: number;
    govtAllowances: number; govtPensions: number;
  }>();

  for (const d of yearTax) {
    const region = getRegion(d.postcode);
    const w = welfareMap.get(d.postcode);
    const agg = regionAgg.get(region) || {
      income: 0, individuals: 0, taxPaid: 0,
      welfareRecipients: 0, welfareCost: 0,
      jobseeker: 0, agePension: 0, dsp: 0,
      govtAllowances: 0, govtPensions: 0,
    };
    agg.income += d.taxableIncome;
    agg.individuals += d.individuals;
    agg.taxPaid += d.taxPaid;
    agg.govtAllowances += d.govtAllowances;
    agg.govtPensions += d.govtPensions;
    if (w) {
      agg.welfareRecipients += w.totalRecipients;
      agg.welfareCost += estimateWelfareCost(w);
      agg.jobseeker += w.payments["JobSeeker Payment"] || 0;
      agg.agePension += w.payments["Age Pension"] || 0;
      agg.dsp += w.payments["Disability Support Pension"] || 0;
    }
    regionAgg.set(region, agg);
  }

  return Array.from(regionAgg.entries())
    .filter(([, v]) => v.individuals > 0)
    .map(([region, v]) => ({ region, ...v, avgIncome: v.income / v.individuals }));
}

export default function CorrelationsPage() {
  const [yearIdx, setYearIdx] = useState(TAX_YEARS.length - 1);
  const year = TAX_YEARS[yearIdx];

  const yearTax = useMemo(
    () => TAX_REVENUE_DATA.filter((d) => d.financialYear === year),
    [year]
  );

  const welfareMap = useMemo(
    () => new Map(WELFARE_DATA.map((d) => [d.postcode, d])),
    []
  );

  const regions = useMemo(() => aggregateByRegion(yearTax, welfareMap), [yearTax, welfareMap]);

  const incomeVsWelfareRate = regions.filter((d) => d.welfareRecipients > 0).map((d) => ({
    x: Math.round(d.avgIncome / 1000),
    y: Math.round(d.welfareRecipients / d.individuals * 1000) / 10,
    label: d.region, region: d.region,
  }));

  const taxPerCapitaVsWelfareRate = regions.filter((d) => d.welfareRecipients > 0).map((d) => ({
    x: Math.round(d.taxPaid / d.individuals),
    y: Math.round(d.welfareRecipients / d.individuals * 1000) / 10,
    label: d.region, region: d.region,
  }));

  const incomeVsJobseeker = regions.filter((d) => d.jobseeker > 0).map((d) => ({
    x: Math.round(d.avgIncome / 1000),
    y: Math.round(d.jobseeker / d.individuals * 1000) / 10,
    label: d.region, region: d.region,
  }));

  const incomeVsAgePension = regions.filter((d) => d.agePension > 0).map((d) => ({
    x: Math.round(d.avgIncome / 1000),
    y: Math.round(d.agePension / d.individuals * 1000) / 10,
    label: d.region, region: d.region,
  }));

  const govtPaymentsVsTax = regions.filter((d) => d.govtAllowances + d.govtPensions > 0).map((d) => ({
    x: Math.round(d.taxPaid / 1e6),
    y: Math.round((d.govtAllowances + d.govtPensions) / 1e6),
    label: d.region, region: d.region,
  }));

  // Correlation over time (postcode-level for statistical power)
  const correlationTimeSeries = useMemo(() => {
    return TAX_YEARS.map((fy) => {
      const taxData = TAX_REVENUE_DATA.filter((d) => d.financialYear === fy);
      const matched = taxData.filter((d) => welfareMap.has(d.postcode) && d.individuals > 100);

      const incomes = matched.map((d) => d.taxableIncome / d.individuals);
      const welfareRates = matched.map((d) => {
        const w = welfareMap.get(d.postcode)!;
        return w.totalRecipients / d.individuals;
      });
      const jobseekerRates = matched.map((d) => {
        const w = welfareMap.get(d.postcode)!;
        return (w.payments["JobSeeker Payment"] || 0) / d.individuals;
      });

      return {
        year: fy,
        "Income vs Welfare Rate": Math.round(pearsonCorrelation(incomes, welfareRates) * 1000) / 1000,
        "Income vs JobSeeker Rate": Math.round(pearsonCorrelation(incomes, jobseekerRates) * 1000) / 1000,
      };
    });
  }, [welfareMap]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Deep Correlation Analysis</h1>
        <p className="text-slate-400 text-sm mt-1">
          Each dot = one Victorian region (aggregated from postcodes). Hover for details.
        </p>
      </div>

      <YearSlider year={yearIdx} onChange={setYearIdx} min={0} max={TAX_YEARS.length - 1} labels={TAX_YEARS} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ScatterPlot
          data={incomeVsWelfareRate}
          xLabel="Avg Income ($K)"
          yLabel="Welfare Recipients / 10 Taxpayers"
          title={`Income vs Welfare Dependency (${year})`}
        />
        <ScatterPlot
          data={taxPerCapitaVsWelfareRate}
          xLabel="Tax Paid Per Taxpayer ($)"
          yLabel="Welfare Recipients / 10 Taxpayers"
          title={`Tax Per Capita vs Welfare Rate (${year})`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ScatterPlot
          data={incomeVsJobseeker}
          xLabel="Avg Income ($K)"
          yLabel="JobSeeker per 10 Taxpayers"
          title={`Income vs JobSeeker Rate (${year})`}
        />
        <ScatterPlot
          data={incomeVsAgePension}
          xLabel="Avg Income ($K)"
          yLabel="Age Pension per 10 Taxpayers"
          title={`Income vs Age Pension Rate (${year})`}
        />
      </div>

      <ScatterPlot
        data={govtPaymentsVsTax}
        xLabel="Tax Paid ($M)"
        yLabel="Govt Payments Received ($M)"
        title={`Tax Paid vs Government Payments Received — ATO data (${year})`}
      />

      <TimeSeriesChart
        data={correlationTimeSeries}
        lines={[
          { key: "Income vs Welfare Rate", color: "#f472b6", name: "Income vs Welfare Rate" },
          { key: "Income vs JobSeeker Rate", color: "#fbbf24", name: "Income vs JobSeeker Rate" },
        ]}
        title="Correlation Coefficients Over Time (postcode-level, DSS welfare snapshot)"
        yLabel="r"
      />

      <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
        <h3 className="text-sm font-medium text-slate-300 mb-2">Methodology</h3>
        <div className="text-xs text-slate-400 space-y-1">
          <p>Scatter plots aggregate postcodes into regions for readability. Correlation coefficients use postcode-level data for statistical power.</p>
          <p><strong>Welfare rate</strong> = DSS recipients / ATO taxpayers. The correlation time series uses ATO income data per year against the DSS March 2025 snapshot.</p>
        </div>
      </div>
    </div>
  );
}
