import { canvasToBlob, fitText, OBSIDIAN, uploadThemeShareImage, type SharedPostDraft } from "./shareToPost";
import { getRatingColor } from "./ratingColor";

const palette = { ...OBSIDIAN, purple: "#b455f5", pink: "#ed65b1", textFaded: OBSIDIAN.muted };
type Rating = { label: string; averageScore: number; placement: number };
type Word = { label: string; count: number; image?: string };
export type RecapShare = {
  jamName: string;
  userName: string;
  stats: Array<{ label: string; value: number }>;
  game?: { name: string; ratings: Rating[] };
  games?: Array<{ name: string; ratings: Rating[] }>;
  music: Array<{ name: string; ratings: Rating[] }>;
  gameWords: Word[];
  musicWords: Word[];
  publicUrl?: string;
};

function createCanvas(height: number, title: string, jamName?: string) {
  const canvas = document.createElement("canvas");
  canvas.width = 1040;
  canvas.height = height * 2;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas is not available");
  context.scale(2, 2);
  context.fillStyle = palette.background;
  context.fillRect(0, 0, 520, height);
  context.textAlign = "center";
  if (jamName) {
    context.fillStyle = palette.muted;
    context.font = "600 13px Inter, Arial, sans-serif";
    context.fillText(fitText(context, jamName, 464), 260, 30);
  }
  context.fillStyle = palette.text;
  context.font = jamName ? "700 23px Inter, Arial, sans-serif" : "700 14px Inter, Arial, sans-serif";
  context.fillText(fitText(context, title, 464), 260, jamName ? 60 : 24);
  return { canvas, context };
}

function star(context: CanvasRenderingContext2D, x: number, y: number) {
  context.beginPath();
  for (let index = 0; index < 10; index++) {
    const angle = -Math.PI / 2 + index * Math.PI / 5;
    const radius = index % 2 === 0 ? 6 : 2.85;
    const px = x + Math.cos(angle) * radius;
    const py = y + Math.sin(angle) * radius;
    if (index === 0) context.moveTo(px, py);
    else context.lineTo(px, py);
  }
  context.closePath();
}

function ratingsImage(name: string, ratings: Rating[], music: boolean) {
  const { canvas, context } = createCanvas(42 + ratings.length * 22, name);
  context.textAlign = "left";
  context.textBaseline = "middle";
  ratings.forEach((rating, index) => {
    const y = 46 + index * 22;
    const stars = Math.max(0, Math.min(5, rating.averageScore / 2));
    const podium = rating.placement >= 1 && rating.placement <= 3;
    const color = podium ? (music ? palette.purple : palette.red) : getRatingColor(stars, palette);
    context.fillStyle = palette.muted;
    context.font = "500 11px Inter, Arial, sans-serif";
    context.fillText(fitText(context, rating.label, 230), 28, y);
    context.font = "700 13px Inter, Arial, sans-serif";
    const gradient = context.createLinearGradient(300, 0, 340, 0);
    gradient.addColorStop(0, music ? palette.pink : palette.yellow);
    gradient.addColorStop(1, color);
    context.fillStyle = podium ? gradient : color;
    context.fillText(stars.toFixed(2), 300, y);
    for (let i = 0; i < 5; i++) {
      const x = 397 + i * 17;
      star(context, x, y);
      context.fillStyle = palette.surface;
      context.fill();
      context.save();
      context.clip();
      context.fillStyle = color;
      context.fillRect(x - 6, y - 6, 12 * Math.max(0, Math.min(1, stars - i)), 12);
      context.restore();
    }
    if (rating.placement > 0) {
      context.font = "500 10px Inter, Arial, sans-serif";
      context.fillStyle = palette.muted;
      context.textAlign = "right";
      context.fillText(`#${rating.placement}`, 270, y);
      context.textAlign = "left";
    }
  });
  return canvasToBlob(canvas);
}

