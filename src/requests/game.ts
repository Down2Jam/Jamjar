import { getCookie } from "@/helpers/cookie";
import { BASE_URL } from "./config";
import { PlatformType } from "@/types/DownloadLinkType";
import { AchievementType } from "@/types/AchievementType";
import { LeaderboardType } from "@/types/LeaderboardType";
import { GameEmbedAspectRatio } from "@/types/GameType";

export async function getCurrentGame() {
  return fetch(`${BASE_URL}/self/current-game?username=${getCookie("user")}`, {
    headers: { authorization: `Bearer ${getCookie("token")}` },
    credentials: "include",
  });
}

export async function getRatingCategories(always: boolean = false) {
  return fetch(
    `${BASE_URL}/rating-categories?always=${always ? "true" : "false"}`,
  );
}

export async function getFlags() {
  return fetch(`${BASE_URL}/flags`);
}

export async function getGameTags() {
  return fetch(`${BASE_URL}/gametags`);
}

export async function getGame(gameSlug: string) {
  return fetch(`${BASE_URL}/games/${gameSlug}`, {
    headers: { authorization: `Bearer ${getCookie("token")}` },
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
) {
  const response = await fetch(`${BASE_URL}/game`, {
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

export async function getGames(sort: string, jamId?: string) {
  const params = new URLSearchParams({ sort });
  if (jamId !== undefined) {
    params.set("jamId", jamId);
  }

  return fetch(`${BASE_URL}/games?${params.toString()}`);
}

export async function getResults(
  category: string,
  contentType: string,
  sort: string,
  jam: string,
  preview: boolean = false,
) {
  const params = new URLSearchParams({
    category,
    contentType,
    sort,
    jam,
  });

  if (jam && jam !== "all") {
    params.set("jamId", jam);
  }

  if (preview) {
    params.set("preview", "1");
  }

  return fetch(`${BASE_URL}/results?${params.toString()}`, {
    credentials: "include",
    headers: {
      authorization: `Bearer ${getCookie("token")}`,
    },
  });
}
