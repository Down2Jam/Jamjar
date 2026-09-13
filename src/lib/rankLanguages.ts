import type { LanguageInfo } from "../types/LanguageInfoType";

export function rankLanguages(
  languages: LanguageInfo[],
  usage: Record<string, number>,
  coverage: Record<string, number>,
) {
  return languages.map((language) => ({
    ...language,
    usageCount: usage[language.key] ?? 0,
    coverage: coverage[language.key] ?? 0,
  })).sort((a, b) => {
    if (a.key === "en") return -1;
    if (b.key === "en") return 1;
    return b.usageCount - a.usageCount || b.coverage - a.coverage || a.key.localeCompare(b.key);
  });
}
