import sharp from "sharp";
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

// Run manually to rebuild the static artwork. Nothing is composed in-browser.
const origin = "https://d2jam.com";
const jamId = process.argv[2] ?? "7";
const output = fileURLToPath(new URL("../public/images/down2guess-collage.webp", import.meta.url));
const games = new Map();
let cursor;
do {
  const params = new URLSearchParams({ jamId, sort: "newest", limit: "50", pageVersion: "JAM" });
  if (cursor) params.set("cursor", cursor);
  const response = await fetch(`${origin}/api/v1/games?${params}`, { signal: AbortSignal.timeout(30000) });
  if (!response.ok) throw new Error(`Game list: ${response.status}`);
  const body = await response.json();
  for (const game of body.data ?? []) if (game.thumbnail) games.set(game.id, game);
  const page = body.meta?.pageInfo ?? body.pageInfo;
  const next = page?.hasMore ? page.nextCursor : null;
  if (next === cursor) throw new Error("Pagination did not advance");
  cursor = next;
} while (cursor);

const tiles = [];
const sources = [...games.values()];
// Stable interleaving prevents submission order from forming obvious clusters.
sources.sort((a, b) => ((a.id * 2654435761) >>> 0) - ((b.id * 2654435761) >>> 0));
for (let start = 0; start < sources.length; start += 6) {
  const batch = await Promise.all(sources.slice(start, start + 6).map(async game => {
    try {
      const response = await fetch(new URL(game.thumbnail, origin), { signal: AbortSignal.timeout(30000) });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const input = Buffer.from(await response.arrayBuffer());
      return await sharp(input).rotate().resize(320, 180, { fit: "cover" }).removeAlpha().png().toBuffer();
    } catch (error) {
      console.warn(`Skipped ${game.slug}: ${error.message}`);
      return null;
    }
  }));
  tiles.push(...batch.filter(Boolean));
}
if (tiles.length < 12) throw new Error("Not enough thumbnails to create a collage");

const layers = [];
for (let row = 0; row < 10; row++) {
  for (let column = 0; column < 9; column++) {
    layers.push({ input: tiles[(row * 9 + column) % tiles.length], left: column * 320 + (row % 2 ? 160 : 0), top: row * 180 });
  }
}
const collage = await sharp({ create: { width: 3040, height: 1800, channels: 3, background: "#101519" } }).composite(layers).png().toBuffer();
await mkdir(fileURLToPath(new URL("../public/images/", import.meta.url)), { recursive: true });
await writeFile(output, await sharp(collage).extract({ left: 160, top: 0, width: 2560, height: 1800 }).webp({ quality: 82 }).toBuffer());
console.log(`Saved ${output} using ${tiles.length} thumbnails from jam ${jamId}`);