async function wordsImage(title: string, words: Word[]) {
  const probe = document.createElement("canvas").getContext("2d");
  if (!probe) throw new Error("Canvas is not available");
  const images = await Promise.all(words.map(async (word) => {
    if (!word.image) return null;
    try {
      const response = await fetch(word.image, { signal: AbortSignal.timeout(5000) });
      if (!response.ok) return null;
      return await createImageBitmap(await response.blob());
    } catch { return null; }
  }));
  const max = Math.max(1, ...words.map((word) => word.count));
  const rows: Array<Array<{ word: Word; index: number; size: number; width: number; angle: number }>> = [[]];
  let rowWidth = 0;
  words.forEach((word, index) => {
    const size = Math.round(12 + 12 * word.count / max);
    probe.font = `600 ${size}px Inter, Arial, sans-serif`;
    const angle = (index % 4 === 0 ? -4 : index % 4 === 2 ? 3 : 0) * Math.PI / 180;
    const textWidth = images[index] ? 30 : Math.min(440, probe.measureText(word.label).width);
    const width = Math.ceil(textWidth * Math.cos(angle) + (images[index] ? 30 : size) * Math.abs(Math.sin(angle)));
    if (rowWidth + width + 18 > 464 && rows.at(-1)!.length) {
      rows.push([]);
      rowWidth = 0;
    }
    rows.at(-1)!.push({ word, index, size, width, angle });
    rowWidth += width + 18;
  });
  const { canvas, context } = createCanvas(44 + rows.length * 42, title);
  const colors = [palette.yellow, palette.green, palette.blue, palette.purple, palette.red];
  context.textAlign = "center";
  context.textBaseline = "middle";
  rows.forEach((row, rowIndex) => {
    let x = (520 - row.reduce((sum, item) => sum + item.width, 0) - (row.length - 1) * 18) / 2;
    const y = 54 + rowIndex * 42;
    row.forEach(({ word, index, size, width, angle }) => {
      context.save();
      context.translate(x + width / 2, y);
      context.rotate(angle);
      const image = images[index];
      if (image) {
        const scale = Math.min(30 / image.width, 30 / image.height);
        context.drawImage(image, -image.width * scale / 2, -image.height * scale / 2, image.width * scale, image.height * scale);
        image.close();
      } else {
        context.font = `600 ${size}px Inter, Arial, sans-serif`;
        context.fillStyle = colors[(index + rowIndex * 2) % colors.length];
        context.fillText(fitText(context, word.label, 440), 0, 0);
      }
      context.restore();
      x += width + 18;
    });
  });
  return canvasToBlob(canvas);
}

export async function buildRecapShareDraft(recap: RecapShare): Promise<SharedPostDraft> {
  await document.fonts.ready;
  const images: Array<{ alt: string; blob: Blob }> = [];
  const { canvas, context } = createCanvas(104 + Math.ceil(recap.stats.length / 2) * 50, "Jam Recap", recap.jamName);
  context.font = "500 14px Inter, Arial, sans-serif";
  context.fillStyle = palette.muted;
  context.fillText(fitText(context, recap.userName, 464), 260, 85);
  recap.stats.forEach((stat, index) => {
    const x = index % 2 === 0 ? 140 : 380;
    const y = 117 + Math.floor(index / 2) * 50;
    context.fillStyle = palette.text;
    context.font = "700 18px Inter, Arial, sans-serif";
    context.fillText(String(stat.value), x, y);
    context.fillStyle = palette.muted;
    context.font = "500 12px Inter, Arial, sans-serif";
    context.fillText(fitText(context, stat.label, 220), x, y + 16);
  });
  images.push({ alt: `${recap.userName}'s ${recap.jamName} recap`, blob: await canvasToBlob(canvas) });
  for (const game of recap.games ?? (recap.game ? [recap.game] : [])) {
    if (game.ratings.length) images.push({ alt: `${game.name} ratings`, blob: await ratingsImage(game.name, game.ratings, false) });
  }
  if (recap.gameWords.length) images.push({ alt: "Words people used", blob: await wordsImage("Words People Used", recap.gameWords) });
  const musicRatings = recap.music.flatMap((track) =>
    track.ratings.slice(0, 1).map((rating) => ({ ...rating, label: track.name })),
  );
  if (musicRatings.length) images.push({ alt: "Music ratings", blob: await ratingsImage("Music", musicRatings, true) });
  if (recap.musicWords.length) images.push({ alt: "Words people used for your music", blob: await wordsImage("Words People Used For Your Music", recap.musicWords) });
  const content: string[] = [];
  for (const [index, image] of images.entries()) {
    const url = await uploadThemeShareImage(image.blob, `jam-recap-${index + 1}.png`);
    const alt = image.alt.replace(/[\[\]\\\r\n]/g, " ");
    content.push(`![${alt}](${url})`);
  }
  if (recap.publicUrl) content.push(`[View my jam recap](${recap.publicUrl})`);
  return { title: "", content: `\u200B\n\n${content.join("\n\n")}`, tags: ["JamRecap"] };
}
