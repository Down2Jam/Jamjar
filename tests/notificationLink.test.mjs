import assert from "node:assert/strict";
import { test } from "node:test";
import { getNotificationLink } from "../src/helpers/notificationLink.ts";

test("existing published-post notifications open the post route", () => {
  for (const target of ["theme-selection", "123", "theme-selection?comment=42#comment-42"]) {
    assert.equal(
      getNotificationLink({ type: "GENERAL", link: `/forum/posts/${target}` }),
      `/p/${target}`,
    );
  }
});

test("preserves current and unrelated links and handles missing links", () => {
  for (const link of ["/p/theme-selection", "/g/my-game", "https://example.com/forum/posts/post"]) {
    assert.equal(getNotificationLink({ type: "GENERAL", link }), link);
  }
  assert.equal(getNotificationLink({ type: "GENERAL" }), null);
});

test("existing game and track notifications use current routes", () => {
  for (const [legacy, current] of [["games", "g"], ["tracks", "m"]]) {
    assert.equal(getNotificationLink({ type: "GENERAL", link: `/${legacy}/my-item?comment=9#comment-9` }), `/${current}/my-item?comment=9#comment-9`);
  }
  assert.equal(getNotificationLink({ type: "GENERAL", link: "/games" }), "/games");
});

test("keeps existing follow and legacy profile destinations", () => {
  assert.equal(getNotificationLink({ type: "FOLLOW", data: { userSlug: "author" }, link: "/home" }), "/u/author");
  assert.equal(getNotificationLink({ type: "GENERAL", link: "/users/author?tab=posts#latest" }), "/u/author?tab=posts#latest");
});
