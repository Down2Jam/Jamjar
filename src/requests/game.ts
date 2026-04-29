import { getCookie } from "@/helpers/cookie";
import { BASE_URL } from "./config";
import { PlatformType } from "@/types/DownloadLinkType";
import { AchievementType } from "@/types/AchievementType";
import { LeaderboardType } from "@/types/LeaderboardType";
import {
  GameEmbedAspectRatio,
  ListingPageVersion,
  PageVersion,
} from "@/types/GameType";
import { isNumericJamValue } from "@/helpers/jamUrl";

const inflightGetRequests = new Map<string, Promise<Response>>();

function dedupedGet(url: string, init?: RequestInit) {
  const key = JSON.stringify([url, init?.headers ?? null, init?.credentials ?? null]);
  const existing = inflightGetRequests.get(key);
  if (existing) {
    return existing.then((response) => response.clone());
  }

  const request = fetch(url, init).finally(() => {
    inflightGetRequests.delete(key);
  });
  inflightGetRequests.set(key, request);
  return request.then((response) => response.clone());
}

export async function getCurrentGame() {
  return fetch(`${BASE_URL}/self/current-game`, {
    headers: { authorization: `Bearer ${getCookie("token")}` },
    credentials: "include",
  });
}

export async function getRatingCategories(always: boolean = false) {
  return dedupedGet(
    `${BASE_URL}/rating-categories?always=${always ? "true" : "false"}`,
  );
}

export async function getFlags() {
  return fetch(`${BASE_URL}/flags`);
}

export async function getGameTags() {
  return fetch(`${BASE_URL}/gametags`);
}

export async function getGame(
  gameSlug: string,
  recap: boolean = false,
  pageVersion?: PageVersion,
) {
  const params = new URLSearchParams();
  if (recap) {
    params.set("recap", "1");
  }
  if (pageVersion) {
    params.set("pageVersion", pageVersion);
  }

  return fetch(
    `${BASE_URL}/games/${gameSlug}${params.toString() ? `?${params.toString()}` : ""}`,
    {
    headers: { authorization: `Bearer ${getCookie("token")}` },
    credentials: "include",
    },
  );
}

