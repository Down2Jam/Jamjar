import { test } from "node:test";
import assert from "node:assert/strict";
import { getUserGamesForJam } from "../src/components/recap/userGames.ts";

test("recap includes all published games for the selected jam without duplicates", () => {
  const first = { id: 1, jamId: 7, published: true };
  const second = { id: 2, jamId: 7, published: true };
  const user = { teams: [
    { game: first }, { game: second }, { game: first },
    { game: { id: 3, jamId: 6, published: true } },
    { game: { id: 4, jamId: 7, published: false } }, { game: null },
  ] };
  assert.deepEqual(getUserGamesForJam(user, 7), [first, second]);
  assert.deepEqual(getUserGamesForJam(null, 7), []);
});
