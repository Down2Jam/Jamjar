import { ThemeVoteType } from "./ThemeVoteType";
import { ThemeVoteType2 } from "./ThemeVoteType2";

export interface ThemeType {
  id: number;
  suggestion: string;
  description: string;
  votes?: Array<ThemeVoteType>;
  votes2?: Array<ThemeVoteType2>;
}
