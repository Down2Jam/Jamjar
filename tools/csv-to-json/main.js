import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import Papa from "papaparse";

// Needed because __dirname is not available in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// CSV input file path
const csvFilePath = path.join(__dirname, "Localization.csv");

// Output folder
const outputDir = path.join(__dirname, "../../src/messages");
await mkdir(outputDir, { recursive: true });

// Read and parse the CSV
const csv = await readFile(csvFilePath, "utf8");
const { data } = Papa.parse(csv, { header: true });
const fields = Object.keys(data[0] ?? {});

// Papa can stop seeing appended rows when an older multiline cell is malformed.
// AppStrings rows are generated as single-line CSV rows, so recover them here.
const existingKeys = new Set(data.map((row) => row.key).filter(Boolean));
for (const line of csv.split(/\r?\n/)) {
  if (!line.startsWith("AppStrings.")) continue;
  const parsed = Papa.parse(line, { header: false }).data?.[0];
  if (!Array.isArray(parsed) || !parsed[0] || existingKeys.has(parsed[0])) {
    continue;
  }

  const row = {};
  fields.forEach((field, index) => {
    row[field] = parsed[index] ?? "";
  });
  data.push(row);
  existingKeys.add(row.key);
}

// Extract languages
const languages = fields.filter((col) => col !== "key");

// Helper to build nested JSON from dot-separated keys
function buildNested(flatEntries) {
  const nested = {};
  for (const [flatKey, value] of Object.entries(flatEntries)) {
    const parts = flatKey.split(".");
    let cur = nested;
    for (let i = 0; i < parts.length - 1; i++) {
      cur = cur[parts[i]] ??= {};
    }
    cur[parts[parts.length - 1]] = value;
  }
  return nested;
}

// Calculate total English keys
const englishKeyCount = data.filter((row) => row.key && row.en?.trim()).length;

// Coverage info
const coverage = {};

for (const lang of languages) {
  const flat = {};
  let translatedCount = 0;

  for (const row of data) {
    if (!row.key) continue;

    const value = row[lang]?.trim();
    if (value) {
      flat[row.key] = value;
      translatedCount++;
    }
  }

  const json = buildNested(flat);
  const filename = `${lang}.json`;
  const filepath = path.join(outputDir, filename);

  await writeFile(filepath, JSON.stringify(json, null, 2), "utf8");
  console.log(`Wrote ${filename}`);

  const percent =
    englishKeyCount > 0 ? (translatedCount / englishKeyCount) * 100 : 0;
  coverage[lang] = Math.round(percent);
}

// Write coverage.json
const coveragePath = path.join(outputDir, "coverage.json");
await writeFile(coveragePath, JSON.stringify(coverage, null, 2), "utf8");
console.log("Wrote coverage.json");
