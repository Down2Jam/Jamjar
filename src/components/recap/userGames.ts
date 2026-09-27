export function getUserGamesForJam<T extends { id: number; published: boolean; jamId: number }>(
  user: { teams?: Array<{ game?: T | null }> } | null | undefined,
  jamId: number,
): T[] {
  const games = (user?.teams ?? []).flatMap((team) =>
    team.game?.published && team.game.jamId === jamId ? [team.game] : [],
  );
  return [...new Map(games.map((game) => [game.id, game])).values()];
}
