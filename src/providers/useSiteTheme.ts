import { useContext } from "react";
import { SiteThemeContext } from "./SiteThemeContext";

export function useTheme() {
  const context = useContext(SiteThemeContext);
  if (!context) throw new Error("useTheme must be used within ThemeProvider");
  return context;
}
