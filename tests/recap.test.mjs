import { test } from "node:test";
import assert from "node:assert/strict";
import { getJamRecapScores } from "../src/components/recap/scores.ts";

test("Game recap reads versioned jam ratings returned by the API", () => {
  const jamScores = { Audio: { placement: 3, averageScore: 9.2, averageUnrankedScore: 8.8 } };
  const postJamScores = { Audio: { placement: 1, averageScore: 10, averageUnrankedScore: 10 } };
  assert.deepEqual(getJamRecapScores({ jamScores, postJamScores }), jamScores);
  assert.deepEqual(getJamRecapScores({ jamScores, scores: postJamScores }), jamScores);
});

test("Game recap supports legacy scores without borrowing post-jam ratings", () => {
  const scores = { Overall: { placement: 4, averageScore: 8, averageUnrankedScore: 7 } };
  assert.deepEqual(getJamRecapScores({ scores }), scores);
  assert.deepEqual(getJamRecapScores({ jamScores: {}, scores }), {});
  assert.deepEqual(getJamRecapScores({ postJamScores: scores }), {});
  assert.deepEqual(getJamRecapScores(null), {});
});


import { pickRecapJamId } from "../src/components/recap/selection.ts";

test("Recap defaults to the current jam regardless of list order", () => {
  const jams = [{ id: 90, slug: "external" }, { id: 8, slug: "current" }];
  assert.equal(pickRecapJamId(null, jams, 8), 8);
  assert.equal(pickRecapJamId("", jams, 8), 8);
});

test("Recap respects explicit selections and falls back for invalid links", () => {
  const jams = [{ id: 8, slug: "current" }, { id: 7, slug: "previous" }];
  assert.equal(pickRecapJamId("previous", jams, 8), 7);
  assert.equal(pickRecapJamId("7", jams, 8), 7);
  assert.equal(pickRecapJamId("999", jams, 8), 8);
  assert.equal(pickRecapJamId("missing", jams, 8), 8);
  assert.equal(pickRecapJamId(null, jams, null), 8);
  assert.equal(pickRecapJamId(null, [], null), null);
});

import { tokenizeRecapWords } from "../src/components/recap/words.ts";

test("Recap preserves contractions and possessives across apostrophe styles", () => {
  assert.deepEqual(
    tokenizeRecapWords("didn't didn’t didn‘t didnʼt game's game’s"),
    ["didn't", "didn't", "didn't", "didn't", "game's", "game's"],
  );
  assert.deepEqual(
    tokenizeRecapWords("didn&#39;t didn&#x27;t didn&rsquo;t didn&apos;t didn&#8217;t"),
    Array(5).fill("didn't"),
  );
});

test("Recap word extraction still handles emoji and excludes URLs", () => {
  assert.deepEqual(
    tokenizeRecapWords("lovely :heart: :rincsclap: :happy-cat: https://example.com 'music'"),
    ["lovely", ":heart:", ":rincsclap:", ":happy-cat:", "music"],
  );
});

import { uniqueRecapWords, loadRecapComments } from "../src/components/recap/words.ts";

test("Each word counts once per comment, regardless of repetition or case", () => {
  const comments = ["Bananas bananas BANANAS", "bananas", "bananas bananas"];
  const count = comments.flatMap(uniqueRecapWords).filter((word) => word === "bananas").length;
  assert.equal(count, 3);
  assert.deepEqual(uniqueRecapWords("isn’t isn't :heart: :HEART:"), ["isn't", ":heart:"]);
});

test("Recap expands truncated replies and counts duplicate comment IDs once", async () => {
  const calls = [];
  const replies = new Map([
    [2, [{ id: 3, content: "third", children: [{ id: 4 }] }]],
    [3, [{ id: 4, content: "fourth" }]],
    [4, [{ id: 5, content: "fifth" }]],
    [5, []],
  ]);
  const root = { id: 1, content: "first", children: [{ id: 2, content: "second" }] };
  const result = await loadRecapComments([root, root], async (id) => {
    calls.push(id);
    return replies.get(id) ?? [];
  });
  assert.deepEqual(result.map((comment) => comment.content), ["first", "second", "third", "fourth", "fifth"]);
  assert.deepEqual(calls, [2, 3, 4, 5]);
});

test("Recap skips requests for comments whose replies are already known to be empty", async () => {
  const result = await loadRecapComments([
    { id: 1, content: "root", children: [{ id: 2, content: "reply", children: [] }] },
    { id: 3, content: "leaf", children: [] },
  ], async () => { assert.fail("Unexpected reply request for a known leaf"); });
  assert.deepEqual(result.map((comment) => comment.id).sort(), [1, 2, 3]);
});

