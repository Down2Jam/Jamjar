export interface ReactionType {
  id: number;
  slug: string;
  image: string;
  artist?: string | null;
  artistId?: number | null;
  artistUser?: {
    id: number;
    slug: string;
    name: string;
    profilePicture?: string | null;
  } | null;
  scopeType?: "GLOBAL" | "USER" | "GAME";
  scopeUserId?: number | null;
  scopeGameId?: number | null;
  ownerUser?: {
    id: number;
    slug: string;
    name: string;
    profilePicture?: string | null;
  } | null;
  ownerGame?: {
    id: number;
    slug: string;
    name: string;
    thumbnail?: string | null;
  } | null;
  uploaderId?: number | null;
  uploaderUser?: {
    id: number;
    slug: string;
    name: string;
    profilePicture?: string | null;
  } | null;
}

export interface ReactionSummaryType {
  reaction: ReactionType;
  count: number;
  reacted: boolean;
  isFirstReactor?: boolean;
  users?: Array<{
    id: number;
    slug: string;
    name: string;
    profilePicture?: string | null;
  }>;
}
