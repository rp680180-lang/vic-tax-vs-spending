"use client";

import { useState, useMemo } from "react";
import { VICTORIAN_POSTCODES } from "@/data/postcodes";
import { TAX_REVENUE_DATA } from "@/data/tax-revenue";
import { FEDERAL_SPENDING_DATA } from "@/data/federal-spending";
import { STATE_SPENDING_DATA } from "@/data/state-spending";
import { pearsonCorrelation } from "@/lib/analysis";
import ScatterPlot from "@/components/ScatterPlot";
import TimeSeriesChart from "@/components/TimeSeriesChart";
import YearSlider from "@/components/YearSlider";

export default function CorrelationsPage() {
  const [year, setYear] = useState(2023);

  const yearTax = useMemo(() => TAX_REVENUE_DATA.filter((d) => d.year === year), [year]);
  const yearFed = useMemo(() => FEDERAL_SPENDING_DATA.filter((d) => d.year === year), [year]);
  const yearState = useMemo(() => STATE_SPENDING_DATA.filter((d) => d.year === year), [year]);

  // Scatter: Tax Paid vs Total Spending
  const taxVsSpending = useMemo(() => {
    return VICTORIAN_POSTCODES.map((pc) => {
      const tax = yearTax.find((d) => d.postcode === pc.postcode)?.totalTaxPaid || 0;
      const fed = yearFed.find((d) => d.postcode === pc.postcode)?.total || 0;
      const state = yearState.find((d) => d.postcode === pc.postcode)?.total || 0;
      return { x: tax, y: fed + state, label: `${pc.postcode} ${pc.suburb}`, region: pc.region };
    });
  }, [yearTax, yearFed, yearState]);

  // Scatter: Median Income vs Welfare Spending
  const incomeVsWelfare = useMemo(() => {
    return VICTORIAN_POSTCODES.map((pc) => {
      const taxD = yearTax.find((d) => d.postcode === pc.postcode);
      const fedD = yearFed.find((d) => d.postcode === pc.postcode);
      const stateD = yearState.find((d) => d.postcode === pc.postcode);
      const income = taxD ? taxD.medianTaxableIncome / 1000 : 0; // in $K
      const welfare = (fedD?.welfare || 0) + (stateD?.housing || 0);
      return { x: income, y: welfare, label: `${pc.postcode} ${pc.suburb}`, region: pc.region };
    });
  }, [yearTax, yearFed, yearState]);

  // Scatter: Tax Paid vs Federal Spending
  const taxVsFederal = useMemo(() => {
    return VICTORIAN_POSTCODES.map((pc) => {
      const tax = yearTax.find((d) => d.postcode === pc.postcode)?.totalTaxPaid || 0;
      const fed = yearFed.find((d) => d.postcode === pc.postcode)?.total || 0;
      return { x: tax, y: fed, label: `${pc.postcode} ${pc.suburb}`, region: pc.region };
    });
  }, [yearTax, yearFed]);

  // Scatter: Tax Paid vs State Spending
  const taxVsState = useMemo(() => {
    return VICTORIAN_POSTCODES.map((pc) => {
      const tax = yearTax.find((d) => d.postcode === pc.postcode)?.totalTaxPaid || 0;
      const state = yearState.find((d) => d.postcode === pc.postcode)?.total || 0;
      return { x: tax, y: state, label: `${pc.postcode} ${pc.suburb}`, region: pc.region };
    });
  }, [yearTax, yearState]);

  // Correlation matrix over time
  const correlationTimeSeries = useMemo(() => {
    const years = Array.from({ length: 10 }, (_, i) => 2014 + i);
    return years.map((y) => {
      const taxData = TAX_REVENUE_DATA.filter((d) => d.year === y);
      const fedData = FEDERAL_SPENDING_DATA.filter((d) => d.year === y);
      const stateData = STATE_SPENDING_DATA.filter((d) => d.year === y);

      const postcodes = VICTORIAN_POSTCODES.map((pc) => pc.postcode);

      const taxValues = postcodes.map((p) => taxData.find((d) => d.postcode === p)?.totalTaxPaid || 0);
      const fedValues = postcodes.map((p) => fedData.find((d) => d.postcode === p)?.total || 0);
      const stateValues = postcodes.map((p) => stateData.find((d) => d.postcode === p)?.total || 0);
      const totalSpendValues = postcodes.map((_, i) => fedValues[i] + stateValues[i]);
      const welfareValues = postcodes.map((p) => fedData.find((d) => d.postcode === p)?.welfare || 0);
      const medianIncomes = postcodes.map((p) => taxData.find((d) => d.postcode === p)?.medianTaxableIncome || 0);

      return {
        year: y.toString(),
        "Tax vs Total Spending": Math.round(pearsonCorrelation(taxValues, totalSpendValues) * 1000) / 1000,
        "Tax vs Federal": Math.round(pearsonCorrelation(taxValues, fedValues) * 1000) / 1000,
        "Tax vs State": Math.round(pearsonCorrelation(taxValues, stateValues) * 1000) / 1000,
        "Income vs Welfare": Math.round(pearsonCorrelation(medianIncomes, welfareValues) * 1000) / 1000,
      };
    });
  }, []);

  // Per-capita analysis
  const perCapitaData = useMemo(() => {
    return VICTORIAN_POSTCODES.map((pc) => {
      const tax = yearTax.find((d) => d.postcode === pc.postcode)?.totalTaxPaid || 0;
      const fed = yearFed.find((d) => d.postcode === pc.postcode)?.total || 0;
      const state = yearState.find((d) => d.postcode === pc.postcode)?.total || 0;
      const taxPerCapita = (tax * 1_000_000) / pc.population2021;
      const spendPerCapita = ((fed + state) * 1_000_000) / pc.population2021;
      return { x: taxPerCapita / 1000, y: spendPerCapita / 1000, label: `${pc.postcode} ${pc.suburb}`, region: pc.region };
    });
  }, [yearTax, yearFed, yearState]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Correlation Analysis</h1>
        <p className="text-slate-400 text-sm mt-1">
          Statistical relationships between tax revenue and public spending across Victorian postcodes.
        </p>
      </div>

      <YearSlider year={year} onChange={setYear} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ScatterPlot
          data={taxVsSpending}
          xLabel="Tax Paid ($M)"
          yLabel="Total Spending ($M)"
          title={`Tax Paid vs Total Government Spending (${year})`}
        />
        <ScatterPlot
          data={perCapitaData}
          xLabel="Tax Per Capita ($K)"
          yLabel="Spending Per Capita ($K)"
          title={`Per Capita: Tax Paid vs Spending Received (${year})`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ScatterPlot
          data={taxVsFederal}
          xLabel="Tax Paid ($M)"
          yLabel="Federal Spending ($M)"
          title={`Tax Paid vs Federal Spending (${year})`}
        />
        <ScatterPlot
          data={taxVsState}
          xLabel="Tax Paid ($M)"
          yLabel="State Spending ($M)"
          title={`Tax Paid vs State Spending (${year})`}
        />
      </div>

      <ScatterPlot
        data={incomeVsWelfare}
        xLabel="Median Income ($K)"
        yLabel="Welfare + Housing ($M)"
        title={`Median Income vs Welfare/Housing Spending (${year})`}
      />

      <TimeSeriesChart
        data={correlationTimeSeries}
        lines={[
          { key: "Tax vs Total Spending", color: "#60a5fa", name: "Tax vs Total Spending" },
          { key: "Tax vs Federal", color: "#f472b6", name: "Tax vs Federal" },
          { key: "Tax vs State", color: "#34d399", name: "Tax vs State" },
          { key: "Income vs Welfare", color: "#fbbf24", name: "Income vs Welfare" },
        ]}
        title="Pearson Correlation Coefficients Over Time (2014-2023)"
        yLabel="r"
      />

      <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
        <h3 className="text-sm font-medium text-slate-300 mb-2">Interpreting Correlations</h3>
        <div className="text-xs text-slate-400 space-y-1">
          <p><strong>r close to +1.0:</strong> Strong positive correlation — postcodes that pay more tax also receive more spending (often driven by population size).</p>
          <p><strong>r close to 0:</strong> No linear relationship between the variables.</p>
          <p><strong>r close to -1.0:</strong> Strong negative correlation — higher values of one variable associate with lower values of the other.</p>
          <p><strong>R² (R-squared):</strong> Proportion of variance in Y explained by X. Higher = better fit of the trend line.</p>
          <p className="mt-2 text-slate-500 italic">Per-capita analysis removes population effects and reveals whether wealthier postcodes receive proportionally more or less spending.</p>
        </div>
      </div>
    </div>
  );
}
