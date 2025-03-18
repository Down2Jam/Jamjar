import { UserType } from "./UserType";

export interface TeamApplicationType {
  id: number;
  teamId: number;
  userId: number;
  user: UserType;
  content: string;
}
