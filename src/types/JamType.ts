import { UserType } from "./UserType";

export interface JamType {
  id: number;
  name: string;
  suggestionHours: number;
  slaughterHours: number;
  votingHours: number;
  jammingHours: number;
  ratingHours: number;
  startTime: Date;
  createdAt: Date;
  updatedAt: Date;
  themePerUser: number;
  users: UserType[];
}

export enum JamPhase {
  SUGGESTION = "Suggestion",
  SURVIVAL = "Survival",
  VOTING = "Voting",
  JAMMING = "Jamming",
  RATING = "Rating"
}