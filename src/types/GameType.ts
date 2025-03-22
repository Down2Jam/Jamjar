import { DownloadLinkType } from "./DownloadLinkType";
import { JamType } from "./JamType";
import { RatingCategoryType } from "./RatingCategoryType";
import { TeamType } from "./TeamType";

export interface GameType {
  id: number;
  slug: string;
  name: string;
  description?: string;
  thumbnail?: string;
  createdAt: Date;
  updatedAt: Date;
  downloadLinks: DownloadLinkType[];
  jam: JamType;
  category: "ODA" | "REGULAR";
  teamId: number;
  team: TeamType;
  ratingCategories: RatingCategoryType[];
  published: boolean;
  themeJustification: string;
}
