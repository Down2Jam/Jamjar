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

// Papa can stop seeing rows when an older multiline cell is malformed.
// Recover single-line dotted translation keys that were skipped.
const rowsByKey = new Map(data.map((row) => [row.key, row]).filter(([key]) => key));
const lines = csv.split(/\r?\n/);
const dottedKeyPattern = /^[A-Za-z][A-Za-z0-9]*(?:\.[A-Za-z0-9]+)+$/;
const knownKeys = new Set(rowsByKey.keys());

for (const line of lines) {
  const parsed = Papa.parse(line, { header: false }).data?.[0];
  const key = parsed?.[0] ?? "";
  if (dottedKeyPattern.test(key)) {
    knownKeys.add(key);
  }
}

for (const line of lines) {
  const parsed = Papa.parse(line, { header: false }).data?.[0];
  if (
    !Array.isArray(parsed) ||
    !dottedKeyPattern.test(parsed[0] ?? "")
  ) {
    continue;
  }

  const row = {};
  fields.forEach((field, index) => {
    row[field] = parsed[index] ?? "";
  });
  const existingRow = rowsByKey.get(row.key);
  const swallowedNextKey = Object.values(existingRow ?? {}).some(
    (value) => {
      if (typeof value !== "string") return false;
      if (/\n[A-Za-z][A-Za-z0-9]*(?:\.[A-Za-z0-9]+)+,/.test(value)) {
        return true;
      }
      return Array.from(
        value.matchAll(/\n([A-Za-z][A-Za-z0-9]*(?:\.[A-Za-z0-9]+)+)/g),
      ).some((match) => knownKeys.has(match[1]));
    },
  );
  if (!existingRow || swallowedNextKey) {
    rowsByKey.set(row.key, row);
  }
}
const rows = Array.from(rowsByKey.values());

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
const englishKeyCount = rows.filter((row) => row.key && row.en?.trim()).length;

// Coverage info
const coverage = {};

for (const lang of languages) {
  const flat = {};
  let translatedCount = 0;

  for (const row of rows) {
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