export async function createPostJamVersion(gameSlug: string) {
  return fetch(`${BASE_URL}/games/${gameSlug}/post-jam`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${getCookie("token")}`,
    },
    credentials: "include",
  });
}

export async function postGame(
  title: string,
  gameSlug: string,
  description: string,
  thumbnail: string | null,
  banner: string | null,
  downloadLinks: {
    url: string;
    platform: PlatformType;
  }[],
  userSlug: string,
  category: "ODA" | "REGULAR" | "EXTRA",
  targetTeamId: number,
  ratingCategories: number[],
  majRatingCategories: number[],
  published: boolean,
  themeJustification: string,
  achievements: AchievementType[],
  flags: number[],
  tags: number[],
  leaderboards: LeaderboardType[],
  short: string,
  songs: {
    name: string;
    url: string;
    commentary?: string | null;
    tagIds?: number[];
    flagIds?: number[];
    bpm?: number | null;
    musicalKey?: string | null;
    softwareUsed?: string[];
    links?: Array<{ label: string; url: string }>;
    credits?: Array<{ role: string; userId: number }>;
    composerId?: number | null;
    id: number;
    slug: string;
    license?: string | null;
    allowDownload?: boolean;
    allowBackgroundUse?: boolean;
    allowBackgroundUseAttribution?: boolean;
  }[],
  screenshots: string[],
  trailerUrl: string | null,
  itchEmbedUrl: string | null,
  itchEmbedAspectRatio: GameEmbedAspectRatio | null,
  inputMethods: string[],
  estOneRun: string | null,
  estAnyPercent: string | null,
  estHundredPercent: string | null,
  emotePrefix: string | null,
  pageVersion: PageVersion = "JAM",
) {
  const response = await fetch(`${BASE_URL}/games`, {
    body: JSON.stringify({
      name: title,
      slug: gameSlug,
      description,
      thumbnail,
      banner,
      downloadLinks,
      userSlug,
      category,
      targetTeamId,
      ratingCategories,
      majRatingCategories,
      published,
      themeJustification,
      achievements,
      flags,
      tags,
      leaderboards,
      short,
      songs,
      screenshots,
      trailerUrl,
      itchEmbedUrl,
      itchEmbedAspectRatio,
      inputMethods,
      estOneRun,
      estAnyPercent,
      estHundredPercent,
      emotePrefix,
      pageVersion,
    }),
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      authorization: `Bearer ${getCookie("token")}`,
    },
    credentials: "include",
  });

  return response;
}

export async function updateGame(
  previousGameSlug: string,
  title: string,
  gameSlug: string,
  description: string,
  thumbnail: string | null,
  banner: string | null,
  downloadLinks: {
    url: string;
    platform: PlatformType;
  }[],
  userSlug: string,
  category: "ODA" | "REGULAR" | "EXTRA",
  ratingCategories: number[],
  majRatingCategories: number[],
  published: boolean,
  themeJustification: string,
  achievements: AchievementType[],
  flags: number[],
  tags: number[],
  leaderboards: LeaderboardType[],
  short: string,
  songs: {
    name: string;
    url: string;
    commentary?: string | null;
    tagIds?: number[];
    flagIds?: number[];
    bpm?: number | null;
    musicalKey?: string | null;
    softwareUsed?: string[];
    links?: Array<{ label: string; url: string }>;
    credits?: Array<{ role: string; userId: number }>;
    composerId?: number | null;
    id: number;
    slug: string;
    license?: string | null;
    allowDownload?: boolean;
    allowBackgroundUse?: boolean;
    allowBackgroundUseAttribution?: boolean;
  }[],
  screenshots: string[],
  trailerUrl: string | null,
  itchEmbedUrl: string | null,
  itchEmbedAspectRatio: GameEmbedAspectRatio | null,
  inputMethods: string[],
  estOneRun: string | null,
  estAnyPercent: string | null,
  estHundredPercent: string | null,
  emotePrefix: string | null,
  pageVersion: PageVersion = "JAM",
) {
  const response = await fetch(`${BASE_URL}/games/${previousGameSlug}`, {
    body: JSON.stringify({
      name: title,
      slug: gameSlug,
      description,
      thumbnail,
      banner,
      downloadLinks,
      userSlug,
      category,
      ratingCategories,
      majRatingCategories,
      published,
      themeJustification,
      achievements,
      flags,
      tags,
      leaderboards,
      short,
      songs,
      screenshots,
      trailerUrl,
      itchEmbedUrl,
      itchEmbedAspectRatio,
      inputMethods,
      estOneRun,
      estAnyPercent,
      estHundredPercent,
      emotePrefix,
      pageVersion,
    }),
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      authorization: `Bearer ${getCookie("token")}`,
    },
    credentials: "include",
  });

  return response;
}

function setJamListingParam(params: URLSearchParams, jam?: string) {
  if (!jam || jam === "all") return;

  if (isNumericJamValue(jam)) {
    params.set("jamId", jam);
    return;
  }

  params.set("jamSlug", jam);
}

export async function getGames(
  sort: string,
  jam?: string,
  pageVersion?: ListingPageVersion,
) {
  const params = new URLSearchParams({ sort });
  setJamListingParam(params, jam);
  if (pageVersion && pageVersion !== "JAM") {
    params.set("pageVersion", pageVersion);
  }

  return fetch(`${BASE_URL}/games?${params.toString()}`);
}

export async function getGamesPage({
  sort = "newest",
  jamId,
  jam,
  pageVersion,
  cursor,
  limit = 50,
}: {
  sort?: string;
  jamId?: string;
  jam?: string;
  pageVersion?: ListingPageVersion;
  cursor?: string | null;
  limit?: number;
}) {
  const params = new URLSearchParams({ sort, limit: String(limit) });
  setJamListingParam(params, jam ?? jamId);
  if (pageVersion && pageVersion !== "JAM") params.set("pageVersion", pageVersion);
  if (cursor) params.set("cursor", cursor);

  return fetch(`${BASE_URL}/games?${params.toString()}`);
}

export async function getRandomGame() {
  return fetch(`${BASE_URL}/games/random`, {
    headers: { authorization: `Bearer ${getCookie("token")}` },
    credentials: "include",
  });
}

export async function getGameDevlogPosts(
  gameSlug: string,
  relationType?: "devlog" | "release" | "postmortem" | "announcement" | "other",
  limit?: number,
) {
  const params = new URLSearchParams();
  if (relationType) params.set("relationType", relationType);
  if (limit) params.set("limit", String(limit));

  return fetch(
    `${BASE_URL}/games/${encodeURIComponent(gameSlug)}/devlog${params.size ? `?${params.toString()}` : ""}`,
    {
      headers: { authorization: `Bearer ${getCookie("token")}` },
      credentials: "include",
    },
  );
}

export async function getResults(
  category: string,
  contentType: string,
  sort: string,
  jam: string,
  preview: boolean = false,
  recap: boolean = false,
) {
  const params = new URLSearchParams({
    category,
    contentType,
    sort,
    jam,
  });

  if (jam && jam !== "all") {
    if (isNumericJamValue(jam)) {
      params.set("jamId", jam);
    } else {
      params.set("jamSlug", jam);
    }
  }

  if (preview) {
    params.set("preview", "1");
  }

  if (recap) {
    params.set("recap", "1");
  }

  return fetch(`${BASE_URL}/results?${params.toString()}`, {
    credentials: "include",
    headers: {
      authorization: `Bearer ${getCookie("token")}`,
    },
  });
}
