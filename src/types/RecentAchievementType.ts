export type AchievementRarityTier =
  | "Abyssal"
  | "Diamond"
  | "Gold"
  | "Silver"
  | "Bronze"
  | "Default";

export interface RecentAchievementType {
  achievement: {
    id: number;
    name: string;
    description?: string | null;
    image?: string | null;
  };
  user: {
    id: number;
    slug: string;
    name: string;
    profilePicture?: string | null;
  };
  game: {
    id: number;
    slug: string;
    name: string;
    thumbnail?: string | null;
    pageVersion: "JAM" | "POST_JAM";
  };
  earnedAt: string;
  earnedCount: number;
  engagedCount: number;
  earnedPercent: number;
  tier: AchievementRarityTier;
  rank: number;
}
