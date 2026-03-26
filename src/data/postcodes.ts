// Victorian postcode region mapping
// Maps 3xxx postcodes to broad regions for grouping in charts

export function getRegion(postcode: string): string {
  const pc = parseInt(postcode);
  if (pc >= 3000 && pc <= 3008) return "CBD & Docklands";
  if (pc >= 3009 && pc <= 3030) return "Western Melbourne";
  if (pc >= 3031 && pc <= 3044) return "Inner North West";
  if (pc >= 3045 && pc <= 3049) return "Outer North West";
  if (pc >= 3050 && pc <= 3068) return "Inner Melbourne";
  if (pc >= 3069 && pc <= 3079) return "Inner North East";
  if (pc >= 3080 && pc <= 3099) return "North East Melbourne";
  if (pc >= 3100 && pc <= 3120) return "Eastern Melbourne";
  if (pc >= 3121 && pc <= 3146) return "Inner East & South East";
  if (pc >= 3147 && pc <= 3180) return "Outer East";
  if (pc >= 3181 && pc <= 3207) return "Bayside & Inner South";
  if (pc >= 3210 && pc <= 3249) return "Geelong & Surf Coast";
  if (pc >= 3250 && pc <= 3349) return "Western Victoria";
  if (pc >= 3350 && pc <= 3399) return "Ballarat & Central Highlands";
  if (pc >= 3400 && pc <= 3499) return "Wimmera & Mallee";
  if (pc >= 3500 && pc <= 3549) return "Sunraysia & Murray";
  if (pc >= 3550 && pc <= 3599) return "Bendigo & Loddon";
  if (pc >= 3600 && pc <= 3649) return "Goulburn Valley";
  if (pc >= 3650 && pc <= 3699) return "North East Victoria";
  if (pc >= 3700 && pc <= 3799) return "Outer North Melbourne";
  if (pc >= 3800 && pc <= 3815) return "South East Melbourne";
  if (pc >= 3816 && pc <= 3899) return "Gippsland";
  if (pc >= 3900 && pc <= 3949) return "Mornington Peninsula";
  if (pc >= 3950 && pc <= 3999) return "South East Growth Corridor";
  return "Other VIC";
}

export const REGIONS = [
  "CBD & Docklands", "Inner Melbourne", "Inner North West", "Inner North East",
  "Inner East & South East", "Bayside & Inner South", "Western Melbourne",
  "Outer North West", "North East Melbourne", "Eastern Melbourne", "Outer East",
  "Outer North Melbourne", "South East Melbourne", "South East Growth Corridor",
  "Mornington Peninsula", "Geelong & Surf Coast", "Ballarat & Central Highlands",
  "Bendigo & Loddon", "Goulburn Valley", "North East Victoria",
  "Gippsland", "Western Victoria", "Wimmera & Mallee", "Sunraysia & Murray",
];
