import { getCookie } from "@/helpers/cookie";
import { BASE_URL } from "@/requests/config";

const SHARE_DRAFT_KEY = "jamjar:share-post-draft";
const OBSIDIAN = {
  background: "#141414",
  surface: "#222222",
  text: "#ffffff",
  muted: "#939393",
  red: "#e95833",
  yellow: "#f5dc42",
  green: "#5ef24e",
  blue: "#4eb9f2",
} as const;

export type SharedPostDraft = {
  title: string;
  content: string;
  tags?: string[];
};

type ShareStat = {
  lead: string;
  status: string;
  color: string;
  count: number;
};
type ThemeShareImage = {
  jamName: string;
  heading: string;
  total: number;
  stats: ShareStat[];
};

type ThemeVotingChoice = {
  id: number;
  theme: string;
  vote: 0 | 1 | 3 | null;
};

function stableHash(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function orderVotingChoices(choices: ThemeVotingChoice[], jamKey: string) {
  return [...choices].sort((a, b) => {
    const hashDifference =
      stableHash(`${jamKey}:${a.id}`) - stableHash(`${jamKey}:${b.id}`);
    return hashDifference || a.id - b.id;
  });
}

export function openSharedPostDraft(draft: SharedPostDraft) {
  window.sessionStorage.setItem(SHARE_DRAFT_KEY, JSON.stringify(draft));
  window.location.assign("/create-post");
}

export function readSharedPostDraft(): SharedPostDraft | null {
  const serialized = window.sessionStorage.getItem(SHARE_DRAFT_KEY);
  if (!serialized) return null;

  try {
    const draft = JSON.parse(serialized) as Partial<SharedPostDraft>;
    if (typeof draft.title !== "string" || typeof draft.content !== "string") {
      return null;
    }
    return {
      title: draft.title,
      content: draft.content,
      tags: Array.isArray(draft.tags)
        ? draft.tags.filter((tag): tag is string => typeof tag === "string")
        : undefined,
    };
  } catch {
    return null;
  }
}

export function clearSharedPostDraft() {
  window.sessionStorage.removeItem(SHARE_DRAFT_KEY);
}

function capitalizeWords(value: string) {
  return value.replace(/\b\w/g, (char) => char.toUpperCase());
}

function fitText(context: CanvasRenderingContext2D, value: string, maxWidth: number) {
  if (context.measureText(value).width <= maxWidth) return value;
  let shortened = value;
  while (shortened.length > 1 && context.measureText(`${shortened}…`).width > maxWidth) {
    shortened = shortened.slice(0, -1);
  }
  return `${shortened}…`;
}

function canvasToBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Could not create the vote image"));
    }, "image/png");
  });
}

async function createThemeShareImage(image: ThemeShareImage) {
  const canvas = document.createElement("canvas");
  canvas.width = 520;
  canvas.height = 260;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas is not available");

  context.fillStyle = OBSIDIAN.background;
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = OBSIDIAN.muted;
  context.font = "600 13px Inter, Arial, sans-serif";
  context.textAlign = "center";
  context.fillText(image.jamName, 260, 34);
  context.fillStyle = OBSIDIAN.text;
  context.font = "700 23px Inter, Arial, sans-serif";
  context.fillText(fitText(context, image.heading, 480), 260, 60);

  const chartCenterX = 135;
  const chartCenterY = 150;
  const chartRadius = 54;
  const chartWidth = 14;
  context.lineWidth = chartWidth;
  context.lineCap = "butt";
  context.strokeStyle = OBSIDIAN.surface;
  context.beginPath();
  context.arc(chartCenterX, chartCenterY, chartRadius, 0, Math.PI * 2);
  context.stroke();

  let angle = -Math.PI / 2;
  if (image.total > 0) {
    image.stats.forEach((stat) => {
      if (stat.count <= 0) return;
      const arcLength = (stat.count / image.total) * Math.PI * 2;
      context.strokeStyle = stat.color;
      context.beginPath();
      context.arc(chartCenterX, chartCenterY, chartRadius, angle, angle + arcLength);
      context.stroke();
      angle += arcLength;
    });
  }

  const statsX = 225;
  context.textAlign = "left";
  context.font = "500 14px Inter, Arial, sans-serif";
  image.stats.forEach((stat, index) => {
    const y = 116 + index * 31;
    const percentage = image.total > 0 ? Math.round((stat.count / image.total) * 100) : 0;
    context.fillStyle = OBSIDIAN.muted;
    context.fillText(stat.lead, statsX, y);
    let x = statsX + context.measureText(`${stat.lead} `).width;
    context.fillStyle = stat.color;
    context.font = "700 14px Inter, Arial, sans-serif";
    context.fillText(stat.status, x, y);
    x += context.measureText(`${stat.status} `).width;
    context.fillStyle = OBSIDIAN.muted;
    context.font = "500 14px Inter, Arial, sans-serif";
    context.fillText("on ", x, y);
    x += context.measureText("on ").width;
    context.fillStyle = OBSIDIAN.blue;
    context.font = "700 14px Inter, Arial, sans-serif";
    context.fillText(String(stat.count), x, y);
    x += context.measureText(`${stat.count} `).width;
    context.fillStyle = OBSIDIAN.muted;
    context.font = "500 14px Inter, Arial, sans-serif";
    const themeLabel = `${stat.count === 1 ? "theme" : "themes"} `;
    context.fillText(themeLabel, x, y);
    x += context.measureText(themeLabel).width;
    context.fillStyle = OBSIDIAN.blue;
    context.fillText(`(${percentage}%)`, x, y);
    context.font = "500 14px Inter, Arial, sans-serif";
  });

  return canvasToBlob(canvas);
}

