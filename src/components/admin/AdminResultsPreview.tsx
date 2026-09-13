"use client";

import { useTranslations as useUiTranslations } from "@/compat/next-intl";


import Results from "@/components/results";
import { Button, Card, Hstack, Text, Vstack } from "bioloom-ui";

export default function AdminResultsPreview() {
  const uiText = useUiTranslations();
  return (
    <div className="flex flex-col gap-4">
      <Card>
        <Vstack align="stretch" gap={2}>
          <Text size="2xl" weight="bold">
             {uiText("AppStrings.ResultsPreview")} </Text>
          <Text size="sm" color="textFaded">
             {uiText("AppStrings.ReviewTheResultsLayoutBeforeSharingThePublic")} </Text>
          <Hstack wrap>
            <Button href="/results" icon="arrowupright">
               {uiText("AppStrings.OpenPublicResults")} </Button>
            <Button href="/games" icon="gamepad2" variant="ghost">
               {uiText("AppStrings.BrowseGames")} </Button>
          </Hstack>
        </Vstack>
      </Card>
      <Results preview />
    </div>
  );
}
