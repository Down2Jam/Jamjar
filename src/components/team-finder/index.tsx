"use client";

import { useEffect, useMemo, useState } from "react";
import { TeamType } from "@/types/TeamType";
import { getTeams } from "@/requests/team";
import { applyToTeam, createTeam } from "@/helpers/team";
import { redirect } from "@/compat/next-navigation";
import { getSelf } from "@/requests/user";
import { UserType } from "@/types/UserType";
import { useCurrentJam } from "@/hooks/queries";
import { getNextJamForHome } from "@/helpers/jamDisplay";
import { Card } from "bioloom-ui";
import { Button } from "bioloom-ui";
import { Text } from "bioloom-ui";
import { Chip } from "bioloom-ui";
import { Dropdown } from "bioloom-ui";
import { Tooltip } from "bioloom-ui";
import { Hstack, Vstack } from "bioloom-ui";
import { Spinner } from "bioloom-ui";
import { Modal } from "bioloom-ui";
import { Avatar } from "bioloom-ui";
import { readItem } from "@/requests/helpers";

type TeamsPageResponse = {
  items?: TeamType[];
  data?: TeamType[] | { items?: TeamType[]; pageInfo?: { hasMore?: boolean; nextCursor?: string | null } };
  meta?: { pageInfo?: { hasMore?: boolean; nextCursor?: string | null } };
  pageInfo?: { hasMore?: boolean; nextCursor?: string | null };
};

function readTeamsPage(json: TeamsPageResponse | TeamType[]) {
  if (Array.isArray(json)) {
    return { items: json, nextCursor: null };
  }
  if (Array.isArray(json.data)) {
    const pageInfo = json.meta?.pageInfo ?? json.pageInfo;
    return {
      items: json.data,
      nextCursor: pageInfo?.hasMore ? pageInfo.nextCursor ?? null : null,
    };
  }
  if (json.data && !Array.isArray(json.data)) {
    const pageInfo = json.data.pageInfo ?? json.meta?.pageInfo ?? json.pageInfo;
    return {
      items: json.data.items ?? [],
      nextCursor: pageInfo?.hasMore ? pageInfo.nextCursor ?? null : null,
    };
  }
  const pageInfo = json.meta?.pageInfo ?? json.pageInfo;
  return {
    items: json.items ?? [],
    nextCursor: pageInfo?.hasMore ? pageInfo.nextCursor ?? null : null,
  };
}

async function loadAllTeams() {
  const teams: TeamType[] = [];
  let cursor: string | null = null;

  do {
    const response = await getTeams(cursor, 50);
    const json = (await response.json()) as TeamsPageResponse | TeamType[];
    const page = readTeamsPage(json);
    teams.push(...page.items);
    cursor = page.nextCursor;
  } while (cursor);

  return teams;
}

