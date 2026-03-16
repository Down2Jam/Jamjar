/**
 * @file Shows at the top of the screen on PC.
 * Allows the user to navigate around pages on the site.
 *
 * @author Ategon
 * @created 2025-7-22
 */
"use client";
import { Navbar, NavbarContent } from "bioloom-ui";
import SearchBar from "./SearchBar";
import Brand from "./Brand";
import { Divider } from "bioloom-ui";
import NavbarButton from "./NavbarButton";
import { useJam } from "@/hooks/useJam";
import { addToast } from "bioloom-ui";
import { getCurrentJam, joinJam } from "@/helpers/jam";
import NavbarUser from "./NavbarUser";
import { UserType } from "@/types/UserType";
import { useEffect, useState } from "react";
import { hasCookie } from "@/helpers/cookie";
import { getSelf } from "@/requests/user";
import { getCurrentGame } from "@/requests/game";
import { JamType } from "@/types/JamType";
import useBreakpoint from "@/hooks/useBreakpoint";
import LanguageDropdown from "./LanguageDropdown";
import SiteThemeDropdown from "./SiteThemeDropdown";
import { useTheme } from "@/providers/SiteThemeProvider";
import { LanguageInfo } from "@/types/LanguageInfoType";
import { Button } from "bioloom-ui";
import { Badge } from "bioloom-ui";
import { GameType } from "@/types/GameType";

type PCbarProps = {
  isLoggedIn: boolean;
  languages: LanguageInfo[];
};

