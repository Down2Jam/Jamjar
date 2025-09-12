/**
 * @file Shows at the top of the screen on PC.
 * Allows the user to navigate around pages on the site.
 *
 * @author Ategon
 * @created 2025-7-22
 */
"use client";
import { Navbar as NavbarBase, NavbarContent } from "@heroui/navbar";
import SearchBar from "./SearchBar";
import Brand from "./Brand";
import { Divider } from "@heroui/divider";
import NavbarButton from "./NavbarButton";
import {
  Bell,
  CalendarPlus,
  Dice3,
  Gamepad,
  Gamepad2,
  Info,
  LogIn,
  MessageCircle,
  Music,
  Sparkles,
  SquarePen,
  Swords,
  Trophy,
  Users,
  Vote,
} from "lucide-react";
import { useJam } from "@/hooks/useJam";
import { addToast } from "@heroui/react";
import { getCurrentJam, joinJam } from "@/helpers/jam";
import NavbarUser from "./NavbarUser";
import { UserType } from "@/types/UserType";
import { GameType } from "@/types/GameType";
import { useEffect, useState } from "react";
import { hasCookie } from "@/helpers/cookie";
import { getSelf } from "@/requests/user";
import { getCurrentGame } from "@/requests/game";
import { JamType } from "@/types/JamType";
import { usePathname } from "next/navigation";
import useBreakpoint from "@/hooks/useBreakpoint";
import LanguageDropdown from "./LanguageDropdown";
import SiteThemeDropdown from "./SiteThemeDropdown";
import { useTheme } from "@/providers/SiteThemeProvider";
import { LanguageInfo } from "@/types/LanguageInfoType";
import { Button } from "@/framework/Button";
import { Badge } from "@/framework/Badge";

type PCbarProps = {
  isLoggedIn: boolean;
  languages: LanguageInfo[];
};

export default function PCbar({ isLoggedIn, languages }: PCbarProps) {
  const { jamPhase, jam } = useJam();
  const { isLgUp, isXlUp, isMdUp, isLgDown } = useBreakpoint();

  const [isInJam, setIsInJam] = useState<boolean>();
  const [user, setUser] = useState<UserType>();
  const [hasGame, setHasGame] = useState<GameType | null>();
  const pathname = usePathname();
  const { siteTheme } = useTheme();

  useEffect(() => {
    loadData();
    async function loadData() {
      try {
        if (!hasCookie("token")) {
          setUser(undefined);
          return;
        }
        const response = await getSelf();
        const user = await response.json();
        // Check if user has a game in current jam
        const gameResponse = await getCurrentGame();
        if (gameResponse.ok) {
          const gameData = (await gameResponse.json()).data;
          if (gameData && gameData.length > 0) {
            setHasGame(gameData[0]);
          } else {
            setHasGame(null);
          }
        } else {
          setHasGame(null);
        }
        if (
          jam &&
          user.jams.filter((userjam: JamType) => userjam.id == jam.id).length >
            0
        ) {
          setIsInJam(true);
        } else {
          setIsInJam(false);
        }
        if (response.status == 200) {
          setUser(user);
        } else {
          setUser(undefined);
        }
      } catch (error) {
        console.error(error);
      }
    }
  }, [pathname, jam]);

  return (
    <NavbarBase
      maxWidth="2xl"
      className="p-1 duration-500 ease-in-out transition-color shadow-2xl"
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
      height={40}
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
                icon={<Dice3 size={16} />}
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
                icon={<Music size={16} />}
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
            icon={<Info size={16} />}
            href="/about"
            name="Navbar.About.Title"
            description="Navbar.About.Description"
            hotkey={["G", "A"]}
            color="red"
          />
        )}
        <NavbarButton
          icon={<Gamepad size={16} />}
          href="/games"
          name="Navbar.Games.Title"
          description="Navbar.Games.Description"
          hotkey={["G", "E"]}
          color="orange"
        />
        {jamPhase == "Upcoming Jam" && isLgUp && (
          <NavbarButton
            icon={<Trophy size={16} />}
            href="/results"
            name="Navbar.Results.Title"
            description="Navbar.Results.Description"
            hotkey={["G", "R"]}
            color="yellow"
          />
        )}
        {jamPhase == "Suggestion" && isLgUp && (
          <NavbarButton
            icon={<Sparkles size={16} />}
            href="/theme-suggestions"
            name="Navbar.ThemeSuggestions.Title"
            description="Navbar.ThemeSuggestions.Description"
            hotkey={["G", "F"]}
            color="yellow"
          />
        )}
        {jamPhase == "Elimination" && isLgUp && (
          <NavbarButton
            icon={<Swords size={16} />}
            href="/theme-elimination"
            name="Navbar.ThemeElimination.Title"
            description="Navbar.ThemeElimination.Description"
            hotkey={["G", "F"]}
            color="yellow"
          />
        )}
        {jamPhase == "Voting" && isLgUp && (
          <NavbarButton
            icon={<Vote size={16} />}
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
              icon={<Gamepad2 size={16} />}
              name={hasGame ? "Navbar.MyGame.Title" : "Navbar.CreateGame.Title"}
              href={hasGame ? "/g/" + hasGame.slug : "/create-game"}
              description={
                hasGame
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
            icon={<MessageCircle size={16} />}
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
              icon={<LogIn size={16} />}
              href="/login"
              name="Navbar.Login.Title"
              description="Navbar.Login.Description"
              hotkey={["G", "J"]}
              color="green"
            />
          ) : (
            <NavbarButton
              icon={<LogIn size={16} />}
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
            icon={<SquarePen size={16} />}
            href="/create-post"
            name="Navbar.CreatePost.Title"
            description="Navbar.CreatePost.Description"
            hotkey={["G", "C"]}
            color="lime"
          />
        )}
        {user && isMdUp && jam && isInJam && (
          <NavbarButton
            icon={<Users size={16} />}
            href={
              user.teams.filter((team) => team.jamId == jam.id).length > 0
                ? "/team"
                : "/team-finder"
            }
            name={
              user.teams.filter((team) => team.jamId == jam.id).length > 0
                ? "Navbar.MyTeam.Title"
                : "Navbar.TeamFinder.Title"
            }
            description={
              user.teams.filter((team) => team.jamId == jam.id).length > 0
                ? "Navbar.MyTeam.Description"
                : "Navbar.TeamFinder.Description"
            }
            color="green"
            hotkey={["G", "T"]}
          />
        )}
        {user && isMdUp && jam && !isInJam && (
          <NavbarButton
            icon={<CalendarPlus size={16} />}
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
              />
              <Button
                icon="sibluesky"
                href="https://bluesky.d2jam.com"
                target="_blank"
              />
              <Button
                icon="siyoutube"
                href="https://youtube.d2jam.com"
                target="_blank"
              />
              <Button
                icon="siinstagram"
                href="https://instagram.d2jam.com"
                target="_blank"
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
                    icon={<Bell size={16} />}
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
                  icon={<Bell size={16} />}
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
    </NavbarBase>
  );
}
