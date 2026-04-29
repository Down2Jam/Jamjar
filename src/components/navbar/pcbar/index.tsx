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
import { joinJam } from "@/helpers/jam";
import NavbarUser from "./NavbarUser";
import { GameType } from "@/types/GameType";
import { hasCookie } from "@/helpers/cookie";
import { JamType } from "@/types/JamType";
import useBreakpoint from "@/hooks/useBreakpoint";
import LanguageDropdown from "./LanguageDropdown";
import SiteThemeDropdown from "./SiteThemeDropdown";
import { useTheme } from "@/providers/useSiteTheme";
import { LanguageInfo } from "@/types/LanguageInfoType";
import { Button } from "bioloom-ui";
import { Badge } from "bioloom-ui";
import { useSelf, useCurrentGame } from "@/hooks/queries";
import { useState } from "react";
import { isPostJamPhase } from "@/helpers/jamDisplay";
import { API_DOCS_URL } from "@/requests/config";
import { AudioLines } from "lucide-react";

type PCbarProps = {
  isLoggedIn: boolean;
  languages: LanguageInfo[];
};

export default function PCbar({ isLoggedIn, languages }: PCbarProps) {
  const { jamPhase, jam, nextJam } = useJam();
  const { isLgUp, isXlUp, isMdUp, isLgDown } = useBreakpoint();

  const hasToken = hasCookie("token");
  const { data: user } = useSelf(hasToken);
  const { data: currentGameData } = useCurrentGame(hasToken);
  const { siteTheme } = useTheme();
  const [isInJam, setIsInJam] = useState<boolean | undefined>(undefined);

  const joinableJam = isPostJamPhase(jamPhase) && nextJam ? nextJam : jam;
  const currentJamTeams = jam
    ? (user?.teams ?? []).filter((team) => team.jamId == jam.id)
    : [];
  const currentJamTeam =
    currentJamTeams.find((team) => team.game?.published) ?? currentJamTeams[0];
  const currentJamGame: GameType | null =
    currentGameData && currentGameData.length > 0 ? currentGameData[0] : null;

  // Derive isInJam from user + jam data
  const computedIsInJam =
    isInJam !== undefined
      ? isInJam
      : user && joinableJam
        ? (user.jams?.filter((userjam: JamType) => userjam.id == joinableJam.id)
            .length ?? 0) > 0
        : false;

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
                color="blue"
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
                color="blue"
              />
              <NavbarButton
                iconNode={<AudioLines size={16} />}
                href="/radio"
                name="Navbar.Radio.Title"
                description="Navbar.Radio.Description"
                hotkey={["G", "B"]}
                isIconOnly
                color="green"
              />
              <NavbarButton
                icon="images"
                href="/screenshots"
                name="Navbar.Screenshots.Title"
                description="Navbar.Screenshots.Description"
                hotkey={["G", "S"]}
                isIconOnly
                color="lime"
              />
              <NavbarButton
                icon="bookcopy"
                href="/docs"
                name="Navbar.Docs.Title"
                description="Navbar.Docs.Description"
                hotkey={["G", "O"]}
                isIconOnly
                color="yellow"
              />
              <NavbarButton
                icon="newspaper"
                href="/press-kit"
                name="Navbar.PressKit.Title"
                description="Navbar.PressKit.Description"
                hotkey={["G", "P"]}
                isIconOnly
                color="orange"
              />
              <NavbarButton
                icon="code"
                href={API_DOCS_URL}
                target="_blank"
                name="Navbar.ApiDocs.Title"
                description="Navbar.ApiDocs.Description"
                hotkey={["G", "K"]}
                isIconOnly
                color="red"
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
        {(jamPhase == "Upcoming Jam" ||
          jamPhase == "Post-Jam Refinement" ||
          (jamPhase == "Post-Jam Rating" && !currentJamGame)) &&
          isLgUp && (
            <NavbarButton
              icon="trophy"
              href="/recap"
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
          computedIsInJam &&
          isLgUp &&
          (jamPhase == "Jamming" ||
            jamPhase == "Submission" ||
            jamPhase == "Rating" ||
            (jamPhase == "Post-Jam Rating" && Boolean(currentJamGame))) && (
            <NavbarButton
              icon="gamepad2"
              name={
                currentJamGame
                  ? "Navbar.MyGame.Title"
                  : "Navbar.CreateGame.Title"
              }
              href={
                currentJamGame ? "/g/" + currentJamGame.slug : "/create-game"
              }
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
        {user && isMdUp && jam && computedIsInJam && (
          <NavbarButton
            icon="users"
            href={currentJamTeam ? "/team" : "/team-finder"}
            name={
              currentJamTeam ? "Navbar.MyTeam.Title" : "Navbar.TeamFinder.Title"
            }
            description={
              currentJamTeam
                ? "Navbar.MyTeam.Description"
                : "Navbar.TeamFinder.Description"
            }
            color="green"
            hotkey={["G", "T"]}
          />
        )}
        {user && isMdUp && joinableJam && !computedIsInJam && (
          <NavbarButton
            icon="calendarplus"
            onPress={async () => {
              if (!joinableJam) {
                addToast({
                  title: "Navbar.NoJamToast.Title",
                  description: "Navbar.NoJamToast.Description",
                  color: "danger",
                  variant: "bordered",
                  timeout: 3000,
                });
                return;
              }
              if (await joinJam(joinableJam.id)) {
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
