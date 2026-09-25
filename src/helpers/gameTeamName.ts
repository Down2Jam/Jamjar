export function getGameTeamName(
  team: {
    name?: string | null;
    owner?: { name?: string | null } | null;
    users?: unknown[] | null;
  } | null | undefined,
  formatOwnerTeam: (ownerName: string) => string,
) {
  if (team?.name) return team.name;

  const ownerName = team?.owner?.name;
  if (!ownerName) return null;

  return team.users?.length === 1
    ? ownerName
    : formatOwnerTeam(ownerName);
}
