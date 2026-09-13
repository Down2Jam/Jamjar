"use client";

import { useTranslations as useUiTranslations } from "@/compat/next-intl";


import { useMemo } from "react";
import { useThemes } from "@/hooks/queries";
import type { ThemeType } from "@/types/ThemeType";
import {
  Button,
  Card,
  Hstack,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  Text,
  Vstack,
} from "bioloom-ui";

type ThemeWithScore = ThemeType & {
  slaughterScoreSum?: number;
};

export default function AdminThemeEliminationResults() {
  const uiText = useUiTranslations();
  const { data, isLoading: loading } = useThemes(true, true, true);
  const themes: ThemeWithScore[] = data ?? [];

  const rankedThemes = useMemo(() => {
    return [...themes].sort(
      (a, b) => (b.slaughterScoreSum ?? 0) - (a.slaughterScoreSum ?? 0)
    );
  }, [themes]);

  const topScore = rankedThemes[0]?.slaughterScoreSum ?? 0;

  return (
    <main className="flex flex-col gap-6 pb-10">
      <section className="flex flex-col gap-3">
        <Vstack align="stretch" gap={1}>
          <Text size="3xl" weight="bold">
             {uiText("AppStrings.ThemeEliminationResults")} </Text>
          <Text size="sm" color="textFaded">
             {uiText("AppStrings.ReviewEveryThemeAndScoreFromTheEliminationRound")} </Text>
        </Vstack>
        <Hstack wrap>
          <Button href="/theme-elimination" icon="arrowupright">
             {uiText("AppStrings.OpenEliminationPage")} </Button>
          <Text size="sm" color="textFaded">
            {rankedThemes.length}  {uiText("AppStrings.ThemesTopScore")} {topScore}
          </Text>
        </Hstack>
      </section>

      <Card>
        <Vstack align="stretch" gap={3}>
          <Text size="lg" weight="semibold">
             {uiText("AppStrings.AllEliminationResults")} </Text>
          {loading ? (
            <Spinner />
          ) : rankedThemes.length === 0 ? (
            <Text size="sm" color="textFaded">
               {uiText("AppStrings.NoEliminationResultsAvailableYet")} </Text>
          ) : (
            <Table>
              <TableHeader>
                <TableColumn>{uiText("AppStrings.Rank")}</TableColumn>
                <TableColumn>{uiText("RatingCategory.Theme.Title")}</TableColumn>
                <TableColumn>{uiText("LeaderboardType.Score.Title")}</TableColumn>
                <TableColumn>{uiText("AppStrings.Clarification")}</TableColumn>
              </TableHeader>
              <TableBody>
                {rankedThemes.map((theme, index) => (
                  <TableRow key={theme.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell className="capitalize">
                      {theme.suggestion}
                    </TableCell>
                    <TableCell>{theme.slaughterScoreSum ?? 0}</TableCell>
                    <TableCell>
                      <Text size="sm" color="textFaded">
                        {theme.description || uiText("AppStrings.NoClarificationProvided")}
                      </Text>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Vstack>
      </Card>
    </main>
  );
}
