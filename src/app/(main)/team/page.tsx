"use client";

import { useTranslations as useUiTranslations } from "@/compat/next-intl";


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
} from "bioloom-ui";
import { redirect, useSearchParams } from "@/compat/next-navigation";
import { type CSSProperties, useEffect, useState } from "react";
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
import { useCurrentJam } from "@/hooks/queries";
import { Card } from "bioloom-ui";
import { Text } from "bioloom-ui";
import { Button } from "bioloom-ui";
import { Hstack, Vstack } from "bioloom-ui";
import { Input } from "bioloom-ui";
import Dropdown from "@/components/game-editing-form/EditorDropdown";
import { Icon } from "bioloom-ui";
import { Textarea } from "bioloom-ui";
import { Spinner } from "bioloom-ui";
import { Switch } from "bioloom-ui";
import { useTheme } from "@/providers/useSiteTheme";
import { Avatar } from "bioloom-ui";
import { readArray, readItem } from "@/requests/helpers";
import { Chip } from "bioloom-ui";

import MusicTabs from "@/app/(main)/music/MusicTabs";
import { getGameTeamName } from "@/helpers/gameTeamName";
import TeamPageCard from "@/components/TeamPageCard";
import EditorFooter from "@/components/game-editing-form/EditorFooter";
import "@/components/form-editor.css";