test("Recap excludes removed threads and does not request local replies for remote IDs", async () => {
  const result = await loadRecapComments([
    { id: 1, content: "removed", removedAt: "today", children: [{ id: 2, content: "reply" }] },
    { id: "remote-3", content: "remote" },
  ], async () => { assert.fail("Unexpected reply request"); });
  assert.deepEqual(result.map((comment) => comment.content), ["remote"]);
});

import { getEarnedRecapScores } from "../src/components/recap/earnedScores.ts";

test("Earned scores use the best result per leaderboard in the selected jam", () => {
  const make = (id, board, type, data, jamId = 8) => ({
    id, data, leaderboard: { id: board, type, name: type, game: { jamId, name: "Game" } },
  });
  const scores = [
    make(1, 1, "SCORE", 10), make(2, 1, "SCORE", 20),
    make(3, 2, "GOLF", 10), make(4, 2, "GOLF", 20),
    make(5, 3, "SPEEDRUN", 1000), make(6, 3, "SPEEDRUN", 2000),
    make(7, 4, "ENDURANCE", 1000), make(8, 4, "ENDURANCE", 2000),
    make(9, 5, "SCORE", 99, 7),
  ];
  assert.deepEqual(getEarnedRecapScores(scores, 8).map((score) => score.id).sort(), [2, 3, 5, 8]);
  assert.deepEqual(getEarnedRecapScores(scores, null), []);
});

test("Recap ranks 3rd of 10 above 1st of 3 using field-adjusted results", () => {
  const make = (boardId, values, targetIndex, type = "SCORE") => {
    const scores = values.map((data, index) => ({ id: boardId * 100 + index, userId: index + 1, data }));
    return { ...scores[targetIndex], leaderboard: { id: boardId, name: String(boardId), type, game: { jamId: 8, name: "Game" }, scores } };
  };
  const small = make(1, [30, 20, 10], 0);
  const large = make(2, [100, 90, 80, 70, 60, 50, 40, 30, 20, 10], 2);
  const result = getEarnedRecapScores([small, large], 8);
  assert.equal(result[0].id, large.id);
  assert.equal(result[0].placement, 3);
  assert.equal(result[0].playerCount, 10);
  assert.equal(result[0].topPercent, 30);
  assert.equal(result[1].placement, 1);
});

test("Recap placement counts unique players, handles ties and lower-is-better boards", () => {
  const scores = [
    { id: 1, userId: 1, data: 20 }, { id: 2, userId: 1, data: 30 },
    { id: 3, userId: 2, data: 20 }, { id: 4, userId: 3, data: 10 },
  ];
  const score = { ...scores[0], leaderboard: { id: 1, name: "Fast", type: "SPEEDRUN", game: { jamId: 8, name: "Game" }, scores } };
  const [result] = getEarnedRecapScores([score], 8);
  assert.equal(result.placement, 2);
  assert.equal(result.playerCount, 3);
  assert.ok(Number.isFinite(result.strength));
  const solo = { ...score, leaderboard: { ...score.leaderboard, scores: [scores[0]] } };
  assert.equal(getEarnedRecapScores([solo], 8)[0].strength, 0);
});

import { getRatingColor } from "../src/helpers/ratingColor.ts";

test("Rating colors interpolate between purple, blue, and green anchors", () => {
  const colors = { purple: "#8000ff", blue: "#0000ff", green: "#00ff00", yellow: "#ffff00", textFaded: "#888888" };
  assert.equal(getRatingColor(3, colors), colors.purple);
  assert.equal(getRatingColor(3.5, colors), colors.blue);
  assert.equal(getRatingColor(4, colors), colors.green);
  assert.equal(getRatingColor(3.25, colors), "#4000ff");
  assert.equal(getRatingColor(3.75, colors), "#008080");
  assert.equal(getRatingColor(4.25, colors), "#79ff00");
  assert.equal(getRatingColor(4.5, colors), "#f2ff00");
  assert.equal(getRatingColor(5, colors), getRatingColor(4.5, colors));
  assert.equal(getRatingColor(2, colors), colors.textFaded);
  assert.equal(getRatingColor(2.5, colors), "#8444c4");
  assert.equal(getRatingColor(1, colors), colors.textFaded);
});

test("4.5-star results lean yellow and blend from green", () => {
  const colors = { green: "#4bea68", lime: "#b8ec52", yellow: "#f1e44f" };
  assert.equal(getRatingColor(4, colors), colors.green);
  assert.equal(getRatingColor(4.25, colors), "#9ae75c");
  assert.equal(getRatingColor(4.5, colors), "#e9e450");
  assert.equal(getRatingColor(4.9, colors), "#e9e450");
});
