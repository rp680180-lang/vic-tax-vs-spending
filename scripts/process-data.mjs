// Downloads and processes real ATO tax stats and DSS welfare payment data
// Outputs JSON files for the app to consume

import XLSX from "xlsx";
import { writeFileSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, "..", "src", "data", "real");
const CACHE_DIR = join(__dirname, "..", ".data-cache");

if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });
if (!existsSync(CACHE_DIR)) mkdirSync(CACHE_DIR, { recursive: true });

const ATO_FILES = [
  { year: "2014-15", url: "https://data.gov.au/data/dataset/5fa69f19-ec44-4c46-88eb-0f6fd5c2f43b/resource/a28d3f45-25fe-450e-bf59-f3a29c613327/download/taxstats2015individual06taxablestatusstateterritorypostcode.xlsx" },
  { year: "2015-16", url: "https://data.gov.au/data/dataset/5fa69f19-ec44-4c46-88eb-0f6fd5c2f43b/resource/31456a8b-7cd9-4f55-bdcb-2acbbb209bd0/download/taxstats2016individual06taxablestatusstateterritorypostcodetaxableincome.xlsx" },
  { year: "2016-17", url: "https://data.gov.au/data/dataset/5fa69f19-ec44-4c46-88eb-0f6fd5c2f43b/resource/a05364a6-b127-4c08-8edf-e6e96ec9e1be/download/ts17individual06taxablestatusstatepostcode.xlsx" },
  { year: "2017-18", url: "https://data.gov.au/data/dataset/5fa69f19-ec44-4c46-88eb-0f6fd5c2f43b/resource/b713d037-d9f5-49e5-a492-502cd7b3a15a/download/ts18individual06taxablestatusstatepostcode.xlsx" },
  { year: "2018-19", url: "https://data.gov.au/data/dataset/5fa69f19-ec44-4c46-88eb-0f6fd5c2f43b/resource/9129cf1e-8eb0-4c25-98e3-95fc2697267c/download/ts19individual06taxablestatusstateterritorypostcode.xlsx" },
  { year: "2019-20", url: "https://data.gov.au/data/dataset/5fa69f19-ec44-4c46-88eb-0f6fd5c2f43b/resource/d2eb3863-78c6-4afe-a348-83043df5aeab/download/ts20individual06taxablestatusstateterritorypostcode.xlsx" },
  { year: "2020-21", url: "https://data.gov.au/data/dataset/5fa69f19-ec44-4c46-88eb-0f6fd5c2f43b/resource/10c9ad1f-8cef-4ddd-838b-972c55b377ab/download/ts21individual06taxablestatusstateterritorypostcode.xlsx" },
  { year: "2021-22", url: "https://data.gov.au/data/dataset/5fa69f19-ec44-4c46-88eb-0f6fd5c2f43b/resource/00847743-8b5b-4d41-a15a-1a28cf00ea81/download/ts22individual06taxablestatusstatesa4postcode.xlsx" },
  { year: "2022-23", url: "https://data.gov.au/data/dataset/5fa69f19-ec44-4c46-88eb-0f6fd5c2f43b/resource/c92eeed8-2010-4f7f-94ab-e4bb6e324dde/download/ts23individual06taxablestatusstatesa4postcode.xlsx" },
];

// DSS quarterly snapshots — one per financial year end (June quarter)
const DSS_URL = "https://data.gov.au/data/dataset/cff2ae8a-55e4-47db-a66d-e177fe0ac6a0/resource/6de5b023-01b3-4562-b4a7-d7a4cc93df75/download/dss-demographics-march-2025-final.xlsx";

