// Real DSS Welfare Payment Recipients by postcode
// Source: data.gov.au - DSS Payment Demographic Data
// Snapshot: March 2025

import rawData from "./real/dss-welfare-by-postcode.json";

export interface WelfareEntry {
  postcode: string;
  payments: Record<string, number>;
  totalRecipients: number;
}

export const WELFARE_DATA: WelfareEntry[] = rawData as WelfareEntry[];

// Standard fortnightly payment rates (approximate, as of 2024-25) for cost estimation
const ANNUAL_RATES: Record<string, number> = {
  "Age Pension": 28900,
  "Disability Support Pension": 28900,
  "JobSeeker Payment": 21600,
  "Carer Payment": 28900,
  "Carer Allowance": 4400,
  "Parenting Payment Single": 25700,
  "Parenting Payment Partnered": 21600,
  "Youth Allowance (other)": 17300,
  "Youth Allowance (student and apprentice)": 17300,
  "Austudy": 17300,
  "ABSTUDY (Living allowance)": 17300,
  "Commonwealth Rent Assistance": 5200,
  "Family Tax Benefit A": 6800,
  "Family Tax Benefit B": 4400,
  "Special Benefit": 21600,
};

export function estimateWelfareCost(entry: WelfareEntry): number {
  let total = 0;
  for (const [payment, count] of Object.entries(entry.payments)) {
    const rate = ANNUAL_RATES[payment] || 0;
    total += count * rate;
  }
  return total;
}

export const WELFARE_POSTCODES = WELFARE_DATA.map((d) => d.postcode).sort();

// Major payment categories for charting
export const PAYMENT_CATEGORIES = [
  "Age Pension",
  "JobSeeker Payment",
  "Disability Support Pension",
  "Family Tax Benefit A",
  "Carer Payment",
  "Commonwealth Rent Assistance",
  "Youth Allowance (student and apprentice)",
  "Parenting Payment Single",
];
