// Federal government spending allocated to Victorian postcodes
// Categories: Medicare/Health, Welfare/Social Services, Education, Defence, Infrastructure
// Modelled on Commonwealth Budget Papers and Grants Connect data patterns
// Figures in $millions per postcode per year

import { VICTORIAN_POSTCODES } from "./postcodes";

export interface FederalSpendingEntry {
  postcode: string;
  year: number;
  medicare: number;
  welfare: number;
  education: number;
  infrastructure: number;
  other: number;
  total: number;
}

// Spending profiles by region — lower income areas receive more welfare,
// higher population areas get more infrastructure
const SPENDING_PROFILES: Record<string, {
  medicarePerCapita: number;
  welfarePerCapita: number;
  educationPerCapita: number;
  infraPerCapita: number;
  otherPerCapita: number;
}> = {
  "Inner Melbourne":       { medicarePerCapita: 2800, welfarePerCapita: 2200, educationPerCapita: 1800, infraPerCapita: 1200, otherPerCapita: 600 },
  "Inner East":            { medicarePerCapita: 3200, welfarePerCapita: 1400, educationPerCapita: 2200, infraPerCapita: 800,  otherPerCapita: 500 },
  "Inner North":           { medicarePerCapita: 2600, welfarePerCapita: 2400, educationPerCapita: 1900, infraPerCapita: 900,  otherPerCapita: 550 },
  "Inner South East":      { medicarePerCapita: 3100, welfarePerCapita: 1600, educationPerCapita: 2100, infraPerCapita: 750,  otherPerCapita: 480 },
  "Western Melbourne":     { medicarePerCapita: 2400, welfarePerCapita: 3800, educationPerCapita: 2000, infraPerCapita: 1500, otherPerCapita: 700 },
  "Northern Melbourne":    { medicarePerCapita: 2500, welfarePerCapita: 3500, educationPerCapita: 2100, infraPerCapita: 1400, otherPerCapita: 650 },
  "Eastern Melbourne":     { medicarePerCapita: 3000, welfarePerCapita: 1800, educationPerCapita: 2000, infraPerCapita: 900,  otherPerCapita: 500 },
  "Outer East":            { medicarePerCapita: 2700, welfarePerCapita: 2200, educationPerCapita: 1900, infraPerCapita: 1100, otherPerCapita: 550 },
  "South East Melbourne":  { medicarePerCapita: 2500, welfarePerCapita: 3200, educationPerCapita: 2000, infraPerCapita: 1300, otherPerCapita: 650 },
  "Bayside":               { medicarePerCapita: 3300, welfarePerCapita: 1200, educationPerCapita: 2300, infraPerCapita: 700,  otherPerCapita: 450 },
  "Mornington Peninsula":  { medicarePerCapita: 3000, welfarePerCapita: 2600, educationPerCapita: 1800, infraPerCapita: 900,  otherPerCapita: 550 },
  "Geelong":               { medicarePerCapita: 2800, welfarePerCapita: 3000, educationPerCapita: 1900, infraPerCapita: 1200, otherPerCapita: 600 },
  "Ballarat":              { medicarePerCapita: 2700, welfarePerCapita: 3200, educationPerCapita: 1800, infraPerCapita: 1100, otherPerCapita: 600 },
  "Bendigo":               { medicarePerCapita: 2700, welfarePerCapita: 3100, educationPerCapita: 1800, infraPerCapita: 1100, otherPerCapita: 600 },
  "Goulburn Valley":       { medicarePerCapita: 2500, welfarePerCapita: 3600, educationPerCapita: 1700, infraPerCapita: 1000, otherPerCapita: 650 },
  "Gippsland":             { medicarePerCapita: 2600, welfarePerCapita: 3500, educationPerCapita: 1700, infraPerCapita: 1200, otherPerCapita: 650 },
  "East Gippsland":        { medicarePerCapita: 2800, welfarePerCapita: 3800, educationPerCapita: 1600, infraPerCapita: 800,  otherPerCapita: 700 },
  "North East":            { medicarePerCapita: 2600, welfarePerCapita: 3200, educationPerCapita: 1700, infraPerCapita: 900,  otherPerCapita: 600 },
  "Wimmera":               { medicarePerCapita: 2700, welfarePerCapita: 3500, educationPerCapita: 1600, infraPerCapita: 800,  otherPerCapita: 700 },
  "Sunraysia":             { medicarePerCapita: 2500, welfarePerCapita: 3700, educationPerCapita: 1600, infraPerCapita: 900,  otherPerCapita: 700 },
};

const YEAR_FACTORS: Record<number, number> = {
  2014: 1.000,
  2015: 1.030,
  2016: 1.055,
  2017: 1.080,
  2018: 1.110,
  2019: 1.140,
  2020: 1.250, // COVID spending surge
  2021: 1.280,
  2022: 1.220, // Post-COVID normalisation
  2023: 1.260,
};

function seededRandom(seed: number): number {
  const x = Math.sin(seed * 0.7) * 10000;
  return x - Math.floor(x);
}

export function generateFederalSpendingData(): FederalSpendingEntry[] {
  const data: FederalSpendingEntry[] = [];

  for (const pc of VICTORIAN_POSTCODES) {
    const profile = SPENDING_PROFILES[pc.region] || SPENDING_PROFILES["Inner Melbourne"];
    const seed = parseInt(pc.postcode) * 3;
    const pop = pc.population2021;

    for (let year = 2014; year <= 2023; year++) {
      const factor = YEAR_FACTORS[year];
      const noise = 0.90 + seededRandom(seed + year) * 0.20;
      const popGrowth = 1 + (year - 2014) * 0.012;

      const medicare = Math.round(pop * popGrowth * profile.medicarePerCapita * factor * noise / 1_000_000 * 10) / 10;
      const welfare = Math.round(pop * popGrowth * profile.welfarePerCapita * factor * noise / 1_000_000 * 10) / 10;
      const education = Math.round(pop * popGrowth * profile.educationPerCapita * factor * noise / 1_000_000 * 10) / 10;
      const infrastructure = Math.round(pop * popGrowth * profile.infraPerCapita * factor * (0.5 + seededRandom(seed + year * 2) * 1.0) / 1_000_000 * 10) / 10;
      const other = Math.round(pop * popGrowth * profile.otherPerCapita * factor * noise / 1_000_000 * 10) / 10;
      const total = Math.round((medicare + welfare + education + infrastructure + other) * 10) / 10;

      data.push({ postcode: pc.postcode, year, medicare, welfare, education, infrastructure, other, total });
    }
  }

  return data;
}

export const FEDERAL_SPENDING_DATA = generateFederalSpendingData();
