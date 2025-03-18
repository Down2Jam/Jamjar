import { RoleType } from "./RoleType";
import { TeamInviteType } from "./TeamInviteType";
import { TeamType } from "./TeamType";

export interface UserType {
  id: number;
  slug: string;
  name: string;
  bio: string;
  profilePicture: string;
  bannerPicture: string;
  createdAt: Date;
  mod: boolean;
  admin: boolean;
  twitch: string;
  primaryRoles: RoleType[];
  secondaryRoles: RoleType[];
  teams: TeamType[];
  teamInvites: TeamInviteType[];
  ownedTeams: TeamType[];
}
