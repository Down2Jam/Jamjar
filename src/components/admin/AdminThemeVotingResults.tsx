"use client";

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

function formatVote(score?: number) {
  if (score === 3) return "Star (+3)";
  if (score === 1) return "Like (+1)";
  if (score === 0) return "Skip (0)";
  return "No vote";
}

export default function AdminThemeVotingResults() {
  const { data, isLoading: loading } = useThemes(true);
  const themes: ThemeWithScore[] = data ?? [];

  const rankedThemes = useMemo(() => {
    return [...themes].sort(
      (a, b) => (b.slaughterScoreSum ?? 0) - (a.slaughterScoreSum ?? 0)
    );
  }, [themes]);

  const starVotes = useMemo(() => {
    return rankedThemes.filter(
      (theme) => theme.votes2 && theme.votes2[0]?.voteScore === 3
    ).length;
  }, [rankedThemes]);

  return (
    <main className="flex flex-col gap-6 pb-10">
      <section className="flex flex-col gap-3">
        <Vstack align="stretch" gap={1}>
          <Text size="3xl" weight="bold">
            Theme Voting Preview
          </Text>
          <Text size="sm" color="textFaded">
            Review the shortlist for the voting round and your current votes.
          </Text>
        </Vstack>
        <Hstack wrap>
          <Button href="/theme-voting" icon="arrowupright">
            Open Voting Page
          </Button>
          <Text size="sm" color="textFaded">
            {rankedThemes.length} themes - {starVotes} starred by you
          </Text>
        </Hstack>
      </section>

      <Card>
        <Vstack align="stretch" gap={3}>
          <Text size="lg" weight="semibold">
            Voting Shortlist
          </Text>
          {loading ? (
            <Spinner />
          ) : rankedThemes.length === 0 ? (
            <Text size="sm" color="textFaded">
              No voting data available yet.
            </Text>
          ) : (
            <Table>
              <TableHeader>
                <TableColumn>Rank</TableColumn>
                <TableColumn>Theme</TableColumn>
                <TableColumn>Seed Score</TableColumn>
                <TableColumn>Your Vote</TableColumn>
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
                      {formatVote(theme.votes2?.[0]?.voteScore)}
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
