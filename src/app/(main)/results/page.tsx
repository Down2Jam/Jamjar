import { useTranslations as useUiTranslations } from "@/compat/next-intl";
import Results from "@/components/results";
import { Suspense } from "react";

export default function GamesPage() {
  const uiText = useUiTranslations();
  return (
    <Suspense fallback={<div>{uiText("ThemeSuggestions.Loading.Title")}</div>}>
      <Results />
    </Suspense>
  );
}
