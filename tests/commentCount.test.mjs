import assert from "node:assert/strict";
import { test } from "node:test";
import { countComments } from "../src/helpers/commentCount.ts";

test("counts every reply across multiple roots and deep branches", () => {
  const comments = [
    { children: [{ children: [{ children: [{ children: [{}] }] }] }, {}] },
    { children: [{}] },
    {},
  ];
  assert.equal(countComments(comments), 9);
  assert.equal(countComments([]), 0);
  assert.equal(countComments(), 0);
});

test("reflects added and removed replies without changing the tree", () => {
  const comments = [{ children: [{}] }];
  const original = structuredClone(comments);
  assert.equal(countComments(comments), 2);
  assert.deepEqual(comments, original);
  comments[0].children.push({ children: [{}] });
  assert.equal(countComments(comments), 4);
  comments[0].children.pop();
  assert.equal(countComments(comments), 2);
});
