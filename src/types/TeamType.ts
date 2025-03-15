import { UserType } from "./UserType";

export interface TeamType {
  id: number;
  applicationsOpen: boolean;
  owner: UserType;
  jamId: number;
  users: UserType[];
}
