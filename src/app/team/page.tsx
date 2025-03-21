"use client";

import { hasCookie } from "@/helpers/cookie";
import {
  Avatar,
  Button,
  Card,
  CardBody,
  Chip,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Form,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Spacer,
  Spinner,
  Switch,
  Textarea,
  useDisclosure,
} from "@nextui-org/react";
import { redirect } from "next/navigation";
import { useEffect, useState } from "react";
import { UserType } from "@/types/UserType";
import { getSelf, searchUsers } from "@/requests/user";
import { getIcon } from "@/helpers/icon";
import { RoleType } from "@/types/RoleType";
import { getTeamRoles, getTeamsUser, updateTeam } from "@/requests/team";
import { TeamType } from "@/types/TeamType";
import {
  ArrowLeft,
  ArrowRight,
  LoaderCircle,
  LogOut,
  Trash,
  User,
} from "lucide-react";
import ButtonAction from "@/components/link-components/ButtonAction";
import { toast } from "react-toastify";
import { deleteTeam, inviteToTeam, leaveTeam } from "@/helpers/team";
import { TeamInviteType } from "@/types/TeamInviteType";

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

        if (response.status == 200) {
          const data = await response.json();
          setUser(data);
        } else {
          setUser(undefined);
        }

        const teamResponse = await getTeamsUser();

        if (teamResponse.status == 200) {
          const data = await teamResponse.json();
          setTeams(data.data);

          if (data.data.length > 0) {
            setApplicationsOpen(data.data[0].applicationsOpen);
            setUsers(data.data[0].users);
            setInvitations(data.data[0].invites);
            setDescription(data.data[0].description);
            setWantedRoles(
              new Set(
                data.data[0].rolesWanted.map((role: RoleType) => role.slug)
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

  if (loading) return <Spinner />;

  if (!user) return <p>User not found (are you logged in?)</p>;

  if (!teams || teams.length == 0) return <p>You are not part of a team</p>;

  return (
    <div className="flex items-center justify-center">
      <Form
        className="w-full max-w-2xl flex flex-col gap-4 text-[#333] dark:text-white"
        onReset={() => {
          setApplicationsOpen(teams[selectedTeam].applicationsOpen);
          setDescription(teams[selectedTeam].description);
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
            description
          );

          if (response.ok) {
            toast.success("Changed settings");
            setWaitingSave(false);
          } else {
            toast.error("Failed to update settings");
            setWaitingSave(false);
          }
        }}
      >
        <p className="text-3xl">Team</p>
        {teams[selectedTeam].ownerId != user.id && (
          <p>You cannot edit the team if you are not the owner</p>
        )}
        <ButtonAction
          name="Invite User"
          icon={<User />}
          onPress={onOpen}
          isDisabled={teams[selectedTeam].ownerId != user.id}
        />
        {users?.map((user2) => (
          <Card key={user2.id}>
            <CardBody className="gap-3 min-w-96">
              <div className="flex items-center gap-3">
                <Avatar src={user2.profilePicture} />
                <p>{user2.name}</p>
                {teams[selectedTeam].ownerId == user.id &&
                  teams[selectedTeam].ownerId != user2.id && (
                    <button
                      type="button"
                      onClick={() =>
                        setUsers(users.filter((a) => a.id !== user2.id))
                      }
                      className="text-sm hover:text-red-500"
                    >
                      ×
                    </button>
                  )}
              </div>
            </CardBody>
          </Card>
        ))}
        {invitations?.map((invite) => (
          <Card key={user.id}>
            <CardBody className="gap-3 min-w-96">
              <div className="flex items-center gap-3">
                <Avatar src={invite.user.profilePicture} />
                <p>{invite.user.name}</p>
                <p>(invited)</p>
                {teams[selectedTeam].ownerId == user.id && (
                  <button
                    type="button"
                    onClick={() => {
                      setInvitations(
                        invitations.filter((a) => a.id !== invite.id)
                      );
                    }}
                    className="text-sm hover:text-red-500"
                  >
                    ×
                  </button>
                )}
              </div>
            </CardBody>
          </Card>
        ))}
        <Modal
          isOpen={isOpen}
          onOpenChange={() => {
            setSelectedAuthor(undefined);
            onOpenChange();
          }}
        >
          <ModalContent>
            {(onClose) => (
              <>
                <ModalHeader>Invitation</ModalHeader>
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
                    <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-2">
                      {searchResults.map((user) => (
                        <div
                          key={user.id}
                          className="flex justify-between items-center p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded cursor-pointer"
                          onClick={() => {
                            setSelectedAuthor(user);
                            setSearchResults([]);
                            setAuthorSearch("");
                          }}
                        >
                          <span>{user.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {selectedAuthor && <Chip>{selectedAuthor.name}</Chip>}
                  <Textarea
                    value={body}
                    onValueChange={setBody}
                    placeholder="Enter invite content"
                  />
                </ModalBody>
                <ModalFooter>
                  <Button color="danger" variant="flat" onPress={onClose}>
                    Close
                  </Button>
                  <Button
                    color="primary"
                    onPress={async () => {
                      if (!selectedAuthor) {
                        toast.error("You did not select a user to invite");
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
        {/* <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Add Authors</label>
          <Input
            isDisabled={teams[selectedTeam].ownerId != user.id}
            placeholder="Search users..."
            value={authorSearch}
            onValueChange={(value) => {
              setAuthorSearch(value);
              handleAuthorSearch(value);
            }}
          />
          {searchResults.length > 0 && (
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-2">
              {searchResults.map((user) => (
                <div
                  key={user.id}
                  className="flex justify-between items-center p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded cursor-pointer"
                  onClick={() => {
                    if (!selectedAuthors.some((a) => a.id === user.id)) {
                      setSelectedAuthors([...selectedAuthors, user]);
                    }
                    setSearchResults([]);
                    setAuthorSearch("");
                  }}
                >
                  <span>{user.name}</span>
                </div>
              ))}
            </div>
          )}
          <div className="flex flex-wrap gap-2 mt-2">
            {selectedAuthors.map((author) => (
              <div
                key={author.id}
                className="bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-100 px-3 py-1 rounded-full flex items-center gap-2"
              >
                <span>{author.name}</span>
                {((teams[selectedTeam] &&
                  author.id !== teams[selectedTeam].ownerId) ||
                  (!teams[selectedTeam] && author.id !== user?.id)) &&
                  teams[selectedTeam].ownerId == user.id && (
                    <button
                      onClick={() =>
                        setSelectedAuthors(
                          selectedAuthors.filter((a) => a.id !== author.id)
                        )
                      }
                      className="text-sm hover:text-red-500"
                    >
                      ×
                    </button>
                  )}
              </div>
            ))}
          </div>
        </div> */}
        <Textarea
          label="Description"
          labelPlacement="outside"
          placeholder="Enter a description of your team (and a way to contact you) that displays on the team finder"
          isDisabled={teams[selectedTeam].ownerId != user.id}
          onValueChange={setDescription}
          value={description || ""}
        />
        <Switch
          isSelected={applicationsOpen}
          onValueChange={setApplicationsOpen}
          isDisabled={teams[selectedTeam].ownerId != user.id}
        >
          <div className="text-[#333] dark:text-white">
            <p>Open Applications</p>
            <p className="text-sm">
              Lets people apply for your team on the team finder
            </p>
          </div>
        </Switch>
        <div className="text-[#333] dark:text-white flex flex-col gap-3">
          <p>Wanted Roles</p>
          <p className="text-sm">
            Roles that the team finder shows that you need
          </p>
          <div>
            <Dropdown
              backdrop="opaque"
              isDisabled={teams[selectedTeam].ownerId != user.id}
            >
              <DropdownTrigger>
                <Button
                  size="sm"
                  className="text-xs bg-white dark:bg-[#252525] !duration-250 !ease-linear !transition-all text-[#333] dark:text-white"
                  variant="faded"
                >
                  {wantedRoles.size > 0
                    ? Array.from(wantedRoles)
                        .map(
                          (role) =>
                            roles.find((findrole) => findrole.slug == role)
                              ?.name || "Unknown"
                        )
                        .join(", ")
                    : "No Roles"}
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                selectionMode="multiple"
                className="text-[#333] dark:text-white"
                selectedKeys={wantedRoles}
                onSelectionChange={(selection) => {
                  setWantedRoles(selection as Set<string>);
                }}
              >
                {roles.map((secondaryRole) => (
                  <DropdownItem
                    key={secondaryRole.slug}
                    startContent={getIcon(secondaryRole.icon)}
                    description={secondaryRole.description}
                  >
                    {secondaryRole.name}
                  </DropdownItem>
                ))}
              </DropdownMenu>
            </Dropdown>
          </div>
        </div>

        {teams.length > 1 && (
          <div className="flex gap-2">
            <ButtonAction
              iconPosition="start"
              name="Previous Team"
              icon={<ArrowLeft />}
              onPress={() => {
                changeTeam(selectedTeam - 1);
              }}
              isDisabled={selectedTeam == 0}
            />
            <ButtonAction
              name="Next Team"
              icon={<ArrowRight />}
              onPress={() => {
                changeTeam(selectedTeam + 1);
              }}
              isDisabled={selectedTeam == teams.length - 1}
            />
          </div>
        )}
        {teams[selectedTeam].ownerId == user.id && (
          <div className="flex gap-2">
            <Button color="primary" type="submit">
              {waitingSave ? (
                <LoaderCircle className="animate-spin" size={16} />
              ) : (
                <p>Save</p>
              )}
            </Button>
            <Button type="reset" variant="flat">
              Reset
            </Button>
          </div>
        )}
        <Spacer />
        <div className="flex gap-2">
          {teams[selectedTeam].ownerId == user.id && (
            <ButtonAction
              name="Delete Team"
              icon={<Trash />}
              onPress={async () => {
                const successful = await deleteTeam(teams[selectedTeam].id);
                if (successful) {
                  redirect("/team-finder");
                }
              }}
            />
          )}
          {teams[selectedTeam].ownerId != user.id && (
            <ButtonAction
              name="Leave Team"
              icon={<LogOut />}
              onPress={async () => {
                const successful = await leaveTeam(teams[selectedTeam].id);
                if (successful) {
                  redirect("/team-finder");
                }
              }}
            />
          )}
        </div>
      </Form>
    </div>
  );
}
