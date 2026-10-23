import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";

let server;
let requests;

before(async () => {
  server = await createServer({
    root: fileURLToPath(new URL("../../", import.meta.url)),
    configFile: false,
    resolve: { alias: { "@": fileURLToPath(new URL("../../src", import.meta.url)) } },
    optimizeDeps: { noDiscovery: true, include: [] },
    server: { middlewareMode: true, watch: null, ws: false },
    appType: "custom",
  });
  requests = await server.ssrLoadModule("/src/requests/game.ts");
});

after(async () => { await server?.close(); });

function editablePage(pageVersion) {
  return {
    name: "Flip Fortune", slug: "flip-fortune", description: "<p>Updated description</p>",
    thumbnail: "/thumbnail.png", soundtrackThumbnail: "/soundtrack.png", banner: "/banner.png",
    pageBackground: "/background.png", downloadLinks: [{ url: "https://example.com/game.zip", platform: "WINDOWS" }],
    userSlug: "creator", category: "EXTRA", ratingCategories: [1, 7, 5, 2, 3], majRatingCategories: [2],
    published: true, themeJustification: "Scaling your collection", flags: [3, 6], tags: [1, 265],
    achievements: [
      { id: 42, name: "First flip", description: "Flip a coin", image: "/coin.png" },
      { name: "Collector", description: "Collect every sticker", image: "" },
    ],
    leaderboards: [
      { id: 9, name: "Best Times", type: "SPEEDRUN", onlyBest: true, maxUsersShown: 10, decimalPlaces: 0 },
      { name: "Scores", type: "SCORE", onlyBest: false, maxUsersShown: 25, decimalPlaces: 2 },
    ],
    short: "Flip coins and collect stickers",
    songs: [{
      id: 8, name: "Coin song", slug: "coin-song", url: "/song.mp3", commentary: "Updated music notes",
      tagIds: [2], flagIds: [3], bpm: 120, musicalKey: "C", integratedLufs: -14, truePeakDb: -1,
      loudnessGainDb: 0, softwareUsed: ["DAW"], links: [{ label: "Source", url: "https://example.com/music" }],
      credits: [{ role: "COMPOSER", userId: 7 }], origin: "ORIGINAL", externalAuthorName: null,
      license: "CC_BY_4_0", allowDownload: true, allowBackgroundUse: true, allowBackgroundUseAttribution: true,
    }],
    screenshots: ["/first.png", "/second.png"], trailerUrl: "https://youtu.be/abcdefghijk",
    itchEmbedUrl: "https://itch.io/embed/123", itchEmbedAspectRatio: "4 / 3",
    playableBuildUrl: "/game-builds/11111111-1111-1111-1111-111111111111/index.html",
    playableBuildAspectRatio: "16 / 9", playableBuildShowFullscreenButton: false,
    inputMethods: ["MouseOnly"], estOneRun: "10–20 mins", estAnyPercent: null, estHundredPercent: "1–2 hours",
    emotePrefix: "flip", pageVersion,
  };
}

function savePage(mode, page) {
  const details = [
    page.name, page.slug, page.description, page.thumbnail, page.soundtrackThumbnail,
    page.banner, page.downloadLinks, page.userSlug, page.category,
  ];
  const content = [
    page.ratingCategories, page.majRatingCategories, page.published, page.themeJustification,
    page.achievements, page.flags, page.tags, page.leaderboards, page.short, page.songs,
    page.screenshots, page.trailerUrl, page.itchEmbedUrl, page.itchEmbedAspectRatio,
    page.playableBuildUrl, page.playableBuildAspectRatio, page.playableBuildShowFullscreenButton,
    page.inputMethods, page.estOneRun, page.estAnyPercent, page.estHundredPercent,
    page.emotePrefix, page.pageVersion, page.pageBackground,
  ];
  return mode === "create"
    ? requests.postGame(...details, 181, ...content)
    : requests.updateGame("previous-slug", ...details, ...content);
}

for (const mode of ["create", "update"]) {
  for (const pageVersion of ["JAM", "POST_JAM"]) {
    test(`${mode} ${pageVersion} saves every tab without oversized read relations`, async (t) => {
      const expected = editablePage(pageVersion);
      const input = structuredClone(expected);
      const relatedGame = { id: 159, ratings: [{ details: "x".repeat(1024 * 1024) }] };
      input.leaderboards[0].game = relatedGame;
      input.leaderboards[0].scores = [{ id: 12, value: 100, user: { id: 7 } }];
      input.achievements[0].game = relatedGame;
      input.achievements[0].users = [{ id: 7 }];
      input.achievements[0].unlocks = [{ userId: 7, earnedAt: "2026-09-22T17:00:00Z" }];
      input.achievements[1].id = -1750000000000;
      assert.ok(Buffer.byteLength(JSON.stringify(input)) > 1024 * 1024);

      const response = new Response(null, { status: 200 });
      const fetchMock = t.mock.method(globalThis, "fetch", async () => response);
      assert.equal(await savePage(mode, input), response);
      assert.equal(fetchMock.mock.callCount(), 1);
      const [url, options] = fetchMock.mock.calls[0].arguments;
      assert.equal(url, mode === "create" ? "/api/v1/games" : "/api/v1/games/previous-slug");
      assert.equal(options.method, mode === "create" ? "POST" : "PUT");
      assert.deepEqual(JSON.parse(options.body), mode === "create" ? { ...expected, targetTeamId: 181 } : expected);
      assert.ok(Buffer.byteLength(options.body) < 10 * 1024);
      assert.equal(input.leaderboards[0].game, relatedGame);
      assert.equal(input.achievements[1].id, -1750000000000);
    });
  }
}
