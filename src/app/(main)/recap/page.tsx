import { useTranslations as useUiTranslations } from "@/compat/next-intl";
import Recap from "@/components/recap";
import { Suspense } from "react";

export default function RecapPage() {
  const uiText = useUiTranslations();
  return (
    <Suspense fallback={<div>{uiText("ThemeSuggestions.Loading.Title")}</div>}>
      <Recap />
    </Suspense>
  );
}
