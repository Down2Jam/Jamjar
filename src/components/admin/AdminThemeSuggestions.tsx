"use client";

import { useTranslations as useUiTranslations } from "@/compat/next-intl";


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
  const uiText = useUiTranslations();
  const { data, isLoading: loading } = useThemes(false);
  const themes: ThemeType[] = data ?? [];

  return (
    <main className="flex flex-col gap-6 pb-10">
      <section className="flex flex-col gap-3">
        <Vstack align="stretch" gap={1}>
          <Text size="3xl" weight="bold">
             {uiText("Navbar.ThemeSuggestions.Title")} </Text>
          <Text size="sm" color="textFaded">
             {uiText("AppStrings.ReviewNewThemeIdeasAndKeepTabsOn")} </Text>
        </Vstack>
        <Hstack wrap>
          <Button href="/theme-suggestions" icon="arrowupright">
             {uiText("AppStrings.OpenSuggestionsPage")} </Button>
          <Text size="sm" color="textFaded">
            {themes.length}  {uiText("AppStrings.SuggestionsLoaded")} </Text>
        </Hstack>
      </section>

      <Card>
        <Vstack align="stretch" gap={3}>
          <Text size="lg" weight="semibold">
             {uiText("AppStrings.Suggestions")} </Text>
          {loading ? (
            <Spinner />
          ) : themes.length === 0 ? (
            <Text size="sm" color="textFaded">
               {uiText("AppStrings.NoSuggestionsFoundYet")} </Text>
          ) : (
            <Table>
              <TableHeader>
                <TableColumn>{uiText("RatingCategory.Theme.Title")}</TableColumn>
                <TableColumn>{uiText("AppStrings.Clarification")}</TableColumn>
              </TableHeader>
              <TableBody>
                {themes.map((theme) => (
                  <TableRow key={theme.id}>
                    <TableCell className="capitalize">
                      {theme.suggestion}
                    </TableCell>
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
