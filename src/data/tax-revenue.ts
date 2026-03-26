// Real ATO Individual Tax Statistics by postcode (Table 6B)
// Source: data.gov.au - Taxation Statistics Postcode Data
// Years: 2014-15 to 2022-23

import rawData from "./real/ato-tax-by-postcode.json";

export interface TaxRevenueEntry {
  postcode: string;
  financialYear: string;
  individuals: number;
  taxableIncome: number;
  taxPaid: number;
  salaryWages: number;
  totalIncome: number;
  govtAllowances: number;
  govtPensions: number;
  medianTaxableIncome: number;
}

export const TAX_REVENUE_DATA: TaxRevenueEntry[] = rawData as TaxRevenueEntry[];

export const TAX_YEARS = [
  "2014-15", "2015-16", "2016-17", "2017-18",
  "2018-19", "2019-20", "2020-21", "2021-22", "2022-23",
];

export const TAX_POSTCODES = Array.from(new Set(TAX_REVENUE_DATA.map((d) => d.postcode))).sort();
