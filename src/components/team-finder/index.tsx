"use client";

import { useEffect, useState } from "react";
import {
  Avatar,
  AvatarGroup,
  Card,
  CardBody,
  Spinner,
  Tooltip,
} from "@nextui-org/react";
import { Clipboard } from "lucide-react";
import { TeamType } from "@/types/TeamType";
import { getTeams } from "@/requests/team";
import ButtonAction from "../link-components/ButtonAction";

export default function TeamFinder() {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [teams, setTeams] = useState<TeamType[]>();
  // const [filter, setFilter] = useState<Set<TeamRole>>(new Set());

  useEffect(() => {
    const fetchGameData = async () => {
      try {
        const teamResponse = await getTeams();
        setTeams((await teamResponse.json()).data);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGameData();
  }, []);

  if (isLoading) return <Spinner />;

  return (
    <>
      <section className="mt-4 mb-4">
        <div className="flex justify-between pb-0">
          <div className="flex gap-2">
            {/* <Dropdown backdrop="opaque">
              <DropdownTrigger>
                <Button
                  size="sm"
                  className="text-xs bg-white dark:bg-[#252525] !duration-250 !ease-linear !transition-all text-[#333] dark:text-white"
                  variant="faded"
                >
                  {filter.size > 0 ? "Filter" : "No Filter"}
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                selectionMode="multiple"
                className="text-[#333] dark:text-white"
                selectedKeys={filter}
                onSelectionChange={(selection) => {
                  setFilter(selection as Set<TeamRole>);
                }}
              >
                {Object.entries(filters).map(([key, filter]) => (
                  <DropdownItem
                    key={key}
                    startContent={filter.icon}
                    description={filter.description}
                  >
                    {filter.name}
                  </DropdownItem>
                ))}
              </DropdownMenu>
            </Dropdown> */}
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        {teams ? (
          teams.map((team) => (
            <Card key={team.id}>
              <CardBody className="flex items-center justify-between flex-row gap-3 p-4 min-h-20">
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
                      onPress={() => {}}
                    />
                  )}
                </div>
              </CardBody>
            </Card>
          ))
        ) : (
          <p>No games were found. :(</p>
        )}
      </section>
    </>
  );
}
