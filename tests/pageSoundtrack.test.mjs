import { test } from "node:test";
import assert from "node:assert/strict";
import { getPageSoundtrack } from "../src/helpers/pageSoundtrack.ts";

const jam = [{ id: 1, slug: "one", url: "one.mp3" }, { id: 2, slug: "two", url: "two.mp3" }];

test("post-jam soundtrack inherits original tracks without copies", () => {
  assert.deepEqual(getPageSoundtrack(jam, [], "POST_JAM"), jam.map((track) => ({ ...track, pageVersion: "JAM" })));
  assert.equal(jam[0].pageVersion, undefined);
});

test("post-jam versions replace only their matching track and new tracks are included", () => {
  const updated = { id: 3, slug: "one", url: "updated.mp3" };
  const added = { id: 4, slug: "three", url: "three.mp3" };
  assert.deepEqual(getPageSoundtrack(jam, [updated, added], "POST_JAM"), [
    { ...updated, pageVersion: "POST_JAM" },
    { ...jam[1], pageVersion: "JAM" },
    { ...added, pageVersion: "POST_JAM" },
  ]);
});

test("jam pages and editing without inheritance only include their own tracks", () => {
  assert.deepEqual(getPageSoundtrack(jam, jam, "JAM"), jam.map((track) => ({ ...track, pageVersion: "JAM" })));
  assert.deepEqual(getPageSoundtrack([], [], "POST_JAM"), []);
});
