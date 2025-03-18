import { TeamType } from "./TeamType";
import { UserType } from "./UserType";

export interface TeamInviteType {
  id: number;
  teamId: number;
  userId: number;
  user: UserType;
  team: TeamType;
  content: string;
}
