export interface SiteThemeType {
  name: string;
  authors: string[];
  type: "Light" | "Dark";
  colors: Record<string, string>;
  hidden?: boolean;
}
