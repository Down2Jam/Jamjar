"use client";

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

export default function AdminThemeSuggestions() {
  const { data, isLoading: loading } = useThemes(false);
  const themes: ThemeType[] = data ?? [];

  return (
    <main className="flex flex-col gap-6 pb-10">
      <section className="flex flex-col gap-3">
        <Vstack align="stretch" gap={1}>
          <Text size="3xl" weight="bold">
            Theme Suggestions
          </Text>
          <Text size="sm" color="textFaded">
            Review new theme ideas and keep tabs on incoming suggestions.
          </Text>
        </Vstack>
        <Hstack wrap>
          <Button href="/theme-suggestions" icon="arrowupright">
            Open Suggestions Page
          </Button>
          <Text size="sm" color="textFaded">
            {themes.length} suggestions loaded
          </Text>
        </Hstack>
      </section>

      <Card>
        <Vstack align="stretch" gap={3}>
          <Text size="lg" weight="semibold">
            Suggestions
          </Text>
          {loading ? (
            <Spinner />
          ) : themes.length === 0 ? (
            <Text size="sm" color="textFaded">
              No suggestions found yet.
            </Text>
          ) : (
            <Table>
              <TableHeader>
                <TableColumn>Theme</TableColumn>
                <TableColumn>Clarification</TableColumn>
              </TableHeader>
              <TableBody>
                {themes.map((theme) => (
                  <TableRow key={theme.id}>
                    <TableCell className="capitalize">
                      {theme.suggestion}
                    </TableCell>
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
