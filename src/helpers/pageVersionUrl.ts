import type { PageVersion } from "@/types/GameType";

export function defaultGameVersion(game: object | null | undefined): PageVersion | undefined {
  if (game && "postJamPage" in game && game.postJamPage) return "POST_JAM";
  if (game && ("jamPage" in game || "postJamPage" in game)) return "JAM";
  return undefined;
}

export function defaultTrackVersion(track: { availablePageVersions?: PageVersion[] } | null | undefined): PageVersion | undefined {
  if (!track?.availablePageVersions?.length) return undefined;
  return track.availablePageVersions.includes("POST_JAM") ? "POST_JAM" : "JAM";
}

export function pageVersionUrl(href: string, version?: PageVersion, defaultVersion = version) {
  const url = new URL(href, "https://local.invalid");
  url.searchParams.delete("pageVersion");
  if (version && defaultVersion && version !== defaultVersion) url.searchParams.set("pageVersion", version);
  return /^https?:\/\//.test(href) ? url.href : `${url.pathname}${url.search}${url.hash}`;
}
