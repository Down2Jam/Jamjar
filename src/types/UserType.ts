import { RoleType } from "./RoleType";

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
}
