"use client";

import { useEffect, useState } from "react";
import {
  Avatar,
  AvatarGroup,
  Button,
  Card,
  CardBody,
  Chip,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Spinner,
  Textarea,
  Tooltip,
  useDisclosure,
} from "@nextui-org/react";
import { Clipboard, Settings, Settings2, Star, Users2 } from "lucide-react";
import { TeamType } from "@/types/TeamType";
import { getTeams } from "@/requests/team";
import ButtonAction from "../link-components/ButtonAction";
import { applyToTeam, createTeam } from "@/helpers/team";
import ButtonLink from "../link-components/ButtonLink";
import { redirect } from "next/navigation";
import { getIcon } from "@/helpers/icon";
import { getSelf } from "@/requests/user";
import { UserType } from "@/types/UserType";

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
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [body, setBody] = useState<string>("");
  const [selectedTeam, setSelectedTeam] = useState<number>();

  useEffect(() => {
    async function fetchData() {
      try {
        const self = await getSelf();
        const data = await self.json();

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

        if (filter == "Primary Role") {
          teams = teams.filter(
            (team: TeamType) =>
              team.rolesWanted.filter(
                (role) =>
                  user.primaryRoles.filter((userrole) => userrole.id == role.id)
                    .length > 0
              ).length > 0 || team.rolesWanted.length == 0
          );

          if (teams.length == 0) {
            setFilter("Primary or Secondary Role");
          }
        } else if (filter == "Primary or Secondary Role") {
          teams = teams.filter(
            (team: TeamType) =>
              team.rolesWanted.filter(
                (role) =>
                  user.primaryRoles.filter((userrole) => userrole.id == role.id)
                    .length > 0 ||
                  user.secondaryRoles.filter(
                    (userrole) => userrole.id == role.id
                  ).length > 0 ||
                  team.rolesWanted.length == 0
              ).length > 0
          );

          if (teams.length == 0) {
            setFilter("All");
          }
        }

        setTeams(teams);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [teamType, filter, user]);

  if (isLoading) return <Spinner />;

  if (!user) return <p>You are not logged in</p>;

  return (
    <>
      <section className="mt-4 mb-4 flex flex-col gap-3">
        <div className="flex gap-3">
          {user.teams.length > 0 && (
            <ButtonLink name="My Team" icon={<Users2 />} href="/team" />
          )}
          <ButtonAction
            name="Create Team"
            icon={<Users2 />}
            onPress={async () => {
              const successful = await createTeam();
              if (successful) {
                redirect("/team");
              }
            }}
          />
        </div>
        <div className="flex gap-2">
          <Dropdown backdrop="opaque">
            <DropdownTrigger>
              <Button
                size="sm"
                className="text-xs bg-white dark:bg-[#252525] !duration-250 !ease-linear !transition-all text-[#333] dark:text-white"
                variant="faded"
              >
                {teamType}
              </Button>
            </DropdownTrigger>
            <DropdownMenu
              className="text-[#333] dark:text-white"
              onAction={(key) => {
                setTeamType(key as "Open to Applications" | "All");
              }}
            >
              <DropdownItem
                key="Open to Applications"
                startContent={<Clipboard />}
              >
                Open to Applications
              </DropdownItem>
              <DropdownItem key="All" startContent={<Star />}>
                All
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
          <Dropdown backdrop="opaque">
            <DropdownTrigger>
              <Button
                size="sm"
                className="text-xs bg-white dark:bg-[#252525] !duration-250 !ease-linear !transition-all text-[#333] dark:text-white"
                variant="faded"
              >
                {filter}
              </Button>
            </DropdownTrigger>
            <DropdownMenu
              className="text-[#333] dark:text-white"
              onAction={(key) => {
                setFilter(
                  key as "Primary Role" | "Primary or Secondary Role" | "All"
                );
              }}
            >
              <DropdownItem key="Primary Role" startContent={<Settings2 />}>
                Primary Role
              </DropdownItem>
              <DropdownItem
                key="Primary or Secondary Role"
                startContent={<Settings />}
              >
                Primary or Secondary Role
              </DropdownItem>
              <DropdownItem key="All" startContent={<Star />}>
                All
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        {teams && teams.length > 0 ? (
          teams.map((team) => (
            <Card key={team.id}>
              <CardBody className="p-6 gap-3">
                <div className="flex items-center justify-between flex-row gap-3">
                  <div className="flex items-center gap-3">
                    <AvatarGroup>
                      {team.users.map((user) => (
                        <Tooltip key={user.id} content={user.name}>
                          <Avatar
                            size="sm"
                            className="w-6 h-6"
                            src={user.profilePicture}
                            classNames={{
                              base: "bg-transparent",
                            }}
                          />
                        </Tooltip>
                      ))}
                    </AvatarGroup>
                    {team.owner.name}&apos;s Team
                  </div>
                  <div>
                    {team.applicationsOpen && (
                      <ButtonAction
                        name="Apply"
                        icon={<Clipboard />}
                        onPress={() => {
                          setBody("");
                          setSelectedTeam(team.id);
                          onOpen();
                        }}
                      />
                    )}
                  </div>
                </div>
                {team.description && <p>{team.description}</p>}
                {team.rolesWanted.length > 0 && (
                  <div className="flex items-center gap-3">
                    <p>Roles Wanted:</p>
                    {team.rolesWanted.map((role) => (
                      <Chip
                        startContent={getIcon(role.icon, 16)}
                        key={role.id}
                        className="pl-2"
                      >
                        {role.name}
                      </Chip>
                    ))}
                  </div>
                )}
              </CardBody>
            </Card>
          ))
        ) : (
          <p>No teams were found with the given filters</p>
        )}
      </section>
      <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>Application</ModalHeader>
              <ModalBody>
                <Textarea
                  value={body}
                  onValueChange={setBody}
                  placeholder="Enter application content"
                />
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="flat" onPress={onClose}>
                  Close
                </Button>
                <Button
                  color="primary"
                  onPress={() => {
                    onClose();
                    if (!selectedTeam) return;
                    applyToTeam(selectedTeam, body);
                  }}
                >
                  Apply
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
