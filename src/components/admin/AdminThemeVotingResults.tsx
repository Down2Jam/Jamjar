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
  score: number;
};

const THEME_VOTING_ROUND_SIZE = 15;

function calculateScore(votes2?: ThemeType["votes2"]) {
  return (votes2 ?? []).reduce((sum, vote) => sum + vote.voteScore, 0);
}

function summarizeVotes(votes2?: ThemeType["votes2"]) {
  const votes = votes2 ?? [];
  if (votes.length === 0) return "No votes";

  const stars = votes.filter((vote) => vote.voteScore === 3).length;
  const likes = votes.filter((vote) => vote.voteScore === 1).length;
  const skips = votes.filter((vote) => vote.voteScore === 0).length;

  return `${votes.length} votes (${stars} star, ${likes} like, ${skips} skip)`;
}

export default function AdminThemeVotingResults() {
  const uiText = useUiTranslations();
  const { data, isLoading: loading } = useThemes(true, true, true);
  const themes = data ?? [];

  const rankedThemes = useMemo(() => {
    return themes
      .slice(0, THEME_VOTING_ROUND_SIZE)
      .map<ThemeWithScore>((theme) => ({
        ...theme,
        score: calculateScore(theme.votes2),
      }))
      .sort(
        (a, b) =>
          b.score - a.score ||
          (b.slaughterScoreSum ?? 0) - (a.slaughterScoreSum ?? 0) ||
          a.id - b.id,
      );
  }, [themes]);

  const totalVotes = useMemo(() => {
    return rankedThemes.reduce(
      (sum, theme) => sum + (theme.votes2?.length ?? 0),
      0
    );
  }, [rankedThemes]);

  return (
    <main className="flex flex-col gap-6 pb-10">
      <section className="flex flex-col gap-3">
        <Vstack align="stretch" gap={1}>
          <Text size="3xl" weight="bold">
             {uiText("AppStrings.ThemeVotingPreview")} </Text>
          <Text size="sm" color="textFaded">
             {uiText("AppStrings.ReviewTheShortlistForTheVotingRoundAndTheTotalVotesCast")} </Text>
        </Vstack>
        <Hstack wrap>
          <Button href="/theme-voting" icon="arrowupright">
             {uiText("AppStrings.OpenVotingPage")} </Button>
          <Text size="sm" color="textFaded">
            {rankedThemes.length}  {uiText("AppStrings.Themes")} {totalVotes}  {uiText("AppStrings.TotalVotesCast")} </Text>
        </Hstack>
      </section>

      <Card>
        <Vstack align="stretch" gap={3}>
          <Text size="lg" weight="semibold">
             {uiText("AppStrings.VotingShortlist")} </Text>
          {loading ? (
            <Spinner />
          ) : rankedThemes.length === 0 ? (
            <Text size="sm" color="textFaded">
               {uiText("AppStrings.NoVotingDataAvailableYet")} </Text>
          ) : (
            <Table>
              <TableHeader>
                <TableColumn>{uiText("AppStrings.Rank")}</TableColumn>
                <TableColumn>{uiText("RatingCategory.Theme.Title")}</TableColumn>
                <TableColumn>{uiText("LeaderboardType.Score.Title")}</TableColumn>
                <TableColumn>{uiText("AppStrings.SeedScore")}</TableColumn>
                <TableColumn>{uiText("AppStrings.Votes")}</TableColumn>
              </TableHeader>
              <TableBody>
                {rankedThemes.map((theme, index) => (
                  <TableRow key={theme.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell className="capitalize">
                      {theme.suggestion}
                    </TableCell>
                    <TableCell>{theme.score}</TableCell>
                    <TableCell>{theme.slaughterScoreSum ?? 0}</TableCell>
                    <TableCell>{summarizeVotes(theme.votes2)}</TableCell>
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
