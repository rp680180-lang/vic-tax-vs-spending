"use client";

import { useState, useMemo } from "react";
import { TAX_REVENUE_DATA, TAX_YEARS } from "@/data/tax-revenue";
import { WELFARE_DATA, estimateWelfareCost } from "@/data/welfare-spending";
import { getRegion } from "@/data/postcodes";
import { pearsonCorrelation } from "@/lib/analysis";
import ScatterPlot from "@/components/ScatterPlot";
import TimeSeriesChart from "@/components/TimeSeriesChart";
import YearSlider from "@/components/YearSlider";

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

  // Income vs welfare dependency rate
  const incomeVsWelfareRate = useMemo(() => {
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
  }, [yearTax, welfareMap]);

  // Tax paid vs estimated welfare cost
  const taxVsWelfareCost = useMemo(() => {
    return yearTax
      .filter((d) => welfareMap.has(d.postcode) && d.taxPaid > 0)
      .map((d) => {
        const w = welfareMap.get(d.postcode)!;
        return {
          x: d.taxPaid / 1e6,
          y: estimateWelfareCost(w) / 1e6,
          label: d.postcode,
          region: getRegion(d.postcode),
        };
      });
  }, [yearTax, welfareMap]);

  // Income vs JobSeeker rate
  const incomeVsJobseeker = useMemo(() => {
    return yearTax
      .filter((d) => welfareMap.has(d.postcode) && d.individuals > 100)
      .map((d) => {
        const w = welfareMap.get(d.postcode)!;
        const jobseeker = w.payments["JobSeeker Payment"] || 0;
        return {
          x: d.medianTaxableIncome / 1000,
          y: Math.round(jobseeker / d.individuals * 1000) / 10,
          label: d.postcode,
          region: getRegion(d.postcode),
        };
      });
  }, [yearTax, welfareMap]);

  // Income vs Age Pension rate
  const incomeVsAgePension = useMemo(() => {
    return yearTax
      .filter((d) => welfareMap.has(d.postcode) && d.individuals > 100)
      .map((d) => {
        const w = welfareMap.get(d.postcode)!;
        const agePension = w.payments["Age Pension"] || 0;
        return {
          x: d.medianTaxableIncome / 1000,
          y: Math.round(agePension / d.individuals * 1000) / 10,
          label: d.postcode,
          region: getRegion(d.postcode),
        };
      });
  }, [yearTax, welfareMap]);

  // Govt allowances received vs tax paid (both from ATO)
  const govtPaymentsVsTax = useMemo(() => {
    return yearTax
      .filter((d) => d.individuals > 100 && d.govtAllowances + d.govtPensions > 0)
      .map((d) => ({
        x: d.taxPaid / 1e6,
        y: (d.govtAllowances + d.govtPensions) / 1e6,
        label: d.postcode,
        region: getRegion(d.postcode),
      }));
  }, [yearTax]);

  // Correlation over time
  const correlationTimeSeries = useMemo(() => {
    return TAX_YEARS.map((fy) => {
      const taxData = TAX_REVENUE_DATA.filter((d) => d.financialYear === fy);
      const matched = taxData.filter((d) => welfareMap.has(d.postcode) && d.individuals > 100);

      const incomes = matched.map((d) => d.medianTaxableIncome);
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
          Statistical relationships between income, tax, and welfare across Victorian postcodes.
        </p>
      </div>

      <YearSlider year={yearIdx} onChange={setYearIdx} min={0} max={TAX_YEARS.length - 1} labels={TAX_YEARS} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ScatterPlot
          data={incomeVsWelfareRate}
          xLabel="Avg Taxable Income ($K)"
          yLabel="Welfare Recipients per 10 Taxpayers"
          title={`Income vs Welfare Dependency Rate (${year})`}
        />
        <ScatterPlot
          data={taxVsWelfareCost}
          xLabel="Tax Paid ($M)"
          yLabel="Est. Welfare Cost ($M)"
          title={`Tax Paid vs Estimated Welfare Cost (${year})`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ScatterPlot
          data={incomeVsJobseeker}
          xLabel="Avg Taxable Income ($K)"
          yLabel="JobSeeker per 10 Taxpayers"
          title={`Income vs JobSeeker Rate (${year})`}
        />
        <ScatterPlot
          data={incomeVsAgePension}
          xLabel="Avg Taxable Income ($K)"
          yLabel="Age Pension per 10 Taxpayers"
          title={`Income vs Age Pension Rate (${year})`}
        />
      </div>

      <ScatterPlot
        data={govtPaymentsVsTax}
        xLabel="Tax Paid ($M)"
        yLabel="Govt Allowances + Pensions ($M)"
        title={`Tax Paid vs Government Payments Received — ATO data (${year})`}
      />

      <TimeSeriesChart
        data={correlationTimeSeries}
        lines={[
          { key: "Income vs Welfare Rate", color: "#f472b6", name: "Income vs Welfare Rate" },
          { key: "Income vs JobSeeker Rate", color: "#fbbf24", name: "Income vs JobSeeker Rate" },
        ]}
        title="Correlation Coefficients Over Time (using ATO income data per year, DSS welfare snapshot)"
        yLabel="r"
      />

      <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
        <h3 className="text-sm font-medium text-slate-300 mb-2">Methodology Notes</h3>
        <div className="text-xs text-slate-400 space-y-1">
          <p><strong>Income data:</strong> Changes per year (ATO). <strong>Welfare data:</strong> Fixed March 2025 snapshot (DSS). The correlation over time chart shows how the relationship between income levels and welfare rates changes as incomes shift.</p>
          <p><strong>Welfare rate</strong> = DSS payment recipients / ATO taxpayers in same postcode. This understates the true rate since DSS counts include non-taxpayers.</p>
          <p><strong>Estimated cost</strong> uses standard 2024-25 payment rates. Actual costs vary by individual assessment.</p>
        </div>
      </div>
    </div>
  );
}