export default function PCbar({ isLoggedIn, languages }: PCbarProps) {
  const { jamPhase, jam } = useJam();
  const { isLgUp, isXlUp, isMdUp, isLgDown } = useBreakpoint();

  const [isInJam, setIsInJam] = useState<boolean>();
  const [user, setUser] = useState<UserType>();
  const [currentJamGame, setCurrentJamGame] = useState<GameType | null>(null);
  const { siteTheme } = useTheme();

  const currentJamTeams = jam
    ? (user?.teams ?? []).filter((team) => team.jamId == jam.id)
    : [];
  const currentJamTeam =
    currentJamTeams.find((team) => team.game?.published) ?? currentJamTeams[0];

  useEffect(() => {
    if (!isLoggedIn) {
      setUser(undefined);
      setIsInJam(false);
      setCurrentJamGame(null);
      return;
    }

    async function loadData() {
      try {
        const [userResponse, currentGameResponse] = await Promise.all([
          getSelf(),
          getCurrentGame().catch(() => null),
        ]);
        const user = await userResponse.json();

        if (
          jam &&
          user.jams.filter((userjam: JamType) => userjam.id == jam.id).length >
            0
        ) {
          setIsInJam(true);
        } else {
          setIsInJam(false);
        }
        if (userResponse.status == 200) {
          setUser(user);
        } else {
          setUser(undefined);
        }

        if (currentGameResponse?.ok) {
          const payload = await currentGameResponse.json().catch(() => null);
          const games = Array.isArray(payload?.data) ? payload.data : [];
          const preferredGame =
            games.find((game: GameType) => game?.published) ?? games[0] ?? null;
          setCurrentJamGame(preferredGame);
        } else {
          setCurrentJamGame(null);
        }
      } catch (error) {
        console.error(error);
      }
    }

    loadData();
  }, [isLoggedIn, jam]);

  return (
    <Navbar
      maxWidth="2xl"
      className="px-1 py-6 duration-500 ease-in-out transition-color shadow-2xl"
      style={{
        backgroundImage:
          "url(/images/D2J_Icon_watermark.png), url(/images/D2J_Icon_watermark.png)",
        backgroundPositionY: "center, center",
        backgroundPositionX: "45px, right 45px",
        backgroundSize: "210px",
        backgroundRepeat: "no-repeat",
        backgroundColor: siteTheme.colors["crust"],
      }}
      isBordered
      height={48}
    >
      {/* Navbar Left */}
      <NavbarContent justify="start">
        <Brand userLoggedIn={isLoggedIn} />
        <SearchBar />

        {isXlUp && (
          <>
            <Divider orientation="vertical" />
            <div className="flex items-center">
              {/* <NavbarButton
                icon={<Heart size={16} />}
                href="/donate"
                name="Navbar.Donate.Title"
                description="Navbar.Donate.Description"
                hotkey={["G", "D"]}
                isIconOnly
                color="green"
              /> */}
              <NavbarButton
                icon="dice3"
                href="/lucky"
                name="Navbar.Lucky.Title"
                description="Navbar.Lucky.Description"
                hotkey={["G", "L"]}
                isIconOnly
                color="lime"
              />
              {/* <NavbarButton
                icon={<Rss size={16} />}
                href="/rss"
                name="Navbar.RSS.Title"
                description="Navbar.RSS.Description"
                hotkey={["G", "S"]}
                isIconOnly
                color="yellow"
              /> */}
              <NavbarButton
                icon="music"
                href="/music"
                name="Navbar.Music.Title"
                description="Navbar.Music.Description"
                hotkey={["G", "M"]}
                isIconOnly
                color="orange"
              />
            </div>
          </>
        )}
      </NavbarContent>

      {/* Navbar Right */}
      <NavbarContent justify="end" className="gap-2">
        {isLgUp && (
          <NavbarButton
            icon="info"
            href="/about"
            name="Navbar.About.Title"
            description="Navbar.About.Description"
            hotkey={["G", "A"]}
            color="red"
          />
        )}
        <NavbarButton
          icon="gamepad"
          href="/games"
          name="Navbar.Games.Title"
          description="Navbar.Games.Description"
          hotkey={["G", "E"]}
          color="orange"
        />
        {jamPhase == "Upcoming Jam" && isLgUp && (
          <NavbarButton
            icon="trophy"
            href="/results"
            name="Navbar.Results.Title"
            description="Navbar.Results.Description"
            hotkey={["G", "R"]}
            color="yellow"
          />
        )}
        {jamPhase == "Suggestion" && isLgUp && (
          <NavbarButton
            icon="sparkles"
            href="/theme-suggestions"
            name="Navbar.ThemeSuggestions.Title"
            description="Navbar.ThemeSuggestions.Description"
            hotkey={["G", "F"]}
            color="yellow"
          />
        )}
        {jamPhase == "Elimination" && isLgUp && (
          <NavbarButton
            icon="swords"
            href="/theme-elimination"
            name="Navbar.ThemeElimination.Title"
            description="Navbar.ThemeElimination.Description"
            hotkey={["G", "F"]}
            color="yellow"
          />
        )}
        {jamPhase == "Voting" && isLgUp && (
          <NavbarButton
            icon="vote"
            href="/theme-voting"
            name="Navbar.ThemeVoting.Title"
            description="Navbar.ThemeVoting.Description"
            hotkey={["G", "F"]}
            color="yellow"
          />
        )}
        {user &&
          jam &&
          isInJam &&
          isLgUp &&
          (jamPhase == "Jamming" ||
            jamPhase == "Submission" ||
            jamPhase == "Rating") && (
            <NavbarButton
              icon="gamepad2"
              name={currentJamGame ? "Navbar.MyGame.Title" : "Navbar.CreateGame.Title"}
              href={currentJamGame ? "/g/" + currentJamGame.slug : "/create-game"}
              description={
                currentJamGame
                  ? "Navbar.MyGame.Description"
                  : "Navbar.CreateGame.Description"
              }
              color="yellow"
              hotkey={["G", "F"]}
            />
          )}
        {/* Logged out */}
        {!user && isLgUp && (
          <NavbarButton
            icon="messagecircle"
            href="/home"
            name="Navbar.Forum.Title"
            description="Navbar.Forum.Description"
            hotkey={["G", "H"]}
            color="lime"
          />
        )}
        {!user &&
          isMdUp &&
          (hasCookie("hasLoggedIn") ? (
            <NavbarButton
              icon="login"
              href="/login"
              name="Navbar.Login.Title"
              description="Navbar.Login.Description"
              hotkey={["G", "J"]}
              color="green"
            />
          ) : (
            <NavbarButton
              icon="login"
              href="/signup"
              name="Navbar.Join.Title"
              description="Navbar.Join.Description"
              hotkey={["G", "J"]}
              color="green"
            />
          ))}
        {/* Logged in */}
        {user && isLgUp && (
          <NavbarButton
            icon="squarepen"
            href="/create-post"
            name="Navbar.CreatePost.Title"
            description="Navbar.CreatePost.Description"
            hotkey={["G", "C"]}
            color="lime"
          />
        )}
        {user && isMdUp && jam && isInJam && (
          <NavbarButton
            icon="users"
            href={currentJamTeam ? "/team" : "/team-finder"}
            name={currentJamTeam ? "Navbar.MyTeam.Title" : "Navbar.TeamFinder.Title"}
            description={
              currentJamTeam
                ? "Navbar.MyTeam.Description"
                : "Navbar.TeamFinder.Description"
            }
            color="green"
            hotkey={["G", "T"]}
          />
        )}
        {user && isMdUp && jam && !isInJam && (
          <NavbarButton
            icon="calendarplus"
            onPress={async () => {
              const currentJamResponse = await getCurrentJam();
              const currentJam = currentJamResponse?.jam;
              if (!currentJam) {
                addToast({
                  title: "Navbar.NoJamToast.Title",
                  description: "Navbar.NoJamToast.Description",
                  color: "danger",
                  variant: "bordered",
                  timeout: 3000,
                });
                return;
              }
              if (await joinJam(currentJam.id)) {
                setIsInJam(true);
              }
            }}
            name="Navbar.JoinJam.Title"
            description="Navbar.JoinJam.Description"
            color="green"
            hotkey={["G", "J"]}
          />
        )}
        <Divider orientation="vertical" />
        <LanguageDropdown languages={languages} />
        {isXlUp && (
          <>
            <Divider orientation="vertical" />
            {/* <ThemeToggle /> */}
            <SiteThemeDropdown />
          </>
        )}
        {!user && (
          <>
            <Divider orientation="vertical" className="hidden xl:flex" />
            <div className="hidden xl:flex gap-1">
              <Button
                icon="sidiscord"
                href="https://discord.d2jam.com"
                target="_blank"
                variant="ghost"
              />
              <Button
                icon="sibluesky"
                href="https://bluesky.d2jam.com"
                target="_blank"
                variant="ghost"
              />
              <Button
                icon="siyoutube"
                href="https://youtube.d2jam.com"
                target="_blank"
                variant="ghost"
              />
              <Button
                icon="siinstagram"
                href="https://instagram.d2jam.com"
                target="_blank"
                variant="ghost"
              />
            </div>
          </>
        )}
        {(user || isLgDown) && (
          <>
            <Divider orientation="vertical" />
            {user &&
              (user.receivedNotifications.length ? (
                <Badge
                  position="bottom-right"
                  content={user.receivedNotifications.length}
                >
                  <NavbarButton
                    icon="bell"
                    href="/inbox"
                    name="Navbar.Inbox.Title"
                    description="Navbar.Inbox.Description"
                    hotkey={["G", "I"]}
                    color="green"
                    isIconOnly
                  />
                </Badge>
              ) : (
                <NavbarButton
                  icon="bell"
                  href="/inbox"
                  name="Navbar.Inbox.Title"
                  description="Navbar.Inbox.Description"
                  hotkey={["G", "I"]}
                  color="green"
                  isIconOnly
                />
              ))}
            <NavbarUser user={user} />
          </>
        )}
      </NavbarContent>
    </Navbar>
  );
}
