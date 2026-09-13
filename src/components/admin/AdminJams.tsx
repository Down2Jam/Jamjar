"use client";

import { useTranslations as useUiTranslations } from "@/compat/next-intl";


import { useMemo } from "react";
import { useCurrentJam, useJams } from "@/hooks/queries";
import type { JamType } from "@/types/JamType";
import { getJamUrlValue } from "@/helpers/jamUrl";
import {
  Button,
  Card,
  Chip,
  Hstack,
  Icon,
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

const dateFormat = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
  year: "numeric",
});

function formatDate(value?: string) {
  if (!value) return "Unknown date";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown date";
  return dateFormat.format(date);
}

function totalHours(jam: JamType) {
  return (
    (jam.suggestionHours ?? 0) +
    (jam.slaughterHours ?? 0) +
    (jam.votingHours ?? 0) +
    (jam.jammingHours ?? 0) +
    (jam.submissionHours ?? 0) +
    (jam.ratingHours ?? 0) +
    (jam.postJamRefinementHours ?? 14 * 24) +
    (jam.postJamRatingHours ?? 14 * 24)
  );
}

function formatPhaseHours(jam: JamType) {
  return [
    `Suggestion ${jam.suggestionHours ?? 0}h`,
    `Elimination ${jam.slaughterHours ?? 0}h`,
    `Voting ${jam.votingHours ?? 0}h`,
    `Jamming ${jam.jammingHours ?? 0}h`,
    `Submission ${jam.submissionHours ?? 0}h`,
    `Rating ${jam.ratingHours ?? 0}h`,
    `Post-Jam Refinement ${jam.postJamRefinementHours ?? 14 * 24}h`,
    `Post-Jam Rating ${jam.postJamRatingHours ?? 14 * 24}h`,
  ].join(" | ");
}

export default function AdminJams() {
  const uiText = useUiTranslations();
  const { data: activeJam, isLoading: activeJamLoading } = useCurrentJam();
  const { data: rawJams, isLoading: jamsLoading } = useJams();

  const loading = activeJamLoading || jamsLoading;

  const jams = useMemo(() => {
    const list = Array.isArray(rawJams) ? rawJams : [];
    return [...list].sort((a, b) => {
      const aTime = a.startTime ? new Date(a.startTime).getTime() : 0;
      const bTime = b.startTime ? new Date(b.startTime).getTime() : 0;
      return bTime - aTime;
    });
  }, [rawJams]);

  const activeJamId = activeJam?.jam?.id;
  const totalJamCount = jams.length;

  return (
    <main className="flex flex-col gap-6 pb-10">
      <section className="flex flex-col gap-3">
        <Vstack align="stretch" gap={1}>
          <Text size="3xl" weight="bold">
             {uiText("AppStrings.JamOverview")} </Text>
          <Text size="sm" color="textFaded">
             {uiText("AppStrings.KeepTrackOfJamTimelinesPhasesAndDurations")} </Text>
        </Vstack>
        <Hstack wrap>
          <Chip color="blue" icon="calendar">
            {totalJamCount}  {uiText("AppStrings.TrackedJams")} </Chip>
          {activeJam?.jam && (
            <Chip color="green" icon="sparkles">
               {uiText("AppStrings.Active")} {activeJam.jam.name} ({activeJam.phase})
            </Chip>
          )}
        </Hstack>
      </section>

      <Card>
        <Vstack align="stretch" gap={3}>
          <Text size="lg" weight="semibold">
             {uiText("AppStrings.JamTimeline")} </Text>
          {loading ? (
            <Spinner />
          ) : jams.length === 0 ? (
            <Text size="sm" color="textFaded">
               {uiText("AppStrings.NoJamsAvailableYet")} </Text>
          ) : (
            <Table>
              <TableHeader>
                <TableColumn>{uiText("AppStrings.Jam")}</TableColumn>
                <TableColumn>{uiText("AppStrings.Start")}</TableColumn>
                <TableColumn>{uiText("AppStrings.Phases")}</TableColumn>
                <TableColumn>{uiText("AppStrings.Total")}</TableColumn>
                <TableColumn>{uiText("AppStrings.Actions")}</TableColumn>
              </TableHeader>
              <TableBody>
                {jams.map((jam) => {
                  const isActive = activeJamId === jam.id;
                  return (
                    <TableRow key={jam.id}>
                      <TableCell>
                        <Hstack>
                          <div
                            className="h-8 w-8 rounded-md flex items-center justify-center"
                            style={{
                              backgroundColor: jam.color || "transparent",
                              border: "1px solid rgba(255,255,255,0.1)",
                            }}
                          >
                            <Icon name={jam.icon} size={16} />
                          </div>
                          <Vstack align="start" gap={0}>
                            <Text size="sm">{jam.name}</Text>
                            {isActive && (
                              <Text size="xs" color="textFaded">
                                 {uiText("AppStrings.ActiveJam")} </Text>
                            )}
                          </Vstack>
                        </Hstack>
                      </TableCell>
                      <TableCell>
                        <Text size="sm">{formatDate(jam.startTime)}</Text>
                      </TableCell>
                      <TableCell>
                        <Text size="xs" color="textFaded">
                          {formatPhaseHours(jam)}
                        </Text>
                      </TableCell>
                      <TableCell>
                        <Text size="sm">{totalHours(jam)}{uiText("AppStrings.H")}</Text>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          href={`/admin/results?jam=${getJamUrlValue(jam) || jam.id}`}
                          icon="trophy"
                        >
                           {uiText("Navbar.Results.Title")} </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </Vstack>
      </Card>
    </main>
  );
}
