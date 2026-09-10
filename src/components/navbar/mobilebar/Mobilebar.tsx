"use client";

import { useScrollDirection } from "@/hooks/useScrollDirection";
import { Button, Navbar, NavbarItem } from "bioloom-ui";
import { useTheme } from "@/providers/useSiteTheme";
import { Dropdown } from "bioloom-ui";
import { Avatar } from "bioloom-ui";
import { hasCookie } from "@/helpers/cookie";
import {
  queryKeys,
  useCurrentGame,
  useJamParticipation,
  useMessageCounts,
  useSelf,
} from "@/hooks/queries";
import { Badge } from "bioloom-ui";
import { useUnreadNews } from "@/components/news/useUnreadNews";
import SearchBar from "../pcbar/SearchBar";
import { API_DOCS_URL } from "@/requests/config";
import { useJam } from "@/hooks/useJam";
import { isPostJamPhase } from "@/helpers/jamDisplay";
import { joinJam } from "@/helpers/jam";
import { useQueryClient } from "@tanstack/react-query";
import { GameType } from "@/types/GameType";
import { JamType } from "@/types/JamType";

type MobilebarProps = {
  isLoggedIn: boolean;
};

export default function Mobilebar({ isLoggedIn }: MobilebarProps) {
  const direction = useScrollDirection();
  const hidden = direction === "down";
  const { colors } = useTheme();

  const hasToken = hasCookie("token");
  const { data: user } = useSelf(hasToken);
  const { data: messageCounts } = useMessageCounts(Boolean(user));
  const { data: currentGameData } = useCurrentGame(hasToken);
  const hasUnreadNews = useUnreadNews();
  const { jamPhase, jam, nextJam } = useJam();
  const joinableJam = isPostJamPhase(jamPhase) && nextJam ? nextJam : jam;
  const { data: participation } = useJamParticipation(
    joinableJam?.slug,
    Boolean(user),
  );
  const queryClient = useQueryClient();
  const currentJamGame: GameType | null =
    currentGameData && currentGameData.length > 0 ? currentGameData[0] : null;
  const computedIsInJam = user && joinableJam
    ? participation ??
      (user.jams?.filter((userJam: JamType) => userJam.id === joinableJam.id)
        .length ?? 0) > 0
    : false;
  const currentJamTeams = jam
    ? (user?.teams ?? []).filter((team) => team.jamId === jam.id)
    : [];
  const currentJamTeam =
    currentJamTeams.find((team) => team.game?.published) ?? currentJamTeams[0];

  return (
    <Navbar
      className={`${
        hidden ? "translate-y-full" : "translate-y-0"
      } border-t-2 !fixed !top-auto bottom-0 left-0 right-0 z-50 px-4 py-1 duration-500 ease-in-out transition-color shadow-2xl`}
      style={{
        height: "calc(60px + env(safe-area-inset-bottom))",
        paddingBottom: "env(safe-area-inset-bottom)",
        backgroundImage:
          "url(/images/D2J_Icon_watermark.png), url(/images/D2J_Icon_watermark.png)",
        backgroundPositionY: "center, center",
        backgroundPositionX: "0px, right 0px",
        backgroundSize: "210px",
        backgroundRepeat: "no-repeat",
        backgroundColor: colors["crust"],
      }}
      isBordered
    >
      <Button href="/" icon="home" variant="ghost"></Button>
      <Button href="/games" icon="gamepad" variant="ghost"></Button>
      <Dropdown
        position="top"
        trigger={
          user ? (
            <Avatar src={user.profilePicture} />
          ) : (
            <Button
              className="w-14 h-14 max-h-14 max-w-14 min-w-14 min-h-1 rounded-full"
              icon="menu"
              variant="ghost"
            ></Button>
          )
        }
      >
        {user && (
          <Dropdown.Item
            value="profile"
            icon="user"
            href={`/u/${user.slug}`}
            description="View your profile page"
          >
            Profile
          </Dropdown.Item>
        )}
        {user && (
          <Dropdown.Item
            value="settings"
            icon="settings"
            href="/settings"
            description="Manage your preferences"
          >
            Settings
          </Dropdown.Item>
        )}
        {user && (
          <Dropdown.Item
            value="import-game"
            icon="download"
            href="/import-game"
            description="Import a game from itch.io"
          >
            Import Game
          </Dropdown.Item>
        )}
        {user && (
          <Dropdown.Item
            value="create-post"
            icon="squarepen"
            href="/create-post"
            description="Create a post in the forum"
          >
            Create Post
          </Dropdown.Item>
        )}
        {(jamPhase === "Upcoming Jam" ||
          jamPhase === "Post-Jam Refinement" ||
          (jamPhase === "Post-Jam Rating" && !currentJamGame)) && (
          <Dropdown.Item
            value="results"
            icon="trophy"
            href="/recap"
            description="View the results of the last D2Jam"
          >
            Results
          </Dropdown.Item>
        )}
        {jamPhase === "Suggestion" && (
          <Dropdown.Item
            value="theme-suggestions"
            icon="sparkles"
            href="/theme-suggestions"
            description="Submit possible themes for the jam"
          >
            Theme Suggestions
          </Dropdown.Item>
        )}
        {jamPhase === "Elimination" && (
          <Dropdown.Item
            value="theme-elimination"
            icon="swords"
            href="/theme-elimination"
            description="Vote on submitted jam themes"
          >
            Theme Elimination
          </Dropdown.Item>
        )}
        {jamPhase === "Voting" && (
          <Dropdown.Item
            value="theme-voting"
            icon="vote"
            href="/theme-voting"
            description="Vote for the final jam theme"
          >
            Theme Voting
          </Dropdown.Item>
        )}
        {user &&
          jam &&
          computedIsInJam &&
          (jamPhase === "Jamming" ||
            jamPhase === "Submission" ||
            jamPhase === "Rating" ||
            (jamPhase === "Post-Jam Rating" && Boolean(currentJamGame))) && (
            <Dropdown.Item
              value="current-game"
              icon="gamepad2"
              href={currentJamGame ? `/g/${currentJamGame.slug}` : "/create-game"}
              description={
                currentJamGame
                  ? "View the page for your game"
                  : "Create a site page for your game"
              }
            >
              {currentJamGame ? "My Game" : "Create Game"}
            </Dropdown.Item>
          )}
        {user && jam && computedIsInJam && (
          <Dropdown.Item
            value="team"
            icon="users"
            href={currentJamTeam ? "/team" : "/team-finder"}
            description={
              currentJamTeam
                ? "View your team for the jam"
                : "Find a team for the jam"
            }
          >
            {currentJamTeam ? "My Team" : "Team Finder"}
          </Dropdown.Item>
        )}
        {user && joinableJam && !computedIsInJam && (
          <Dropdown.Item
            value="join-jam"
            icon="calendarplus"
            description="Mark that you are participating in the jam"
            onClick={() => {
              void joinJam(joinableJam.id).then((joined) => {
                if (joined) {
                  queryClient.setQueryData(
                    queryKeys.jam.participation(joinableJam.slug),
                    true,
                  );
                }
              });
            }}
          >
            Join Jam
          </Dropdown.Item>
        )}
        {user && (
          <Dropdown.Item
            value="inbox"
            icon="bell"
            href="/inbox/messages"
            description="View your notifications"
          >
            Inbox
          </Dropdown.Item>
        )}
        <Dropdown.Item
          value="about"
          icon="info"
          href="/about"
          description="Information about the game jam"
        >
          About
        </Dropdown.Item>
        <Dropdown.Item
          value="games"
          icon="gamepad"
          href="/games"
          description="All submitted games on the website"
        >
          Games
        </Dropdown.Item>
        <Dropdown.Item
          value="forum"
          icon="messagecircle"
          href="/home"
          description="Chat with other community members"
        >
          Forum
        </Dropdown.Item>
        <Dropdown.Item
          value="themes"
          icon="palette"
          href="/themes"
          description="Browse all community site themes"
        >
          Browse all themes
        </Dropdown.Item>
        <Dropdown.Item
          value="screenshots"
          icon="images"
          href="/screenshots"
          description="Browse random game screenshots"
        >
          Screenshots
        </Dropdown.Item>
        <Dropdown.Item
          value="radio"
          icon="broadcast"
          href="/radio"
          description="Listen to the Down2Jam music radio"
        >
          Radio
        </Dropdown.Item>
        <Dropdown.Item
          value="lucky"
          icon="dice3"
          href="/lucky"
          description="Go to a random game"
        >
          I'm Feeling Lucky
        </Dropdown.Item>
        <Dropdown.Item
          value="news"
          icon="megaphone"
          href="/news"
          description="Read Down2Jam announcements and site updates"
        >
          <span className="inline-flex items-center gap-2">
            News
            {hasUnreadNews && (
              <span
                aria-label="New articles"
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: colors["red"] }}
              />
            )}
          </span>
        </Dropdown.Item>
        <Dropdown.Item
          value="music"
          icon="music"
          href="/music"
          description="All submitted music on the website"
        >
          Music
        </Dropdown.Item>
        <Dropdown.Item
          value="donate"
          icon="heart"
          href="/donate"
          description="View the donation and support page"
        >
          Donate
        </Dropdown.Item>
        <Dropdown.Item
          value="rss"
          icon="rss"
          href="/rss"
          description="View available RSS feeds"
        >
          RSS
        </Dropdown.Item>
        <Dropdown.Item
          value="down2guess"
          icon="gamepad2"
          href="/d2guess"
          description="Guess a Down2Jam game"
        >
          Down2Guess
        </Dropdown.Item>
        <Dropdown.Item
          value="collections"
          icon="layers"
          href="/collections"
          description="Browse saved game and music collections"
        >
          Collections
        </Dropdown.Item>
        <Dropdown.Item
          value="quilts"
          icon="paintbrush"
          href="/quilts"
          description="Make collaborative pixel art together"
        >
          Quilts
        </Dropdown.Item>
        <Dropdown.Item
          value="events"
          icon="calendar"
          href="/events"
          description="Browse community events and streams"
        >
          Events
        </Dropdown.Item>
        <Dropdown.Item
          value="docs"
          icon="bookcopy"
          href="/docs"
          description="Read the site documentation"
        >
          Docs
        </Dropdown.Item>
        <Dropdown.Item
          value="press-kit"
          icon="newspaper"
          href="/press-kit"
          description="View press kit materials"
        >
          Press Kit
        </Dropdown.Item>
        <Dropdown.Item
          value="api-docs"
          icon="code"
          href={API_DOCS_URL}
          target="_blank"
          rel="noopener noreferrer"
          description="Open the Jamcore API documentation"
        >
          API Docs
        </Dropdown.Item>
        <Dropdown.Item
          value="bug"
          icon="bug"
          href="https://github.com/Down2Jam/Jamjar/issues"
          target="_blank"
          rel="noopener noreferrer"
          description="Go to the GitHub repository"
        >
          Report Bug
        </Dropdown.Item>
        {user ? (
          <Dropdown.Item value="logout" icon="logout" href="/logout">
            Logout
          </Dropdown.Item>
        ) : (
          <Dropdown.Item
            value="join"
            icon="login"
            href={isLoggedIn ? "/login" : "/signup"}
          >
            {isLoggedIn ? "Login" : "Sign Up"}
          </Dropdown.Item>
        )}
      </Dropdown>
      <SearchBar compact />
      <NavbarItem>
        {!isLoggedIn ? (
          <Button href="/signup" icon="login" variant="ghost" />
        ) : (
          (user && (user.receivedNotifications.length + (messageCounts?.total ?? 0)) > 0 ? (
            <Badge position="top-right" content={user.receivedNotifications.length + (messageCounts?.total ?? 0)}>
              <Button href="/inbox/messages" icon="bell" variant="ghost" />
            </Badge>
          ) : (
            <Button href="/inbox/messages" icon="bell" variant="ghost" />
          ))
        )}
      </NavbarItem>
    </Navbar>
  );
}
