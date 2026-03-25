// Tax revenue data by postcode (based on ATO Individual Tax Statistics patterns)
// Figures in $millions, representing total taxable income reported in the postcode
// Source pattern: ATO Taxation Statistics - Individual Tax Return data by postcode

import { VICTORIAN_POSTCODES } from "./postcodes";

export interface TaxRevenueEntry {
  postcode: string;
  year: number;
  totalTaxableIncome: number; // $millions
  medianTaxableIncome: number; // $ per individual
  totalTaxPaid: number; // $millions
  numberOfTaxpayers: number;
}

// Base profiles: median income and per-taxpayer tax by region type
// Modelled on real ATO data distributions
const PROFILES: Record<string, { medianIncome: number; taxRate: number; taxpayerRatio: number }> = {
  "Inner Melbourne": { medianIncome: 62000, taxRate: 0.23, taxpayerRatio: 0.65 },
  "Inner East": { medianIncome: 85000, taxRate: 0.28, taxpayerRatio: 0.55 },
  "Inner North": { medianIncome: 58000, taxRate: 0.21, taxpayerRatio: 0.60 },
  "Inner South East": { medianIncome: 72000, taxRate: 0.25, taxpayerRatio: 0.55 },
  "Western Melbourne": { medianIncome: 42000, taxRate: 0.16, taxpayerRatio: 0.52 },
  "Northern Melbourne": { medianIncome: 44000, taxRate: 0.17, taxpayerRatio: 0.54 },
  "Eastern Melbourne": { medianIncome: 65000, taxRate: 0.24, taxpayerRatio: 0.55 },
  "Outer East": { medianIncome: 55000, taxRate: 0.20, taxpayerRatio: 0.56 },
  "South East Melbourne": { medianIncome: 48000, taxRate: 0.18, taxpayerRatio: 0.55 },
  "Bayside": { medianIncome: 82000, taxRate: 0.27, taxpayerRatio: 0.52 },
  "Mornington Peninsula": { medianIncome: 50000, taxRate: 0.19, taxpayerRatio: 0.50 },
  "Geelong": { medianIncome: 48000, taxRate: 0.18, taxpayerRatio: 0.53 },
  "Ballarat": { medianIncome: 44000, taxRate: 0.16, taxpayerRatio: 0.52 },
  "Bendigo": { medianIncome: 45000, taxRate: 0.17, taxpayerRatio: 0.52 },
  "Goulburn Valley": { medianIncome: 40000, taxRate: 0.15, taxpayerRatio: 0.50 },
  "Gippsland": { medianIncome: 42000, taxRate: 0.16, taxpayerRatio: 0.50 },
  "East Gippsland": { medianIncome: 38000, taxRate: 0.14, taxpayerRatio: 0.48 },
  "North East": { medianIncome: 42000, taxRate: 0.16, taxpayerRatio: 0.50 },
  "Wimmera": { medianIncome: 38000, taxRate: 0.14, taxpayerRatio: 0.49 },
  "Sunraysia": { medianIncome: 36000, taxRate: 0.13, taxpayerRatio: 0.48 },
};

// Year-over-year growth factors (nominal wage growth + inflation)
const YEAR_GROWTH: Record<number, number> = {
  2014: 1.000,
  2015: 1.025,
  2016: 1.048,
  2017: 1.072,
  2018: 1.100,
  2019: 1.130,
  2020: 1.115, // COVID dip
  2021: 1.145,
  2022: 1.195,
  2023: 1.260,
};

function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

export function generateTaxRevenueData(): TaxRevenueEntry[] {
  const data: TaxRevenueEntry[] = [];

  for (const pc of VICTORIAN_POSTCODES) {
    const profile = PROFILES[pc.region] || PROFILES["Inner Melbourne"];
    const seed = parseInt(pc.postcode);

    for (let year = 2014; year <= 2023; year++) {
      const growth = YEAR_GROWTH[year];
      const noise = 0.92 + seededRandom(seed + year) * 0.16; // +/- 8% variation

      const medianTaxableIncome = Math.round(profile.medianIncome * growth * noise);
      const numberOfTaxpayers = Math.round(pc.population2021 * profile.taxpayerRatio * (0.9 + (year - 2014) * 0.015));
      const totalTaxableIncome = Math.round((medianTaxableIncome * numberOfTaxpayers) / 1_000_000 * 10) / 10;
      const totalTaxPaid = Math.round(totalTaxableIncome * profile.taxRate * 10) / 10;

      data.push({
        postcode: pc.postcode,
        year,
        totalTaxableIncome,
        medianTaxableIncome,
        totalTaxPaid,
        numberOfTaxpayers,
      });
    }
  }

  return data;
}

export const TAX_REVENUE_DATA = generateTaxRevenueData();
