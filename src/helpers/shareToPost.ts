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
  starred,
  liked,
  skipped,
  total,
}: {
  jamName: string;
  jamSlug?: string;
  starred: string[];
  liked: string[];
  skipped: string[];
  total: number;
  url: string;
}) {
  const voted = starred.length + liked.length + skipped.length;
  return buildImageDraft({
    alt: `${jamName} theme voting picks`,
    filename: "theme-voting-picks.png",
    image: {
      jamName,
      heading: "Theme Voting Stats",
      total,
      stats: [
        { lead: "Voted", status: "star", color: OBSIDIAN.yellow, count: starred.length },
        { lead: "Voted", status: "like", color: OBSIDIAN.green, count: liked.length },
        { lead: "Voted", status: "skip", color: OBSIDIAN.muted, count: skipped.length },
        {
          lead: "Did",
          status: "not vote",
          color: OBSIDIAN.muted,
          count: Math.max(0, total - voted),
        },
      ],
    },
  });
}
