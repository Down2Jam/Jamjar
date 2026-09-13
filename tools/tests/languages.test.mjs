import { test } from "node:test";
import assert from "node:assert/strict";
import { rankLanguages } from "../../src/lib/rankLanguages.ts";

test("English is first, then usage descending, then translation coverage descending", () => {
  const languages = ["fr", "it", "en", "de"].map((key) => ({ key }));
  const ranked = rankLanguages(languages, { fr: 10, it: 10, de: 20 }, { fr: 90, it: 95, en: 100, de: 0 });
  assert.deepEqual(ranked.map(({ key }) => key), ["en", "de", "it", "fr"]);
  assert.deepEqual(languages.map(({ key }) => key), ["fr", "it", "en", "de"]);
});

test("missing usage falls back to coverage with a stable final tie", () => {
  const ranked = rankLanguages(["tr", "fr", "it", "en"].map((key) => ({ key })), {}, { it: 35, tr: 35 });
  assert.deepEqual(ranked.map(({ key }) => key), ["en", "it", "tr", "fr"]);
  assert.equal(ranked[3].usageCount, 0);
  assert.equal(ranked[3].coverage, 0);
});