async function createVotingShareImage(
  jamName: string,
  choices: ThemeVotingChoice[],
) {
  const canvas = document.createElement("canvas");
  canvas.width = 520;
  canvas.height = Math.max(260, 92 + choices.length * 36);
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas is not available");

  context.fillStyle = OBSIDIAN.background;
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.textAlign = "center";
  context.fillStyle = OBSIDIAN.muted;
  context.font = "600 13px Inter, Arial, sans-serif";
  context.fillText(jamName, 260, 30);
  context.fillStyle = OBSIDIAN.text;
  context.font = "700 23px Inter, Arial, sans-serif";
  context.fillText("Theme Votes", 260, 57);

  const voteOptions = [
    {
      vote: 0 as const,
      label: "0",
      x: 418,
      color: OBSIDIAN.muted,
    },
    {
      vote: 1 as const,
      label: "1",
      x: 446,
      color: OBSIDIAN.green,
    },
    {
      vote: 3 as const,
      label: "★",
      x: 474,
      color: OBSIDIAN.yellow,
    },
  ];
  choices.forEach((_choice, index) => {
    const centerY = 88 + index * 36;
    const isLightRow = index % 2 === 0;
    context.fillStyle = isLightRow ? OBSIDIAN.surface : "#1b1b1b";
    context.beginPath();
    context.roundRect(32, centerY - 15, 456, 30, 6);
    context.fill();

    context.save();
    context.beginPath();
    context.roundRect(32, centerY - 15, 456, 30, 6);
    context.clip();
    const laneColors = isLightRow
      ? ["#1b1b1b", "#1f1f1f", "#1b1b1b"]
      : ["#151515", "#181818", "#151515"];
    laneColors.forEach((color, laneIndex) => {
      context.fillStyle = color;
      context.fillRect(404 + laneIndex * 28, centerY - 15, 28, 30);
    });
    context.restore();
  });

  choices.forEach((choice, index) => {
    const centerY = 88 + index * 36;
    const displayedVote = choice.vote ?? 0;

    context.textAlign = "left";
    context.fillStyle = OBSIDIAN.text;
    context.font = "600 14px Inter, Arial, sans-serif";
    context.fillText(
      fitText(context, capitalizeWords(choice.theme), 330),
      48,
      centerY + 5,
    );

    context.textAlign = "center";
    voteOptions.forEach((option) => {
      if (displayedVote !== option.vote) return;
      context.fillStyle = option.color;
      context.font =
        option.vote === 3
          ? "700 18px Arial, sans-serif"
          : "700 14px Inter, Arial, sans-serif";
      context.fillText(
        option.label,
        option.x,
        centerY + (option.vote === 3 ? 6 : 5),
      );
    });
  });

  return canvasToBlob(canvas);
}

async function uploadThemeShareImage(blob: Blob, filename: string) {
  const formData = new FormData();
  formData.append("upload", new File([blob], filename, { type: "image/png" }));
  const response = await fetch(`${BASE_URL}/image`, {
    method: "POST",
    body: formData,
    headers: { authorization: `Bearer ${getCookie("token")}` },
    credentials: "include",
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok || typeof payload?.data !== "string") {
    throw new Error(payload?.message ?? "Could not upload the vote image");
  }
  return payload.data as string;
}

async function buildImageDraft({
  alt,
  filename,
  image,
}: {
  alt: string;
  filename: string;
  image: ThemeShareImage;
}): Promise<SharedPostDraft> {
  const imageUrl = await uploadThemeShareImage(
    await createThemeShareImage(image),
    filename,
  );
  return {
    title: "",
    content: `\u200B\n\n![${alt}](${imageUrl})`,
    tags: ["ThemeVote"],
  };
}

export function buildEliminationShareDraft({
  jamName,
  yes,
  no,
  skipped,
  total,
}: {
  jamName: string;
  jamSlug?: string;
  yes: string[];
  no: string[];
  skipped: string[];
  total: number;
  url: string;
}) {
  const reviewed = yes.length + no.length + skipped.length;
  return buildImageDraft({
    alt: `${jamName} theme elimination vote results`,
    filename: "theme-elimination-votes.png",
    image: {
      jamName,
      heading: "Elimination Stats",
      total,
      stats: [
        { lead: "Voted", status: "yes", color: OBSIDIAN.green, count: yes.length },
        { lead: "Voted", status: "no", color: OBSIDIAN.red, count: no.length },
        { lead: "Voted", status: "skip", color: OBSIDIAN.yellow, count: skipped.length },
        {
          lead: "Did",
          status: "not vote",
          color: OBSIDIAN.muted,
          count: Math.max(0, total - reviewed),
        },
      ],
    },
  });
}

export function buildVotingShareDraft({
  jamName,
  jamSlug,
  choices,
}: {
  jamName: string;
  jamSlug?: string;
  choices: ThemeVotingChoice[];
  url: string;
}) {
  const orderedChoices = orderVotingChoices(choices, jamSlug ?? jamName);

  return createVotingShareImage(jamName, orderedChoices)
    .then((blob) => uploadThemeShareImage(blob, "theme-voting-picks.png"))
    .then((imageUrl) => ({
      title: "",
      content: `\u200B\n\n![${jamName} theme voting picks](${imageUrl})`,
      tags: ["ThemeVote"],
    }));
}
