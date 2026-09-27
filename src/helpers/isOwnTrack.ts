import type { TrackType } from "@/types/TrackType";
import type { UserType } from "@/types/UserType";

export function isOwnTrack(track: TrackType, user?: UserType | null): boolean {
  if (!user) return false;

  const gameId = track.gameId ?? track.game?.id;
  const team = track.game?.team;
  return Boolean(
    track.composerId === user.id ||
      track.composer?.id === user.id ||
      team?.ownerId === user.id ||
      team?.users?.some((member) => member.id === user.id) ||
      [...(user.teams ?? []), ...(user.ownedTeams ?? [])].some(
        (userTeam) =>
          (team?.id != null && userTeam.id === team.id) ||
          (gameId != null && userTeam.game?.id === gameId),
      ),
  );
}
