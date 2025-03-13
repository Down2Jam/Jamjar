import { UserType } from "./UserType";

export interface EventType {
  id: number;
  slug: string;
  name: string;
  startTime: Date;
  endTime: Date;
  createdAt: Date;
  updatedAt: Date;
  host: UserType;
  content?: string;
  icon?: string;
  link?: string;
}