async function downloadFile(url, cacheFilename) {
  const cachePath = join(CACHE_DIR, cacheFilename);
  if (existsSync(cachePath)) {
    console.log(`  Cached: ${cacheFilename}`);
    return cachePath;
  }
  console.log(`  Downloading: ${cacheFilename}...`);
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Failed: ${resp.status} ${url}`);
  const buffer = Buffer.from(await resp.arrayBuffer());
  writeFileSync(cachePath, buffer);
  console.log(`  Saved (${(buffer.length / 1024 / 1024).toFixed(1)} MB)`);
  return cachePath;
}

function findHeaderAndCols(data) {
  // Scan rows 0-10 for the row with "Postcode" as a standalone cell
  for (let i = 0; i < Math.min(10, data.length); i++) {
    for (let j = 0; j < (data[i]?.length || 0); j++) {
      const val = String(data[i][j]).trim();
      if (val === "Postcode" || val === "Postcode ") {
        // This is the header row
        const headerRow = data[i];
        const cols = { postcode: j };

        // Find state column (the one before postcode, or col 0)
        for (let k = 0; k < headerRow.length; k++) {
          const h = String(headerRow[k]).toLowerCase().replace(/\r?\n/g, " ").trim();
          if (h.includes("state") && !h.includes("statistical")) cols.state = k;
        }

        // Map column indices by header text
        for (let k = 0; k < headerRow.length; k++) {
          const h = String(headerRow[k]).toLowerCase().replace(/\r?\n/g, " ").trim();
          if (/individuals.*no|number of individuals.*no/.test(h)) cols.individuals = k;
          if (/taxable income or loss.*\$/.test(h) && !cols.taxableIncome) cols.taxableIncome = k;
          if (/(net tax|net tax )\$/.test(h) || (h.includes("net tax") && h.includes("$") && !h.includes("business") && !h.includes("capital"))) cols.netTax = k;
          if (/^(gross tax|tax on taxable income).*\$/.test(h) && !cols.grossTax) cols.grossTax = k;
          if (/salary or wages.*\$/.test(h)) cols.salaryWages = k;
          if (/total income or loss.*\$/.test(h)) cols.totalIncome = k;
          if (/australian government allowances and payments.*\$/.test(h)) cols.govtAllowances = k;
          if (/australian government pensions and allowances.*\$/.test(h)) cols.govtPensions = k;
        }

        return { headerIdx: i, cols };
      }
    }
  }
  return null;
}

async function processATO() {
  console.log("\n=== Processing ATO Tax Statistics ===\n");
  const allData = [];

  for (const file of ATO_FILES) {
    const filename = `ato_${file.year.replace("-", "_")}.xlsx`;
    try {
      const path = await downloadFile(file.url, filename);
      const wb = XLSX.readFile(path);
      const sheetName = wb.SheetNames.find((s) => s.includes("6B")) || wb.SheetNames[wb.SheetNames.length - 1];
      const ws = wb.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });

      const result = findHeaderAndCols(data);
      if (!result) {
        console.log(`  WARNING: Could not find headers for ${file.year}`);
        continue;
      }

      const { headerIdx, cols } = result;
      // Use grossTax as fallback if netTax not available
      const taxCol = cols.netTax || cols.grossTax;

      console.log(`  ${file.year}: headerRow=${headerIdx}, hasTaxCol=${!!taxCol}, cols=${Object.keys(cols).join(",")}`);

      let vicCount = 0;
      for (let i = headerIdx + 1; i < data.length; i++) {
        const row = data[i];
        const state = String(row[cols.state] || "").toUpperCase().trim();
        if (state !== "VIC") continue;

        const postcode = String(row[cols.postcode] || "").trim();
        if (!postcode || postcode.length !== 4 || !postcode.startsWith("3")) continue;

        const individuals = Number(row[cols.individuals]) || 0;
        if (individuals === 0) continue;

        const entry = {
          postcode,
          financialYear: file.year,
          individuals,
          taxableIncome: Number(row[cols.taxableIncome]) || 0,
          taxPaid: Number(row[taxCol]) || 0,
          salaryWages: cols.salaryWages ? Number(row[cols.salaryWages]) || 0 : 0,
          totalIncome: cols.totalIncome ? Number(row[cols.totalIncome]) || 0 : 0,
          govtAllowances: cols.govtAllowances ? Number(row[cols.govtAllowances]) || 0 : 0,
          govtPensions: cols.govtPensions ? Number(row[cols.govtPensions]) || 0 : 0,
        };
        entry.medianTaxableIncome = Math.round(entry.taxableIncome / individuals);

        allData.push(entry);
        vicCount++;
      }
      console.log(`  ${file.year}: ${vicCount} VIC postcodes`);
    } catch (err) {
      console.error(`  ERROR ${file.year}:`, err.message);
    }
  }

  writeFileSync(join(OUT_DIR, "ato-tax-by-postcode.json"), JSON.stringify(allData));
  console.log(`\nATO: ${allData.length} records written`);
  return allData;
}

async function processDSS() {
  console.log("\n=== Processing DSS Welfare Payments ===\n");

  const path = await downloadFile(DSS_URL, "dss_march_2025.xlsx");
  const wb = XLSX.readFile(path);
  const ws = wb.Sheets["Postcode"];
  const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });

  // Find header row — look for "Postcode" as exact cell value (not part of a title)
  let headerIdx = -1;
  for (let i = 0; i < 10; i++) {
    const val = String(data[i]?.[0]).trim();
    if (val === "Postcode") {
      headerIdx = i;
      break;
    }
  }

  if (headerIdx < 0) {
    console.log("  Could not find DSS header row");
    return [];
  }

  const headers = data[headerIdx];
  console.log(`  Header row: ${headerIdx}, columns: ${headers.length}`);
  console.log(`  Payment types: ${headers.slice(1, 20).join(", ")}`);

  const allData = [];
  for (let i = headerIdx + 1; i < data.length; i++) {
    const row = data[i];
    const postcode = String(row[0]).trim();
    if (!postcode || postcode.length !== 4 || !postcode.startsWith("3")) continue;

    const entry = { postcode, payments: {} };
    let total = 0;
    for (let j = 1; j < headers.length; j++) {
      const paymentType = String(headers[j]).trim();
      const count = Number(row[j]) || 0;
      if (paymentType && count > 0) {
        entry.payments[paymentType] = count;
        total += count;
      }
    }
    entry.totalRecipients = total;
    if (total > 0) allData.push(entry);
  }

  writeFileSync(join(OUT_DIR, "dss-welfare-by-postcode.json"), JSON.stringify(allData));
  console.log(`\nDSS: ${allData.length} VIC postcodes written`);
  return allData;
}

async function main() {
  const taxData = await processATO();
  const dssData = await processDSS();

  const years = [...new Set(taxData.map((d) => d.financialYear))].sort();
  const postcodes = [...new Set(taxData.map((d) => d.postcode))];
  console.log(`\n=== Summary ===`);
  console.log(`Tax years: ${years.join(", ")}`);
  console.log(`Tax: ${postcodes.length} unique VIC postcodes, ${taxData.length} records`);
  console.log(`DSS: ${dssData.length} VIC postcodes (March 2025 snapshot)`);
}

main().catch(console.error);
