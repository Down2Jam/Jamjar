import languages from "@/data/languages.yaml";
import type { LanguageInfo } from "@/types/LanguageInfoType";

export function loadLanguages() {
  return languages as LanguageInfo[];
}
