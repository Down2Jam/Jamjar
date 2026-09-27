import { test } from "node:test";
import assert from "node:assert/strict";
import { getDefaultListingPageVersion, postJamFirst } from "../src/helpers/listingPageVersion.ts";

test("post-jam refinement and rating default to all versions on both listings", () => {
  assert.equal(getDefaultListingPageVersion("current", "current", "Post-Jam Rating"), "ALL");
  assert.equal(getDefaultListingPageVersion("current", "current", "Rating"), "JAM");
  assert.equal(getDefaultListingPageVersion("current", "current", "Post-Jam Refinement"), "ALL");
  assert.equal(getDefaultListingPageVersion("old", "current", "Post-Jam Rating"), "ALL");
});

test("post-jam first preserves selected ordering within each group and does not mutate input", () => {
  const entries = [{ id: 1, pageVersion: "JAM" }, { id: 2, pageVersion: "POST_JAM" }, { id: 3 }, { id: 4, pageVersion: "POST_JAM" }];
  assert.deepEqual(postJamFirst(entries, true).map((entry) => entry.id), [2, 4, 1, 3]);
  assert.deepEqual(postJamFirst(entries, false).map((entry) => entry.id), [1, 2, 3, 4]);
});
