import { createContext } from "react";
import type { SiteThemeType } from "@/types/SiteThemeType";

type ColorsMap = SiteThemeType["colors"];

export interface SiteThemeContextType {
  siteTheme: SiteThemeType;
  colors: ColorsMap;
  allSiteThemes: SiteThemeType[];
  setSiteTheme: (name: string) => void;
  setPreviewedSiteTheme: (name: string | null) => void;
}

export const SiteThemeContext = createContext<
  SiteThemeContextType | undefined
>(undefined);
