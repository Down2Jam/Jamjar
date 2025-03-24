import { getCookie } from "@/helpers/cookie";
import { BASE_URL } from "./config";
import { PlatformType } from "@/types/DownloadLinkType";
import { AchievementType } from "@/types/AchievementType";
import { LeaderboardType } from "@/types/LeaderboardType";

export async function getCurrentGame() {
  return fetch(`${BASE_URL}/self/current-game?username=${getCookie("user")}`, {
    headers: { authorization: `Bearer ${getCookie("token")}` },
    credentials: "include",
  });
}

export async function getRatingCategories(always: boolean = false) {
  return fetch(
    `${BASE_URL}/rating-categories?always=${always ? "true" : "false"}`
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
  category: "ODA" | "REGULAR",
  targetTeamId: number,
  ratingCategories: number[],
  majRatingCategories: number[],
  published: boolean,
  themeJustification: string,
  achievements: AchievementType[],
  flags: number[],
  tags: number[],
  leaderboards: LeaderboardType[]
) {
  return fetch(`${BASE_URL}/game`, {
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
    }),
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      authorization: `Bearer ${getCookie("token")}`,
    },
    credentials: "include",
  });
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
  category: "ODA" | "REGULAR",
  ratingCategories: number[],
  majRatingCategories: number[],
  published: boolean,
  themeJustification: string,
  achievements: AchievementType[],
  flags: number[],
  tags: number[],
  leaderboards: LeaderboardType[]
) {
  return fetch(`${BASE_URL}/games/${previousGameSlug}`, {
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
    }),
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      authorization: `Bearer ${getCookie("token")}`,
    },
    credentials: "include",
  });
}

export async function getGames(sort: string) {
  return fetch(`${BASE_URL}/games?sort=${sort}`);
}
