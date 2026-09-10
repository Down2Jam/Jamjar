export const BASE_URL = "/api/v1";

export const GAME_BUILDS_ORIGIN = String(
  import.meta.env.VITE_GAME_BUILDS_ORIGIN ?? "",
).replace(/\/$/, "");

export function getPlayableBuildUrl(path: string) {
  return path.startsWith("/game-builds/") && GAME_BUILDS_ORIGIN
    ? `${GAME_BUILDS_ORIGIN}${path}`
    : path;
}

export const API_DOCS_URL = BASE_URL;
