import { useQuery } from "@tanstack/react-query";
import { BASE_URL } from "@/requests/config";
import { loadLanguages } from "@/lib/loadLanguages";
import { rankLanguages } from "@/lib/rankLanguages";
import coverage from "@/messages/coverage.json";
import type { LanguageInfo } from "@/types/LanguageInfoType";

const availableLanguages: LanguageInfo[] = loadLanguages();
export const languageUsageKey = ["languageUsage"] as const;

export function useLanguages(languages = availableLanguages) {
  const query = useQuery({
    queryKey: languageUsageKey,
    queryFn: async (): Promise<Record<string, number>> => {
      const response = await fetch(`${BASE_URL}/languages`);
      if (!response.ok) throw new Error("Couldn't load language usage.");
      const { data } = await response.json() as { data: { key: string; usageCount: number }[] };
      return Object.fromEntries(data.map(({ key, usageCount }) => [key, usageCount]));
    },
    staleTime: 60_000,
  });
  return { ...query, languages: rankLanguages(languages, query.data ?? {}, coverage) };
}
