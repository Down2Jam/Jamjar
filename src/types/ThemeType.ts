import { ThemeVoteType } from "./ThemeVoteType";

export interface ThemeType {
  id: number;
  suggestion: string;
  votes?: Array<ThemeVoteType>;
}
