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
  Heart,
  Info,
  LogIn,
  MessageCircle,
  Music,
  Rss,
  SquarePen,
  Trophy,
  Users,
} from "lucide-react";
import { useJam } from "@/hooks/useJam";
import { addToast, Button } from "@heroui/react";
import { getCurrentJam, joinJam } from "@/helpers/jam";
import {
  SiBluesky,
  SiDiscord,
  SiYoutube,
} from "@icons-pack/react-simple-icons";
import NavbarUser from "./NavbarUser";
import { UserType } from "@/types/UserType";
import { GameType } from "@/types/GameType";
import { useEffect, useState } from "react";
import { hasCookie } from "@/helpers/cookie";
import { getSelf } from "@/requests/user";
import { getCurrentGame } from "@/requests/game";
import { JamType } from "@/types/JamType";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import useBreakpoint from "@/hooks/useBreakpoint";
import LanguageDropdown from "./LanguageDropdown";
import SiteThemeDropdown from "./SiteThemeDropdown";
import { useTheme } from "@/providers/SiteThemeProvider";
import Popover from "@/framework/Popover";
import { LanguageInfo } from "@/types/LanguageInfoType";

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

  const t = useTranslations("Navbar");

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
          user.jams.filter((jam: JamType) => jam.id == jam.id).length > 0
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
      <Popover
        position="bottom-right"
        className="text-right text-xs"
        shown
        showCloseButton
      >
        <p>⚠️ The site is currently transitioning to a custom theme system</p>
        <p>Some colors may be incorrect as components are moved over</p>
      </Popover>
      {/* Navbar Left */}
      <NavbarContent justify="start">
        <Brand userLoggedIn={isLoggedIn} />
        <SearchBar />

        {isXlUp && (
          <>
            <Divider orientation="vertical" />
            <div className="flex items-center">
              <NavbarButton
                icon={<Heart size={16} />}
                href="/donate"
                name={t("Donate.Title")}
                description={t("Donate.Description")}
                hotkey={["G", "D"]}
                isIconOnly
                color="green"
              />
              <NavbarButton
                icon={<Dice3 size={16} />}
                href="/lucky"
                name={t("Lucky.Title")}
                description={t("Lucky.Description")}
                hotkey={["G", "L"]}
                isIconOnly
                color="lime"
              />
              <NavbarButton
                icon={<Rss size={16} />}
                href="/rss"
                name={t("RSS.Title")}
                description={t("RSS.Description")}
                hotkey={["G", "S"]}
                isIconOnly
                color="yellow"
              />
              <NavbarButton
                icon={<Music size={16} />}
                href="/music"
                name={t("Music.Title")}
                description={t("Music.Description")}
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
            name={t("About.Title")}
            description={t("About.Description")}
            hotkey={["G", "A"]}
            color="red"
          />
        )}
        <NavbarButton
          icon={<Gamepad size={16} />}
          href="/games"
          name={t("Games.Title")}
          description={t("Games.Description")}
          hotkey={["G", "E"]}
          color="orange"
        />
        {jamPhase == "Upcoming Jam" && isLgUp && (
          <NavbarButton
            icon={<Trophy size={16} />}
            href="/results"
            name={t("Results.Title")}
            description={t("Results.Description")}
            hotkey={["G", "R"]}
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
              icon={<Gamepad2 />}
              name={hasGame ? t("MyGame.Title") : t("CreateGame.Title")}
              href={hasGame ? "/g/" + hasGame.slug : "/create-game"}
              description={
                hasGame ? t("MyGame.Description") : t("CreateGame.Description")
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
            name={t("Forum.Title")}
            description={t("Forum.Description")}
            hotkey={["G", "H"]}
            color="lime"
          />
        )}
        {!user && isMdUp && (
          <NavbarButton
            icon={<LogIn size={16} />}
            href="/signup"
            name={t("Join.Title")}
            description={t("Join.Description")}
            hotkey={["G", "J"]}
            color="green"
          />
        )}
        {/* Logged in */}
        {user && isLgUp && (
          <NavbarButton
            icon={<SquarePen size={16} />}
            href="/create-post"
            name={t("CreatePost.Title")}
            description={t("CreatePost.Description")}
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
                ? t("MyTeam.Title")
                : t("MyTeam.Description")
            }
            description={
              user.teams.filter((team) => team.jamId == jam.id).length > 0
                ? t("TeamFinder.Title")
                : t("TeamFinder.Description")
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
                  title: t("NoJamToast.Title"),
                  description: t("NoJamToast.Description"),
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
            name={t("JoinJam.Title")}
            description={t("JoinJam.Description")}
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
                size="sm"
                startContent={<SiDiscord size={16} />}
                isIconOnly
                variant="light"
                style={{
                  color: siteTheme.colors["text"],
                }}
              />
              <Button
                size="sm"
                startContent={<SiBluesky size={16} />}
                isIconOnly
                variant="light"
                style={{
                  color: siteTheme.colors["text"],
                }}
              />
              <Button
                size="sm"
                startContent={<SiYoutube size={16} />}
                isIconOnly
                variant="light"
                style={{
                  color: siteTheme.colors["text"],
                }}
              />
            </div>
          </>
        )}
        {(user || isLgDown) && (
          <>
            <Divider orientation="vertical" />
            {user && (
              <NavbarButton
                icon={<Bell size={16} />}
                href="/inbox"
                name={t("Inbox.Title")}
                description={t("Inbox.Description")}
                hotkey={["G", "I"]}
                color="green"
                isIconOnly
              />
            )}
            <NavbarUser user={user} />
          </>
        )}
      </NavbarContent>
    </NavbarBase>
  );
}
