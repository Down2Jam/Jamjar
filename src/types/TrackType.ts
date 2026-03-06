import { GameType } from "./GameType";
import { UserType } from "./UserType";

export interface TrackType {
  id: number;
  slug: string;
  name: string;
  url: string;
  license?: string | null;
  allowDownload?: boolean;
  composerId: number;
  composer: UserType;
  gameId: number;
  game: GameType;
  image: string;
}
