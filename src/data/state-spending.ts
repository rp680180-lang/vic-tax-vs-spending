// Victorian State Government spending allocated to postcodes
// Categories: Health, Education, Transport, Police/Emergency, Housing, Other
// Modelled on Victorian Budget Papers and DHHS/DET allocation patterns
// Figures in $millions per postcode per year

import { VICTORIAN_POSTCODES } from "./postcodes";

export interface StateSpendingEntry {
  postcode: string;
  year: number;
  health: number;
  education: number;
  transport: number;
  policeEmergency: number;
  housing: number;
  other: number;
  total: number;
}

const STATE_PROFILES: Record<string, {
  healthPerCapita: number;
  educationPerCapita: number;
  transportPerCapita: number;
  policePerCapita: number;
  housingPerCapita: number;
  otherPerCapita: number;
}> = {
  "Inner Melbourne":       { healthPerCapita: 2200, educationPerCapita: 1600, transportPerCapita: 2500, policePerCapita: 600, housingPerCapita: 800,  otherPerCapita: 500 },
  "Inner East":            { healthPerCapita: 2400, educationPerCapita: 1800, transportPerCapita: 1800, policePerCapita: 400, housingPerCapita: 300,  otherPerCapita: 400 },
  "Inner North":           { healthPerCapita: 2100, educationPerCapita: 1700, transportPerCapita: 2000, policePerCapita: 550, housingPerCapita: 700,  otherPerCapita: 450 },
  "Inner South East":      { healthPerCapita: 2300, educationPerCapita: 1700, transportPerCapita: 1600, policePerCapita: 420, housingPerCapita: 350,  otherPerCapita: 400 },
  "Western Melbourne":     { healthPerCapita: 2000, educationPerCapita: 2000, transportPerCapita: 2200, policePerCapita: 700, housingPerCapita: 1200, otherPerCapita: 600 },
  "Northern Melbourne":    { healthPerCapita: 2000, educationPerCapita: 2000, transportPerCapita: 2000, policePerCapita: 680, housingPerCapita: 1100, otherPerCapita: 580 },
  "Eastern Melbourne":     { healthPerCapita: 2300, educationPerCapita: 1700, transportPerCapita: 1500, policePerCapita: 450, housingPerCapita: 350,  otherPerCapita: 420 },
  "Outer East":            { healthPerCapita: 2100, educationPerCapita: 1800, transportPerCapita: 1600, policePerCapita: 500, housingPerCapita: 500,  otherPerCapita: 450 },
  "South East Melbourne":  { healthPerCapita: 2000, educationPerCapita: 1900, transportPerCapita: 1800, policePerCapita: 650, housingPerCapita: 900,  otherPerCapita: 550 },
  "Bayside":               { healthPerCapita: 2500, educationPerCapita: 1800, transportPerCapita: 1400, policePerCapita: 380, housingPerCapita: 200,  otherPerCapita: 380 },
  "Mornington Peninsula":  { healthPerCapita: 2300, educationPerCapita: 1700, transportPerCapita: 1200, policePerCapita: 520, housingPerCapita: 600,  otherPerCapita: 480 },
  "Geelong":               { healthPerCapita: 2200, educationPerCapita: 1800, transportPerCapita: 1800, policePerCapita: 580, housingPerCapita: 800,  otherPerCapita: 520 },
  "Ballarat":              { healthPerCapita: 2100, educationPerCapita: 1800, transportPerCapita: 1400, policePerCapita: 560, housingPerCapita: 850,  otherPerCapita: 520 },
  "Bendigo":               { healthPerCapita: 2100, educationPerCapita: 1800, transportPerCapita: 1400, policePerCapita: 550, housingPerCapita: 800,  otherPerCapita: 500 },
  "Goulburn Valley":       { healthPerCapita: 2000, educationPerCapita: 1700, transportPerCapita: 1200, policePerCapita: 540, housingPerCapita: 900,  otherPerCapita: 550 },
  "Gippsland":             { healthPerCapita: 2100, educationPerCapita: 1700, transportPerCapita: 1300, policePerCapita: 560, housingPerCapita: 850,  otherPerCapita: 550 },
  "East Gippsland":        { healthPerCapita: 2200, educationPerCapita: 1600, transportPerCapita: 1000, policePerCapita: 580, housingPerCapita: 900,  otherPerCapita: 600 },
  "North East":            { healthPerCapita: 2100, educationPerCapita: 1700, transportPerCapita: 1200, policePerCapita: 540, housingPerCapita: 800,  otherPerCapita: 520 },
  "Wimmera":               { healthPerCapita: 2200, educationPerCapita: 1600, transportPerCapita: 1000, policePerCapita: 560, housingPerCapita: 900,  otherPerCapita: 600 },
  "Sunraysia":             { healthPerCapita: 2100, educationPerCapita: 1600, transportPerCapita: 1100, policePerCapita: 570, housingPerCapita: 950,  otherPerCapita: 620 },
};

const STATE_YEAR_FACTORS: Record<number, number> = {
  2014: 1.000,
  2015: 1.035,
  2016: 1.065,
  2017: 1.100,
  2018: 1.140,
  2019: 1.175,
  2020: 1.310, // COVID health spending
  2021: 1.350,
  2022: 1.300,
  2023: 1.340,
};

function seededRandom(seed: number): number {
  const x = Math.sin(seed * 1.3) * 10000;
  return x - Math.floor(x);
}

export function generateStateSpendingData(): StateSpendingEntry[] {
  const data: StateSpendingEntry[] = [];

  for (const pc of VICTORIAN_POSTCODES) {
    const profile = STATE_PROFILES[pc.region] || STATE_PROFILES["Inner Melbourne"];
    const seed = parseInt(pc.postcode) * 7;
    const pop = pc.population2021;

    for (let year = 2014; year <= 2023; year++) {
      const factor = STATE_YEAR_FACTORS[year];
      const noise = 0.88 + seededRandom(seed + year) * 0.24;
      const popGrowth = 1 + (year - 2014) * 0.014;

      const health = Math.round(pop * popGrowth * profile.healthPerCapita * factor * noise / 1_000_000 * 10) / 10;
      const education = Math.round(pop * popGrowth * profile.educationPerCapita * factor * noise / 1_000_000 * 10) / 10;
      const transport = Math.round(pop * popGrowth * profile.transportPerCapita * factor * (0.4 + seededRandom(seed + year * 3) * 1.2) / 1_000_000 * 10) / 10;
      const policeEmergency = Math.round(pop * popGrowth * profile.policePerCapita * factor * noise / 1_000_000 * 10) / 10;
      const housing = Math.round(pop * popGrowth * profile.housingPerCapita * factor * noise / 1_000_000 * 10) / 10;
      const other = Math.round(pop * popGrowth * profile.otherPerCapita * factor * noise / 1_000_000 * 10) / 10;
      const total = Math.round((health + education + transport + policeEmergency + housing + other) * 10) / 10;

      data.push({ postcode: pc.postcode, year, health, education, transport, policeEmergency, housing, other, total });
    }
  }

  return data;
}

export const STATE_SPENDING_DATA = generateStateSpendingData();
