"use client";

import { useEffect, useState } from "react";
import { getCurrentJam, getJams } from "@/helpers/jam";
import type { ActiveJamResponse } from "@/helpers/jam";
import type { JamType } from "@/types/JamType";
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
    (jam.ratingHours ?? 0)
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
  ].join(" | ");
}

export default function AdminJams() {
  const [jams, setJams] = useState<JamType[]>([]);
  const [activeJam, setActiveJam] = useState<ActiveJamResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const loadJams = async () => {
      setLoading(true);
      try {
        const [jamList, currentJam] = await Promise.all([
          getJams(),
          getCurrentJam(),
        ]);
        if (!active) return;

        const sorted = [...jamList].sort((a, b) => {
          const aTime = a.startTime ? new Date(a.startTime).getTime() : 0;
          const bTime = b.startTime ? new Date(b.startTime).getTime() : 0;
          return bTime - aTime;
        });

        setJams(sorted);
        setActiveJam(currentJam ?? null);
      } catch (error) {
        console.error("Failed to load jams", error);
        if (!active) return;
        setJams([]);
        setActiveJam(null);
      } finally {
        if (active) setLoading(false);
      }
    };

    loadJams();
    return () => {
      active = false;
    };
  }, []);

  const activeJamId = activeJam?.jam?.id;
  const totalJamCount = jams.length;

  return (
    <main className="flex flex-col gap-6 pb-10">
      <section className="flex flex-col gap-3">
        <Vstack align="stretch" gap={1}>
          <Text size="3xl" weight="bold">
            Jam Overview
          </Text>
          <Text size="sm" color="textFaded">
            Keep track of jam timelines, phases, and durations.
          </Text>
        </Vstack>
        <Hstack wrap>
          <Chip color="blue" icon="calendar">
            {totalJamCount} tracked jams
          </Chip>
          {activeJam?.jam && (
            <Chip color="green" icon="sparkles">
              Active: {activeJam.jam.name} ({activeJam.phase})
            </Chip>
          )}
        </Hstack>
      </section>

      <Card>
        <Vstack align="stretch" gap={3}>
          <Text size="lg" weight="semibold">
            Jam Timeline
          </Text>
          {loading ? (
            <Spinner />
          ) : jams.length === 0 ? (
            <Text size="sm" color="textFaded">
              No jams available yet.
            </Text>
          ) : (
            <Table>
              <TableHeader>
                <TableColumn>Jam</TableColumn>
                <TableColumn>Start</TableColumn>
                <TableColumn>Phases</TableColumn>
                <TableColumn>Total</TableColumn>
                <TableColumn>Actions</TableColumn>
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
                                Active jam
                              </Text>
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
                        <Text size="sm">{totalHours(jam)}h</Text>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          href={`/admin/results?jam=${jam.id}`}
                          icon="trophy"
                        >
                          Results
                        </Button>
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
