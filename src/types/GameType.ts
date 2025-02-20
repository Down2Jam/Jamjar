import { DownloadLinkType } from "./DownloadLinkType";
import { JamType } from "./JamType";
import { UserType } from "./UserType";

export interface GameType {
    id: number;
    slug: string,
    name: string;
    authorId: number;
    author: UserType;
    description?: string;
    thumbnail?: string;
    createdAt: Date;
    updatedAt: Date;
    downloadLinks: DownloadLinkType[];
    contributors: UserType[];
    jam: JamType;
  }
  