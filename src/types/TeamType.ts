import { GameType } from "./GameType";
import { RoleType } from "./RoleType";
import { TeamApplicationType } from "./TeamApplicationType";
import { TeamInviteType } from "./TeamInviteType";
import { UserType } from "./UserType";

export interface TeamType {
  id: number;
  applicationsOpen: boolean;
  owner: UserType;
  ownerId: number;
  jamId: number;
  users: UserType[];
  rolesWanted: RoleType[];
  description: string;
  invites: TeamInviteType[];
  applications: TeamApplicationType[];
  game: GameType;
}
