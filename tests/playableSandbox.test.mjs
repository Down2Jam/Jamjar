import assert from "node:assert/strict";
import { test } from "node:test";
import { getPlayableSandbox } from "../src/helpers/playableSandbox.ts";

test("workers are enabled only for a separate HTTPS game origin", () => {
  const parent = "https://d2jam.com";
  assert.match(getPlayableSandbox("https://play.d2jam.com/game-builds/id/index.html", parent), /allow-same-origin/);
  for (const url of ["/game-builds/id/index.html", `${parent}/game-builds/id/index.html`, "http://play.d2jam.com/game-builds/id/index.html", "data:text/html,hello"]) {
    assert.doesNotMatch(getPlayableSandbox(url, parent), /allow-same-origin/);
  }
});

