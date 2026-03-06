"use client";

import { useEffect, useMemo, useState } from "react";
import { getThemes } from "@/requests/theme";
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
  const [themes, setThemes] = useState<ThemeWithScore[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const loadThemes = async () => {
      setLoading(true);
      try {
        const response = await getThemes(true);
        if (!active) return;
        if (response.ok) {
          const data = await response.json();
          setThemes(data.data ?? []);
        } else {
          setThemes([]);
        }
      } catch (error) {
        console.error("Failed to load elimination results", error);
        if (active) setThemes([]);
      } finally {
        if (active) setLoading(false);
      }
    };

    loadThemes();
    return () => {
      active = false;
    };
  }, []);

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
            Theme Elimination Results
          </Text>
          <Text size="sm" color="textFaded">
            Track the highest scoring themes from the elimination round.
          </Text>
        </Vstack>
        <Hstack wrap>
          <Button href="/theme-elimination" icon="arrowupright">
            Open Elimination Page
          </Button>
          <Text size="sm" color="textFaded">
            {rankedThemes.length} themes in shortlist - top score {topScore}
          </Text>
        </Hstack>
      </section>

      <Card>
        <Vstack align="stretch" gap={3}>
          <Text size="lg" weight="semibold">
            Elimination Shortlist
          </Text>
          {loading ? (
            <Spinner />
          ) : rankedThemes.length === 0 ? (
            <Text size="sm" color="textFaded">
              No elimination results available yet.
            </Text>
          ) : (
            <Table>
              <TableHeader>
                <TableColumn>Rank</TableColumn>
                <TableColumn>Theme</TableColumn>
                <TableColumn>Score</TableColumn>
                <TableColumn>Clarification</TableColumn>
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
                        {theme.description || "No clarification provided"}
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
