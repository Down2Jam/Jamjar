import { test } from "node:test";
import assert from "node:assert/strict";
import { compareResultCategories } from "../src/components/results/categoryOrder.ts";

test("Top-three placements lead, ties and remaining categories sort by stars", () => {
  const categories = [
    ["Audio", 2, 4.34], ["Overall", 2, 4.18],
    ["Gameplay", 3, 4.20], ["Graphics", 3, 4.27],
    ["Creativity", 9, 4.25], ["Emotional Delivery", 11, 3.50],
    ["Theme", 11, 4.09], ["Other", 4, 3.8],
  ].map(([name, placement, averageScore]) => ({ name, placement, averageScore }));
  assert.deepEqual(categories.sort(compareResultCategories).map((entry) => entry.name), [
    "Audio", "Overall", "Graphics", "Gameplay", "Creativity", "Theme", "Other", "Emotional Delivery",
  ]);
});
