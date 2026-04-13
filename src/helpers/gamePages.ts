import { GamePageType, GameType, PageVersion } from "@/types/GameType";

export function getSelectedGamePage(
  game: GameType | null | undefined,
  version: PageVersion,
): GamePageType | null {
  if (!game) return null;
  return version === "POST_JAM" ? game.postJamPage ?? null : game.jamPage ?? null;
}

export function materializeGamePage(
  game: GameType,
  page: GamePageType,
): GameType {
  return {
    ...game,
    name: page.name,
    short: page.short,
    description: page.description,
    thumbnail: page.thumbnail ?? undefined,
    banner: page.banner ?? undefined,
    themeJustification: page.themeJustification,
    published: Boolean(game.published),
    achievements: page.achievements ?? [],
    leaderboards: page.leaderboards ?? [],
    downloadLinks: page.downloadLinks ?? [],
    screenshots: page.screenshots ?? [],
    trailerUrl: page.trailerUrl ?? null,
    itchEmbedUrl: page.itchEmbedUrl ?? null,
    itchEmbedAspectRatio: page.itchEmbedAspectRatio ?? null,
    inputMethods: page.inputMethods ?? [],
    estOneRun: page.estOneRun ?? null,
    estAnyPercent: page.estAnyPercent ?? null,
    estHundredPercent: page.estHundredPercent ?? null,
    emotePrefix: page.emotePrefix ?? null,
    ratingCategories: page.ratingCategories ?? [],
    majRatingCategories: page.majRatingCategories ?? [],
    tags: page.tags ?? [],
    flags: page.flags ?? [],
    comments: page.comments ?? [],
    tracks: (page.tracks ?? []).map((song) => ({
      id: song.id,
      slug: song.slug,
      name: song.name,
      url: song.url,
      commentary: song.commentary ?? null,
      bpm: song.bpm ?? null,
      musicalKey: song.musicalKey ?? null,
      softwareUsed: song.softwareUsed ?? [],
      license: song.license ?? null,
      allowDownload: Boolean(song.allowDownload),
      allowBackgroundUse: Boolean(song.allowBackgroundUse),
      allowBackgroundUseAttribution: Boolean(song.allowBackgroundUseAttribution),
      tags: song.tags ?? [],
      flags: song.flags ?? [],
      links: song.links ?? [],
      credits: (song.credits ?? []).map((credit) => ({
        ...credit,
      })),
      composerId: song.composerId ?? song.composer?.id ?? 0,
      composer: song.composer,
      game,
    })) as any,
  };
}
