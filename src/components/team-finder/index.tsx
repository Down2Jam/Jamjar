"use client";

import { useEffect, useState } from "react";
import { TeamType } from "@/types/TeamType";
import { getTeams } from "@/requests/team";
import { applyToTeam, createTeam } from "@/helpers/team";
import { redirect } from "next/navigation";
import { getSelf } from "@/requests/user";
import { UserType } from "@/types/UserType";
import { getCurrentJam } from "@/helpers/jam";
import { JamType } from "@/types/JamType";
import { Card } from "@/framework/Card";
import { Button } from "@/framework/Button";
import Text from "@/framework/Text";
import { Chip } from "@/framework/Chip";
import Dropdown from "@/framework/Dropdown";
import Tooltip from "@/framework/Tooltip";
import { Hstack, Vstack } from "@/framework/Stack";
import { Spinner } from "@/framework/Spinner";
import Modal from "@/framework/Modal";
import { Avatar } from "@/framework/Avatar";

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
  const [jam, setJam] = useState<JamType | null>();
  const [isOpen, setIsOpen] = useState<boolean>(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const self = await getSelf();
        const data = await self.json();
        const jamResponse = await getCurrentJam();
        const currentJam = jamResponse?.jam;
        setJam(currentJam);

        if (data.primaryRoles.length > 0) setFilter("Primary Role");
        setUser(data);
      } catch (error) {
        console.error(error);
      }
    }

    fetchData();
  }, []);

  useEffect(() => {
    async function fetchData() {
      if (!user) return;

      try {
        const teamResponse = await getTeams();
        let teams = (await teamResponse.json()).data;
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

        setTeams(teams.filter((team: TeamType) => team.jamId == jam?.id));
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
        setSortSet(true);
      }
    }

    fetchData();
  }, [teamType, filter, user, sortSet, jam]);

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
