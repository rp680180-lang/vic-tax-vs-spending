"use client";

import { useState, useMemo } from "react";
import { VICTORIAN_POSTCODES } from "@/data/postcodes";
import { TAX_REVENUE_DATA } from "@/data/tax-revenue";
import { FEDERAL_SPENDING_DATA } from "@/data/federal-spending";
import { STATE_SPENDING_DATA } from "@/data/state-spending";
import StatCard from "@/components/StatCard";
import TimeSeriesChart from "@/components/TimeSeriesChart";
import PostcodeMap from "@/components/PostcodeMap";
import YearSlider from "@/components/YearSlider";

export default function OverviewPage() {
  const [year, setYear] = useState(2023);

  const yearTax = useMemo(
    () => TAX_REVENUE_DATA.filter((d) => d.year === year),
    [year]
  );
  const yearFederal = useMemo(
    () => FEDERAL_SPENDING_DATA.filter((d) => d.year === year),
    [year]
  );
  const yearState = useMemo(
    () => STATE_SPENDING_DATA.filter((d) => d.year === year),
    [year]
  );

  const totalTax = yearTax.reduce((sum, d) => sum + d.totalTaxPaid, 0);
  const totalFederal = yearFederal.reduce((sum, d) => sum + d.total, 0);
  const totalState = yearState.reduce((sum, d) => sum + d.total, 0);
  const totalSpending = totalFederal + totalState;
  const ratio = totalTax > 0 ? totalSpending / totalTax : 0;

  // Time series: aggregate by year
  const timeSeries = useMemo(() => {
    const years = Array.from({ length: 10 }, (_, i) => 2014 + i);
    return years.map((y) => {
      const tax = TAX_REVENUE_DATA.filter((d) => d.year === y).reduce((s, d) => s + d.totalTaxPaid, 0);
      const fed = FEDERAL_SPENDING_DATA.filter((d) => d.year === y).reduce((s, d) => s + d.total, 0);
      const state = STATE_SPENDING_DATA.filter((d) => d.year === y).reduce((s, d) => s + d.total, 0);
      return {
        year: y.toString(),
        "Tax Revenue": Math.round(tax),
        "Federal Spending": Math.round(fed),
        "State Spending": Math.round(state),
        "Total Spending": Math.round(fed + state),
      };
    });
  }, []);

  // Net position map (tax paid - total spending per postcode)
  const netPositionMap = useMemo(() => {
    return VICTORIAN_POSTCODES.map((pc) => {
      const tax = yearTax.find((d) => d.postcode === pc.postcode)?.totalTaxPaid || 0;
      const fed = yearFederal.find((d) => d.postcode === pc.postcode)?.total || 0;
      const state = yearState.find((d) => d.postcode === pc.postcode)?.total || 0;
      return {
        postcode: pc.postcode,
        value: tax - (fed + state),
        label: `${pc.suburb}: Net $${(tax - fed - state).toFixed(1)}M`,
      };
    });
  }, [yearTax, yearFederal, yearState]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Victoria: Tax vs Public Spending</h1>
        <p className="text-slate-400 text-sm mt-1">
          Analysing the relationship between tax revenue collected and government spending
          allocated across {VICTORIAN_POSTCODES.length} Victorian postcodes from 2014 to 2023.
        </p>
        <p className="text-slate-500 text-xs mt-2 italic">
          Data is modelled on ATO Taxation Statistics and Commonwealth/Victorian Budget Paper patterns.
          Figures are illustrative and should not be cited as official statistics.
        </p>
      </div>

      <YearSlider year={year} onChange={setYear} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Tax Paid"
          value={`$${(totalTax / 1000).toFixed(1)}B`}
          subtitle={`${year}`}
          trend="up"
          trendValue={year > 2014 ? `from ${2014}` : undefined}
        />
        <StatCard
          title="Federal Spending"
          value={`$${(totalFederal / 1000).toFixed(1)}B`}
          subtitle={`${year}`}
        />
        <StatCard
          title="State Spending"
          value={`$${(totalState / 1000).toFixed(1)}B`}
          subtitle={`${year}`}
        />
        <StatCard
          title="Spending / Tax Ratio"
          value={`${ratio.toFixed(2)}x`}
          subtitle={ratio > 1 ? "Spending > Tax" : "Tax > Spending"}
          trend={ratio > 1 ? "up" : "down"}
          trendValue={`${((ratio - 1) * 100).toFixed(0)}% ${ratio > 1 ? "surplus spend" : "surplus tax"}`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TimeSeriesChart
          data={timeSeries}
          lines={[
            { key: "Tax Revenue", color: "#60a5fa", name: "Tax Revenue" },
            { key: "Federal Spending", color: "#f472b6", name: "Federal Spending" },
            { key: "State Spending", color: "#34d399", name: "State Spending" },
          ]}
          title="Total Tax Revenue vs Government Spending (2014-2023)"
          yLabel="$M"
        />
        <PostcodeMap
          data={netPositionMap}
          colorScale="diverging"
          title={`Net Fiscal Position by Postcode (${year}) — Red = net receiver, Blue = net contributor`}
        />
      </div>

      <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
        <h3 className="text-sm font-medium text-slate-300 mb-2">About this analysis</h3>
        <div className="text-xs text-slate-400 space-y-1">
          <p>This dashboard explores the fiscal relationship between Victorian postcodes — how much tax is collected vs how much government spending flows back.</p>
          <p>Use the tabs above to explore <strong>Tax Revenue</strong>, <strong>Federal Spending</strong>, and <strong>State Spending</strong> separately, or visit <strong>Correlations</strong> to see statistical relationships.</p>
          <p>Key patterns to look for: Do high-income postcodes contribute disproportionately more in tax? Do lower-income areas receive more welfare spending? How did COVID-19 affect the balance?</p>
        </div>
      </div>
    </div>
  );
}
