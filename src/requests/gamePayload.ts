import type { AchievementInput } from "@/types/AchievementType";
import type { LeaderboardInput } from "@/types/LeaderboardType";

// Read responses include game and player relations that do not belong in saves.
export function toAchievementInput({
  id,
  name,
  description,
  image,
}: AchievementInput): AchievementInput {
  return { id: id !== undefined && id > 0 ? id : undefined, name, description, image };
}

export function toLeaderboardInput({
  id,
  name,
  type,
  onlyBest,
  maxUsersShown,
  decimalPlaces,
}: LeaderboardInput): LeaderboardInput {
  return { id, name, type, onlyBest, maxUsersShown, decimalPlaces };
}
