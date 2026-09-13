import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/hooks/queries";
import { useLanguagePreview } from "@/providers/LanguagePreviewProvider";
import { updateCurrentLanguage } from "@/requests/language";
import type { UserType } from "@/types/UserType";
import { languageUsageKey } from "./useLanguages";

export function useLanguageSelection() {
  const queryClient = useQueryClient();
  const { selectedLocale, setSelectedLocale, setPreviewLocale } = useLanguagePreview();
  const mutation = useMutation({
    mutationFn: updateCurrentLanguage,
    onSuccess: (_data, locale) => {
      setSelectedLocale(locale);
      queryClient.setQueryData<UserType>(queryKeys.user.self(), (user) => user ? { ...user, locale } : user);
      void queryClient.invalidateQueries({ queryKey: languageUsageKey });
    },
  });
  return { ...mutation, selectedLocale, setPreviewLocale };
}
