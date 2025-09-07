"use client";

import { hasCookie } from "@/helpers/cookie";
import {
  addToast,
  Form,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  useDisclosure,
} from "@heroui/react";
import { redirect } from "next/navigation";
import { useEffect, useState } from "react";
import { UserType } from "@/types/UserType";
import { getSelf, searchUsers } from "@/requests/user";
import { RoleType } from "@/types/RoleType";
import { getTeamRoles, getTeamsUser, updateTeam } from "@/requests/team";
import { TeamType } from "@/types/TeamType";
import {
  createTeam,
  deleteTeam,
  inviteToTeam,
  leaveTeam,
} from "@/helpers/team";
import { TeamInviteType } from "@/types/TeamInviteType";
import { ActiveJamResponse, getCurrentJam } from "@/helpers/jam";
import { Card } from "@/framework/Card";
import Text from "@/framework/Text";
import { Button } from "@/framework/Button";
import { Hstack, Vstack } from "@/framework/Stack";
import { Input } from "@/framework/Input";
import Dropdown from "@/framework/Dropdown";
import Icon from "@/framework/Icon";
import { Textarea } from "@/framework/Textarea";
import { Spinner } from "@/framework/Spinner";
import { Switch } from "@/framework/Switch";
import { useTheme } from "@/providers/SiteThemeProvider";
import { Avatar } from "@/framework/Avatar";
import { Chip } from "@/framework/Chip";

