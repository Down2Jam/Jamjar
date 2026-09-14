import assert from "node:assert/strict";
import { test } from "node:test";
import { getPlayableSandbox } from "../src/helpers/playableSandbox.ts";

test("authorization tabs escape the sandbox while the game cannot navigate its parent", () => {
  for (const url of ["https://play.d2jam.com/game-builds/id/index.html", "/game-builds/id/index.html"]) {
    const permissions = getPlayableSandbox(url, "https://d2jam.com").split(" ");
    assert.ok(permissions.includes("allow-popups"));
    assert.ok(permissions.includes("allow-popups-to-escape-sandbox"));
    assert.ok(!permissions.includes("allow-top-navigation"));
    assert.ok(!permissions.includes("allow-top-navigation-by-user-activation"));
    assert.ok(!permissions.includes("allow-forms"));
  }
});

test("workers are enabled only for a separate HTTPS game origin", () => {
  const parent = "https://d2jam.com";
  assert.match(getPlayableSandbox("https://play.d2jam.com/game-builds/id/index.html", parent), /allow-same-origin/);
  for (const url of ["/game-builds/id/index.html", `${parent}/game-builds/id/index.html`, "http://play.d2jam.com/game-builds/id/index.html", "data:text/html,hello"]) {
    assert.doesNotMatch(getPlayableSandbox(url, parent), /allow-same-origin/);
  }
});