export default function EditTeamPage() {
  const uiText = useUiTranslations();
  const searchParams = useSearchParams();
  const requestedTeamId = searchParams.get("teamId");
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
  const [selectedSection, setSelectedSection] = useState("general");
  const [waitingSave, setWaitingSave] = useState(false);
  const [description, setDescription] = useState<string>("");
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [body, setBody] = useState<string>("");
  const [users, setUsers] = useState<UserType[]>([]);
  const [invitations, setInvitations] = useState<TeamInviteType[]>([]);
  const { data: activeJamResponse } = useCurrentJam();
  const [name, setName] = useState<string>("");
  const { colors } = useTheme();

  const [hoveredUserId, setHoveredUserId] = useState<number | null>(null);


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

        const currentJam = activeJamResponse?.jam;

        if (response.status == 200) {
          const data = await readItem<UserType>(response);
          setUser(data ?? undefined);
        } else {
          setUser(undefined);
        }

        const teamResponse = await getTeamsUser();

        if (teamResponse.status == 200) {
          const data = await readArray<TeamType>(teamResponse);
          const filteredData = requestedTeamId
            ? data.filter(
                (team: TeamType) => team.id === Number(requestedTeamId),
              )
            : data.filter(
                (team: TeamType) => team.jamId === currentJam?.id,
              );
          setTeams(filteredData);
          setSelectedTeam(0);

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
          setRoles(await readArray<RoleType>(rolesResponse));
        } else {
          setRoles([]);
        }

        setLoading(false);
      } catch (error) {
        console.error(error);
      }
    }
  }, [activeJamResponse, requestedTeamId]);

  function changeTeam(newid: number) {
    setSelectedTeam(newid);

    if (!teams) return;
    if (selectedSection === "finder" && teams[newid].jamId !== activeJamResponse?.jam?.id) setSelectedSection("general");

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
      const data = await readArray<UserType>(response);
      setSearchResults(data);
    }
  };

  if (!user)
    return (
      <TeamPageCard title={uiText("AppStrings.Team")} description={uiText("AppStrings.ViewAndManageYourTeamForTheJam")}>
          <Vstack>
            <Vstack gap={0}>
              <Hstack>
                <Icon name="userx" />
                <Text size="xl">{uiText("AppStrings.UserNotFound")}</Text>
              </Hstack>
              <Text color="textFaded">{uiText("AppStrings.PleaseSignInToViewYourTeam")}</Text>
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
      </TeamPageCard>
    );

  if (loading) {
    return (
      <TeamPageCard title={uiText("AppStrings.Team")} description={uiText("AppStrings.ViewAndManageYourTeamForTheJam")}>
          <Vstack>
            <Hstack>
              <Spinner />
              <Text size="xl">{uiText("AppStrings.Loading")}</Text>
            </Hstack>
            <Text color="textFaded">{uiText("AppStrings.LoadingTeamPage")}</Text>
          </Vstack>
      </TeamPageCard>
    );
  }

  if (!teams || teams.length == 0)
    return (
      <TeamPageCard title={uiText("AppStrings.Team")} description={uiText("AppStrings.ViewAndManageYourTeamForTheJam")}>
          <Vstack>
            <Vstack gap={0}>
              <Hstack>
                <Icon name="userx" />
                <Text size="xl">{uiText("AppStrings.NoTeamFound")}</Text>
              </Hstack>
              <Text color="textFaded">
                 {uiText("AppStrings.YouAreNotPartOfATeamPlease")} </Text>
            </Vstack>
            <Hstack>
              <Button href="/team-finder" color="green" icon="users">
                 {uiText("AppStrings.GoToTeamFinder")} </Button>
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
                 {uiText("AppStrings.CreateTeam")} </Button>
            </Hstack>
          </Vstack>
      </TeamPageCard>
    );

  const selectedTeamData = teams[selectedTeam];
  const isCurrentJamTeam =
    selectedTeamData.jamId === activeJamResponse?.jam?.id;
  const teamGameName = selectedTeamData.game?.name;
  const sameIds = (a: { id: number }[], b: { id: number }[]) =>
    a.length === b.length && a.every(item => b.some(other => item.id === other.id));
  const hasUnsavedChanges = selectedTeamData.ownerId === user.id && (
    name !== selectedTeamData.name || description !== selectedTeamData.description ||
    applicationsOpen !== selectedTeamData.applicationsOpen ||
    !sameIds(users, selectedTeamData.users) || !sameIds(invitations, selectedTeamData.invites) ||
    wantedRoles.size !== selectedTeamData.rolesWanted.length ||
    selectedTeamData.rolesWanted.some(role => !wantedRoles.has(role.slug))
  );

  return (
    <TeamPageCard hasTabs title={uiText("AppStrings.Team")} description={isCurrentJamTeam || !teamGameName ? uiText("AppStrings.ViewAndManageYourTeamForTheJam") : uiText("AppStrings.ViewAndManageYourTeamForValue0", { value0: teamGameName })}>
      <Form style={{ "--music-text": colors.text, "--music-muted": colors.textFaded, "--music-accent": colors.blue } as CSSProperties}
        className={`w-full min-w-0 flex flex-col gap-4 ${hasUnsavedChanges ? "pb-48 sm:pb-32" : ""}`}
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
            setTeams(current => current?.map(team => team.id === selectedTeamData.id ? {
              ...team, name, description, applicationsOpen, users, invites: invitations,
              rolesWanted: roles.filter(role => wantedRoles.has(role.slug)),
            } : team));
            addToast({
              title: uiText("AppStrings.ChangedSettings"),
            });
            setWaitingSave(false);
          } else {
            addToast({
              title: uiText("AppStrings.FailedToUpdateSettings"),
            });
            setWaitingSave(false);
          }
        }}
      >
        {teams[selectedTeam].ownerId != user.id && (
          <p>{uiText("AppStrings.YouCannotEditTheTeamIfYouAre")}</p>
        )}
        <MusicTabs ariaLabel={uiText("AppStrings.Team")} groups={[
          {
            label: "Team sections",
            selected: selectedSection,
            onSelect: setSelectedSection,
            choices: [
              { id: "general", name: uiText("AppStrings.General"), inline: true },
              ...(isCurrentJamTeam ? [{ id: "finder", name: uiText("Navbar.TeamFinder.Title"), inline: true }] : []),
              { id: "members", name: `${uiText("AppStrings.Members")} (${users.length})`, inline: true },
            ],
          },
          {
            label: "Choose team",
            selected: String(selectedTeamData.id),
            onSelect: id => changeTeam(teams.findIndex(team => String(team.id) === id)),
            maxInline: 2,
            choices: teams.map(team => ({
              id: String(team.id),
              name: getGameTeamName(team, owner => uiText("AppStrings.Value0STeam2", { value0: owner })) || uiText("AppStrings.Team"),
              inline: true,
            })),
          },
        ]} />
          {selectedSection === "general" && <section aria-label={uiText("AppStrings.General")}>
            <div className="form-editor-panel settings-editor-panel">
              <div className="game-editor-panel-heading">
                <Vstack align="start">
                  <Hstack><Icon name="cog" size={28} /><Text size="2xl" color="text" weight="bold">{uiText("AppStrings.General")}</Text></Hstack>
                  <Text size="sm" color="textFaded">{isCurrentJamTeam || !teamGameName ? uiText("AppStrings.ViewAndManageYourTeamForTheJam") : uiText("AppStrings.ViewAndManageYourTeamForValue0", { value0: teamGameName })}</Text>
                </Vstack>
              </div>
        <div className="game-editor-row">
          <Vstack align="start">
            <div>
              <Text color="text">{uiText("AppStrings.TeamName")}</Text>
              <Text color="textFaded" size="xs">
                {isCurrentJamTeam || !teamGameName
                  ? uiText("AppStrings.TheTeamNameThatDisplaysAsTheGameAuthorAndForYourTeamOnTheTeamFinder")
                  : uiText("AppStrings.TheTeamNameDisplayedAsTheAuthorOfValue0", { value0: teamGameName })}
              </Text>
            </div>
            <Input
              placeholder={uiText("AppStrings.EnterATeamNameOptional")}
              disabled={teams[selectedTeam].ownerId != user.id}
              onValueChange={setName}
              value={name || ""}
            />
          </Vstack>
        </div>
              {teams[selectedTeam].ownerId == user.id &&
                activeJamResponse?.jam?.id == teams[selectedTeam].jamId &&
                activeJamResponse.phase != "Rating" && (
                  <div className="game-editor-block">
                    <Button
                      variant="ghost"
                      color="red"
                      size="sm"
                      icon="trash"
                      onClick={async () => {
                        const successful = await deleteTeam(teams[selectedTeam].id);
                        if (successful) {
                          redirect("/team-finder");
                        }
                      }}
                    >
                      {uiText("AppStrings.DeleteTeam")}
                    </Button>
                  </div>
                )}
            </div>
          </section>}
          {isCurrentJamTeam && selectedSection === "finder" && (
            <section aria-label={uiText("Navbar.TeamFinder.Title")}>
              <div className="form-editor-panel settings-editor-panel">
                <div className="game-editor-panel-heading">
                  <Vstack align="start">
                    <Hstack>
                      <Icon name="search" size={28} />
                      <Text size="2xl" color="text" weight="bold">{uiText("Navbar.TeamFinder.Title")}</Text>
                    </Hstack>
                  </Vstack>
                </div>
            <div className="game-editor-row">
              <Vstack align="start">
                <div>
                  <Text color="text">{uiText("AppStrings.Description")}</Text>
                  <Text color="textFaded" size="xs">
                     {uiText("AppStrings.ADescriptionOfTheTeamAndAWay")} </Text>
                </div>
                <Textarea
                  placeholder={uiText("AppStrings.EnterADescriptionOptional")}
                  disabled={teams[selectedTeam].ownerId != user.id}
                  onValueChange={setDescription}
                  value={description || ""}
                  fullWidth={true}
                />
              </Vstack>
            </div>
            <div className="game-editor-block">
              <Hstack align="start" className="gap-3">
                <Switch
                  checked={applicationsOpen}
                  onChange={setApplicationsOpen}
                  disabled={teams[selectedTeam].ownerId != user.id}
                />
                <Vstack align="start" gap={0}>
                  <Text color="text">{uiText("AppStrings.OpenApplications")}</Text>
                  <Text color="textFaded" size="xs">
                     {uiText("AppStrings.LetsPeopleApplyForYourTeamOnThe")} </Text>
                </Vstack>
              </Hstack>
            </div>
            <div className="game-editor-row">
              <Vstack align="start">
                <div>
                  <Text color="text">{uiText("AppStrings.WantedRoles")}</Text>
                  <Text color="textFaded" size="xs">
                     {uiText("AppStrings.RolesThatTheTeamFinderShowsThatYou")} </Text>
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
            </div>
              </div>
            </section>
          )}
          {selectedSection === "members" && <section aria-label={uiText("AppStrings.Members")}>
            <div className="form-editor-panel settings-editor-panel">
              <div className="game-editor-panel-heading">
                <Vstack align="start">
                  <Hstack><Icon name="users" size={28} /><Text size="2xl" color="text" weight="bold">{uiText("AppStrings.Members")}</Text></Hstack>
                  <Text size="sm" color="textFaded">{uiText("AppStrings.InviteAUserToYourJamTeam")}</Text>
                </Vstack>
              </div>
        {(!teams[selectedTeam].game ||
          teams[selectedTeam].game.category != "ODA") && (
          <div className="game-editor-block flex flex-wrap gap-2">
            <Button
              icon="user"
              onClick={onOpen}
              disabled={teams[selectedTeam].ownerId != user.id}
            >
               {uiText("AppStrings.InviteUser")} </Button>
            {isCurrentJamTeam && (
              <Button icon="users" href="/team-finder">
                 {uiText("AppStrings.GoToTeamFinder")} </Button>
            )}
          </div>
        )}
        {users?.map((user2) => (
          <div key={user2.id} className="game-editor-block">
            <Hstack justify="between" className="gap-3">
              <a href={`/u/${user2.slug}`} className="flex min-w-0 items-center gap-3"><Avatar src={user2.profilePicture} /><Text className="break-words">{user2.name}</Text></a>
              {teams[selectedTeam].ownerId == user.id &&
                teams[selectedTeam].ownerId != user2.id && (
                  <Button
                    onClick={() =>
                      setUsers(users.filter((a) => a.id !== user2.id))
                    }
                    variant="ghost"
                    size="sm"
                    aria-label={uiText("PostCard.Remove.Title")}
                  icon="x"
                  />
                )}
            </Hstack>
          </div>
        ))}
        {invitations?.map((invite) => (
          <div key={invite.user.id} className="game-editor-block">
            <Hstack justify="between" className="gap-3">
              <a href={`/u/${invite.user.slug}`} className="flex min-w-0 flex-wrap items-center gap-3"><Avatar src={invite.user.profilePicture} /><Text className="break-words">{invite.user.name}</Text><Text size="xs" color="textFaded">{uiText("AppStrings.Invited")}</Text></a>
              {teams[selectedTeam].ownerId == user.id && (
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    setInvitations(
                      invitations.filter((a) => a.id !== invite.id)
                    );
                  }}
                  variant="ghost"
                  size="sm"
                  aria-label={uiText("PostCard.Remove.Title")}
                  icon="x"
                />
              )}
            </Hstack>
          </div>
        ))}
            </div>
          </section>}

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
                       {uiText("AppStrings.Invitation")} </Text>
                    <Text size="sm" color="textFaded">
                       {uiText("AppStrings.InviteAUserToYourJamTeam")} </Text>
                  </Vstack>
                </ModalHeader>
                <ModalBody>
                  <Input
                    placeholder={uiText("AppStrings.SearchUsers")}
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
                    placeholder={uiText("AppStrings.EnterInviteContent")}
                  />
                </ModalBody>
                <ModalFooter>
                  <Button color="red" onClick={onClose}>
                     {uiText("AppStrings.Close")} </Button>
                  <Button
                    color="blue"
                    onClick={async () => {
                      if (!selectedAuthor) {
                        addToast({
                          title: uiText("AppStrings.YouDidNotSelectAUserToInvite"),
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
                        setInvitations(current => [...current, data]);
                        setTeams(current => current?.map(team => team.id === selectedTeamData.id
                          ? { ...team, invites: [...team.invites, data] }
                          : team));
                      }
                    }}
                  >
                     {uiText("AppStrings.Invite")} </Button>
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>
        {hasUnsavedChanges && (
          <EditorFooter floating status={uiText("AppStrings.UnsavedChanges")} description={waitingSave ? uiText("AppStrings.Saving") : uiText("AppStrings.SaveYourChangesBeforeLeavingThisPage")}>
            {waitingSave ? <Spinner /> : <>
              <Button variant="ghost" size="sm" style={{ color: colors.blue }} type="submit" icon="save">{uiText("Settings.Save.Title")}</Button>
              <Button variant="ghost" size="sm" type="reset" icon="rotateccw">{uiText("Settings.Reset.Title")}</Button>
            </>}
          </EditorFooter>
        )}
        <div className="flex flex-wrap gap-2 mt-1">
          {teams[selectedTeam].ownerId != user.id && (
            <Button
              variant="ghost"
              color="red"
              size="sm"
              icon="logout"
              onClick={async () => {
                const successful = await leaveTeam(teams[selectedTeam].id);
                if (successful) {
                  redirect("/team-finder");
                }
              }}
            >
               {uiText("AppStrings.LeaveTeam")} </Button>
          )}
        </div>
      </Form>
    </TeamPageCard>
  );
}
