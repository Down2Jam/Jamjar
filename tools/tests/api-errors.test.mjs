import assert from "node:assert/strict";
import { test } from "node:test";
import { getApiErrorMessage } from "../../src/requests/helpers.ts";

test("reads the server error envelope used for rejected uploads", () => {
  assert.equal(getApiErrorMessage({ success: false, error: { code: "BAD_REQUEST", message: "File is too large." } }), "File is too large.");
});

test("supports legacy messages and safely handles missing or malformed responses", () => {
  assert.equal(getApiErrorMessage({ message: "S3 upload failed" }), "S3 upload failed");
  for (const value of [null, {}, "Bad Gateway", { error: null }, { error: { message: 42 } }, { message: "" }]) {
    assert.equal(getApiErrorMessage(value), null);
  }
});