export default function TeamFinder() {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [teams, setTeams] = useState<TeamType[]>();
  const [teamType, setTeamType] = useState<"Open to Applications" | "All">(
    "Open to Applications"
  );
  const [filter, setFilter] = useState<
    "Primary Role" | "Primary or Secondary Role" | "All"
  >("All");
  const [user, setUser] = useState<UserType>();
  const [selectedTeam, setSelectedTeam] = useState<number>();
  const [sortSet, setSortSet] = useState<boolean>(false);
  const { data: currentJamData } = useCurrentJam();
  const jam = getNextJamForHome(currentJamData);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const targetJamId = useMemo(() => jam?.id ?? null, [jam?.id]);

  useEffect(() => {
    async function fetchData() {
      try {
        const self = await getSelf();
        const data = await readItem<UserType>(self);
        if (!data) return;

        if ((data.primaryRoles ?? []).length > 0) setFilter("Primary Role");
        setUser(data);
      } catch (error) {
        console.error(error);
      }
    }

    fetchData();
  }, []);

  useEffect(() => {
    async function fetchData() {
      if (!user || !currentJamData) return;

      try {
        let teams = await loadAllTeams();
        if (teamType == "Open to Applications") {
          teams = teams.filter((team: TeamType) => team.applicationsOpen);
        }
        const noRoleTeams = teams.filter(
          (team: TeamType) => team.rolesWanted.length == 0
        );
        teams = teams.filter((team: TeamType) => team.rolesWanted.length != 0);

        const effectiveFilter:
          | "Primary Role"
          | "Primary or Secondary Role"
          | "All" = teamType === "All" ? "All" : filter;

        if (effectiveFilter == "Primary Role") {
          teams = teams.filter(
            (team: TeamType) =>
              team.rolesWanted.filter(
                (role) =>
                  user.primaryRoles.filter((userrole) => userrole.id == role.id)
                    .length > 0
              ).length > 0
          );

          if (teams.length == 0 && !sortSet) {
            setFilter("Primary or Secondary Role");
          }
        } else if (effectiveFilter == "Primary or Secondary Role") {
          teams = teams.filter(
            (team: TeamType) =>
              team.rolesWanted.filter(
                (role) =>
                  user.primaryRoles.filter((userrole) => userrole.id == role.id)
                    .length > 0 ||
                  user.secondaryRoles.filter(
                    (userrole) => userrole.id == role.id
                  ).length > 0
              ).length > 0
          );

          if (teams.length == 0 && !sortSet) {
            setFilter("All");
          }
        }

        teams = [...teams, ...noRoleTeams];

        setTeams(
          targetJamId == null
            ? teams
            : teams.filter((team: TeamType) => team.jamId == targetJamId),
        );
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
        setSortSet(true);
      }
    }

    fetchData();
  }, [teamType, filter, user, sortSet, currentJamData, targetJamId]);

  if (isLoading) {
    return (
      <Vstack>
        <Card className="max-w-96">
          <Vstack>
            <Hstack>
              <Spinner />
              <Text size="xl">Loading</Text>
            </Hstack>
            <Text color="textFaded">Loading team finder...</Text>
          </Vstack>
        </Card>
      </Vstack>
    );
  }

  if (!user) return <p>You are not logged in</p>;

  return (
    <>
      <section className="mt-4 mb-4 flex flex-col gap-3">
        <div className="flex gap-3">
          {user.teams.filter((team) => team.jamId == jam?.id).length > 0 && (
            <Button icon="users2" href="/team">
              My Team
            </Button>
          )}
          <Button
            icon="userplus"
            onClick={async () => {
              const successful = await createTeam();
              if (successful) {
                redirect("/team");
              }
            }}
          >
            Create Team
          </Button>
        </div>
        <div className="flex gap-2">
          <Dropdown
            selectedValue={teamType}
            onSelect={(key) => {
              setTeamType(key as "Open to Applications" | "All");
            }}
          >
            <Dropdown.Item value="Open to Applications" icon="clipboard">
              Open to Applications
            </Dropdown.Item>
            <Dropdown.Item value="All" icon="star">
              All
            </Dropdown.Item>
          </Dropdown>
          {teamType !== "All" && (
            <Dropdown
              selectedValue={filter}
              onSelect={(key) => {
                setFilter(
                  key as "Primary Role" | "Primary or Secondary Role" | "All"
                );
              }}
            >
              <Dropdown.Item value="Primary Role" icon="settings2">
                Primary Role
              </Dropdown.Item>
              <Dropdown.Item value="Primary or Secondary Role" icon="settings">
                Primary or Secondary Role
              </Dropdown.Item>
              <Dropdown.Item value="All" icon="star">
                All
              </Dropdown.Item>
            </Dropdown>
          )}
        </div>
      </section>

      <section className="flex flex-col gap-4">
        {teams && teams.length > 0 ? (
          teams.map((team) => (
            <Card key={team.id}>
              <div className="flex items-center justify-between flex-row gap-3">
                <Hstack>
                  <div>
                    {team.users.map((user) => (
                      <Tooltip key={user.id} content={user.name} position="top">
                        <Avatar size={24} src={user.profilePicture} />
                      </Tooltip>
                    ))}
                  </div>
                  {team.name ? team.name : `${team.owner.name}'s Team`}
                </Hstack>
                <div>
                  {team.applicationsOpen &&
                    (!team.game || team.game.category != "ODA") && (
                      <Button
                        icon="clipboard"
                        onClick={() => {
                          setSelectedTeam(team.id);
                          setIsOpen(true);
                        }}
                      >
                        Apply
                      </Button>
                    )}
                </div>
              </div>
              {team.description && <p>{team.description}</p>}
              {team.rolesWanted.length > 0 && (
                <div className="flex items-center gap-3">
                  <p>Roles Wanted:</p>
                  {team.rolesWanted.map((role) => (
                    <Chip
                      // startContent={getIcon(role.icon, 16)}
                      key={role.id}
                    >
                      {role.name}
                    </Chip>
                  ))}
                </div>
              )}
            </Card>
          ))
        ) : (
          <Text color="textFaded">
            No teams were found with the given filters
          </Text>
        )}
      </section>
      <Modal
        shown={isOpen}
        onClose={() => {
          setIsOpen(false);
        }}
        onSubmit={({ content }) => {
          if (!selectedTeam) return;
          applyToTeam(selectedTeam, content);
        }}
        fields={[
          {
            name: "content",
            label: "Application Content",
            description:
              "The text shown to the team owner when they are choosing to accept or deny your application",
            type: "textarea",
          },
        ]}
      />
    </>
  );
}