export default function EditTeamPage() {
  const [wantedRoles, setWantedRoles] = useState<Set<string>>(new Set());
  const [roles, setRoles] = useState<RoleType[]>([]);
  const [user, setUser] = useState<UserType>();
  const [applicationsOpen, setApplicationsOpen] = useState<boolean>(false);
  const [teams, setTeams] = useState<TeamType[]>();
  const [loading, setLoading] = useState<boolean>(true);
  const [authorSearch, setAuthorSearch] = useState("");
  const [selectedAuthor, setSelectedAuthor] = useState<UserType>();
  const [searchResults, setSearchResults] = useState<Array<UserType>>([]);
  const [selectedTeam, setSelectedTeam] = useState<number>(0);
  const [waitingSave, setWaitingSave] = useState(false);
  const [description, setDescription] = useState<string>("");
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [body, setBody] = useState<string>("");
  const [users, setUsers] = useState<UserType[]>([]);
  const [invitations, setInvitations] = useState<TeamInviteType[]>([]);
  const [activeJamResponse, setActiveJamResponse] =
    useState<ActiveJamResponse | null>(null);
  const [name, setName] = useState<string>("");
  const { colors } = useTheme();
  const [hoveredUserId, setHoveredUserId] = useState<number | null>(null);

  // Fetch the current jam phase using helpers/jam
  useEffect(() => {
    const fetchCurrentJamPhase = async () => {
      try {
        const activeJam = await getCurrentJam();
        setActiveJamResponse(activeJam); // Set active jam details
      } catch (error) {
        console.error("Error fetching current jam:", error);
      } finally {
      }
    };

    fetchCurrentJamPhase();
  }, []);

  useEffect(() => {
    loadUser();
    async function loadUser() {
      try {
        if (!hasCookie("token")) {
          setUser(undefined);
          redirect("/");
          return;
        }

        const response = await getSelf();

        const jamResponse = await getCurrentJam();
        const currentJam = jamResponse?.jam;

        if (response.status == 200) {
          const data = await response.json();
          setUser(data);
        } else {
          setUser(undefined);
        }

        const teamResponse = await getTeamsUser();

        if (teamResponse.status == 200) {
          const data = await teamResponse.json();
          const filteredData = data.data.filter(
            (team: TeamType) => team.jamId == currentJam?.id
          );
          setTeams(filteredData);

          if (filteredData.length > 0) {
            setApplicationsOpen(filteredData[0].applicationsOpen);
            setUsers(filteredData[0].users);
            setInvitations(filteredData[0].invites);
            setDescription(filteredData[0].description);
            setName(filteredData[0].name);
            setWantedRoles(
              new Set(
                filteredData[0].rolesWanted.map((role: RoleType) => role.slug)
              ) ?? new Set()
            );
          }
        } else {
          setTeams(undefined);
        }

        const rolesResponse = await getTeamRoles();

        if (rolesResponse.status == 200) {
          const data = await rolesResponse.json();
          setRoles(data.data);
        } else {
          setRoles([]);
        }

        setLoading(false);
      } catch (error) {
        console.error(error);
      }
    }
  }, []);

  function changeTeam(newid: number) {
    setSelectedTeam(newid);

    if (!teams) return;

    setApplicationsOpen(teams[newid].applicationsOpen);
    setDescription(teams[newid].description);
    setName(teams[newid].name);
    setUsers(teams[newid].users);
    setInvitations(teams[newid].invites);
    setWantedRoles(
      new Set(teams[newid].rolesWanted.map((role: RoleType) => role.slug)) ??
        new Set()
    );
  }

  const handleAuthorSearch = async (query: string) => {
    if (query.length < 3) return;
    const response = await searchUsers(query);
    if (response.ok) {
      const data = await response.json();
      setSearchResults(data);
    }
  };

  if (!user)
    return (
      <Vstack>
        <Card className="max-w-96">
          <Vstack>
            <Vstack gap={0}>
              <Hstack>
                <Icon name="userx" />
                <Text size="xl">User not found</Text>
              </Hstack>
              <Text color="textFaded">Please sign in to view your team</Text>
            </Vstack>
            <Hstack>
              <Button href="/signup" color="blue" icon="userplus">
                Themes.Signup
              </Button>
              <Button href="/login" color="pink" icon="login">
                Themes.Login
              </Button>
            </Hstack>
          </Vstack>
        </Card>
      </Vstack>
    );

  if (loading) {
    return (
      <Vstack>
        <Card className="max-w-96">
          <Vstack>
            <Hstack>
              <Spinner />
              <Text size="xl">Loading</Text>
            </Hstack>
            <Text color="textFaded">Loading team page...</Text>
          </Vstack>
        </Card>
      </Vstack>
    );
  }

  if (!teams || teams.length == 0)
    return (
      <Vstack>
        <Card className="max-w-96">
          <Vstack>
            <Vstack gap={0}>
              <Hstack>
                <Icon name="userx" />
                <Text size="xl">No Team Found</Text>
              </Hstack>
              <Text color="textFaded">
                You are not part of a team, please join or create one
              </Text>
            </Vstack>
            <Hstack>
              <Button href="/team-finder" color="green" icon="users">
                Go to Team Finder
              </Button>
              <Button
                onClick={async () => {
                  const successful = await createTeam();
                  if (successful) {
                    redirect("/team");
                  }
                }}
                color="yellow"
                icon="userplus"
              >
                Create Team
              </Button>
            </Hstack>
          </Vstack>
        </Card>
      </Vstack>
    );

  return (
    <div className="flex items-center justify-center">
      <Form
        className="w-full max-w-2xl flex flex-col gap-4"
        onReset={() => {
          setApplicationsOpen(teams[selectedTeam].applicationsOpen);
          setDescription(teams[selectedTeam].description);
          setName(teams[selectedTeam].name);
          setUsers(teams[selectedTeam].users);
          setInvitations(teams[selectedTeam].invites);
          setWantedRoles(
            new Set(
              teams[selectedTeam].rolesWanted.map((role: RoleType) => role.slug)
            ) ?? new Set()
          );
        }}
        onSubmit={async (e) => {
          e.preventDefault();

          setWaitingSave(true);

          const response = await updateTeam(
            teams[selectedTeam].id,
            users,
            invitations,
            applicationsOpen,
            Array.from(wantedRoles),
            description,
            name
          );

          if (response.ok) {
            addToast({
              title: "Changed settings",
            });
            setWaitingSave(false);
          } else {
            addToast({
              title: "Failed to update settings",
            });
            setWaitingSave(false);
          }
        }}
      >
        <Card>
          <Vstack align="start">
            <Hstack>
              <Icon name="users" color="text" />
              <Text size="xl" color="text" weight="semibold">
                Team
              </Text>
            </Hstack>
            <Text size="sm" color="textFaded">
              View and manage your team for the jam
            </Text>
          </Vstack>
        </Card>
        {teams[selectedTeam].ownerId != user.id && (
          <p>You cannot edit the team if you are not the owner</p>
        )}
        {teams.length > 1 && (
          <div className="flex gap-2">
            <Button
              icon="arrowleft"
              onClick={() => {
                changeTeam(selectedTeam - 1);
              }}
              disabled={selectedTeam == 0}
            >
              Previous Team
            </Button>
            <Button
              icon="arrowright"
              onClick={() => {
                changeTeam(selectedTeam + 1);
              }}
              disabled={selectedTeam == teams.length - 1}
            >
              Next Team
            </Button>
          </div>
        )}
        {(!teams[selectedTeam].game ||
          teams[selectedTeam].game.category != "ODA") && (
          <div className="flex gap-2">
            <Button
              icon="user"
              onClick={onOpen}
              disabled={teams[selectedTeam].ownerId != user.id}
            >
              Invite User
            </Button>
            <Button icon="users" href="/team-finder">
              Go to Team Finder
            </Button>
          </div>
        )}
        {users?.map((user2) => (
          <Card key={user2.id} className="min-w-96" href={`/u/${user2.slug}`}>
            <Hstack justify="between">
              <Hstack>
                <Avatar src={user2.profilePicture} />
                <Text>{user2.name}</Text>
              </Hstack>
              {teams[selectedTeam].ownerId == user.id &&
                teams[selectedTeam].ownerId != user2.id && (
                  <Button
                    onClick={() =>
                      setUsers(users.filter((a) => a.id !== user2.id))
                    }
                    icon="x"
                  />
                )}
            </Hstack>
          </Card>
        ))}
        {invitations?.map((invite) => (
          <Card
            key={invite.user.id}
            className="min-w-96"
            href={`/u/${invite.user.slug}`}
          >
            <Hstack justify="between">
              <Hstack>
                <Avatar src={invite.user.profilePicture} />
                <Text>{invite.user.name}</Text>
                <Text>(invited)</Text>
              </Hstack>
              {teams[selectedTeam].ownerId == user.id && (
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    setInvitations(
                      invitations.filter((a) => a.id !== invite.id)
                    );
                  }}
                  icon="x"
                />
              )}
            </Hstack>
          </Card>
        ))}
        <Modal
          isOpen={isOpen}
          onOpenChange={() => {
            setSelectedAuthor(undefined);
            onOpenChange();
          }}
        >
          <ModalContent
            style={{
              backgroundColor: colors["mantle"],
            }}
          >
            {(onClose) => (
              <>
                <ModalHeader>
                  <Vstack align="start">
                    <Text size="xl" color="text">
                      Invitation
                    </Text>
                    <Text size="sm" color="textFaded">
                      Invite a user to your jam team
                    </Text>
                  </Vstack>
                </ModalHeader>
                <ModalBody>
                  <Input
                    placeholder="Search users..."
                    value={authorSearch}
                    onValueChange={(value) => {
                      setAuthorSearch(value);
                      handleAuthorSearch(value);
                    }}
                  />
                  {searchResults.length > 0 && (
                    <Card>
                      <Vstack align="stretch">
                        {searchResults.map((user) => (
                          <div
                            key={user.id}
                            className="flex justify-between items-center p-3 rounded-lg cursor-pointer transition-colors"
                            style={{
                              backgroundColor:
                                hoveredUserId === user.id
                                  ? colors["base"]
                                  : colors["mantle"],
                            }}
                            onMouseEnter={() => setHoveredUserId(user.id)}
                            onMouseLeave={() => setHoveredUserId(null)}
                            onClick={() => {
                              setSelectedAuthor(user);
                              setSearchResults([]);
                              setAuthorSearch("");
                            }}
                          >
                            <Hstack>
                              <Avatar src={user.profilePicture} size={36} />
                              <Vstack gap={0} align="start">
                                <Text>{user.name}</Text>
                                <Text color="textFaded" size="xs">
                                  {user.short || "General.NoDescription"}
                                </Text>
                              </Vstack>
                            </Hstack>
                          </div>
                        ))}
                      </Vstack>
                    </Card>
                  )}
                  {selectedAuthor && (
                    <div>
                      <Chip avatarSrc={selectedAuthor.profilePicture}>
                        {selectedAuthor.name}
                      </Chip>
                    </div>
                  )}
                  <Textarea
                    value={body}
                    onValueChange={setBody}
                    placeholder="Enter invite content"
                  />
                </ModalBody>
                <ModalFooter>
                  <Button color="red" onClick={onClose}>
                    Close
                  </Button>
                  <Button
                    color="blue"
                    onClick={async () => {
                      if (!selectedAuthor) {
                        addToast({
                          title: "You did not select a user to invite",
                        });
                        return;
                      }
                      onClose();

                      const data = await inviteToTeam(
                        teams[selectedTeam].id,
                        selectedAuthor.id,
                        body
                      );

                      if (data) {
                        setInvitations([...invitations, data]);
                      }
                    }}
                  >
                    Invite
                  </Button>
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>
        <Card>
          <Vstack align="start">
            <div>
              <Text color="text">Team Name</Text>
              <Text color="textFaded" size="xs">
                The team name that displays as the game author (and for your
                team on the team finder)
              </Text>
            </div>
            <Input
              placeholder="Enter a team name... (optional)"
              disabled={teams[selectedTeam].ownerId != user.id}
              onValueChange={setName}
              value={name || ""}
            />
          </Vstack>
        </Card>
        <Card>
          <Vstack align="start">
            <div>
              <Text color="text">Description</Text>
              <Text color="textFaded" size="xs">
                A description of the team (and a way to contact you if needed)
                that shows in the team finder
              </Text>
            </div>
            <Textarea
              placeholder="Enter a description... (optional)"
              disabled={teams[selectedTeam].ownerId != user.id}
              onValueChange={setDescription}
              value={description || ""}
              fullWidth={true}
            />
          </Vstack>
        </Card>
        <Card>
          <Hstack>
            <Switch
              checked={applicationsOpen}
              onChange={setApplicationsOpen}
              disabled={teams[selectedTeam].ownerId != user.id}
            />
            <Vstack align="start" gap={0}>
              <Text color="text">Open Applications</Text>
              <Text color="textFaded" size="xs">
                Lets people apply for your team on the team finder
              </Text>
            </Vstack>
          </Hstack>
        </Card>
        <Card>
          <Vstack align="start">
            <div>
              <Text color="text">Wanted Roles</Text>
              <Text color="textFaded" size="xs">
                Roles that the team finder shows that you need
              </Text>
            </div>
            <Dropdown
              position="top"
              multiple
              disabled={teams[selectedTeam].ownerId != user.id}
              selectedValues={wantedRoles}
              onSelectionChange={(selection) => {
                setWantedRoles(selection as Set<string>);
              }}
            >
              {roles.map((secondaryRole) => (
                <Dropdown.Item
                  key={secondaryRole.slug}
                  value={secondaryRole.slug}
                  description={secondaryRole.description}
                >
                  {secondaryRole.name}
                </Dropdown.Item>
              ))}
            </Dropdown>
          </Vstack>
        </Card>
        {teams[selectedTeam].ownerId == user.id && (
          <div className="flex gap-2">
            {waitingSave ? (
              <Spinner />
            ) : (
              <>
                <Button color="blue" type="submit" icon="save">
                  Save
                </Button>
                <Button type="reset" icon="rotateccw">
                  Reset
                </Button>
              </>
            )}
          </div>
        )}
        <div className="flex gap-2 mt-1">
          {teams[selectedTeam].ownerId == user.id &&
            activeJamResponse?.jam?.id == teams[selectedTeam].jamId &&
            activeJamResponse.phase != "Rating" && (
              <Button
                icon="trash"
                onClick={async () => {
                  const successful = await deleteTeam(teams[selectedTeam].id);
                  if (successful) {
                    redirect("/team-finder");
                  }
                }}
              >
                Delete Team
              </Button>
            )}
          {teams[selectedTeam].ownerId != user.id && (
            <Button
              icon="logout"
              onClick={async () => {
                const successful = await leaveTeam(teams[selectedTeam].id);
                if (successful) {
                  redirect("/team-finder");
                }
              }}
            >
              Leave Team
            </Button>
          )}
        </div>
      </Form>
    </div>
  );
}
