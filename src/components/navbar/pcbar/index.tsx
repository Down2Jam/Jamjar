/**
 * @file Shows at the top of the screen on PC.
 * Allows the user to navigate around pages on the site.
 *
 * @author Ategon
 * @created 2025-7-22
 */
"use client";
import { Dropdown, Navbar, NavbarContent } from "bioloom-ui";
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
import {
  queryKeys,
  useSelf,
  useCurrentGame,
  useJamParticipation,
  useMessageCounts,
} from "@/hooks/queries";
import { useQueryClient } from "@tanstack/react-query";
import { isPostJamPhase } from "@/helpers/jamDisplay";
import { API_DOCS_URL } from "@/requests/config";
import { AudioLines } from "lucide-react";
import { useUnreadNews } from "@/components/news/useUnreadNews";
import { useTranslations } from "@/compat/next-intl";
import Hotkey from "@/components/hotkey";
import { useId, useLayoutEffect, useRef, useState } from "react";

type PCbarProps = {
  isLoggedIn: boolean;
  languages: LanguageInfo[];
};

export default function PCbar({ isLoggedIn, languages }: PCbarProps) {
  const t = useTranslations();
  const { jamPhase, jam, nextJam } = useJam();
  const { isLgUp, isXlUp, isMdUp, isLgDown } = useBreakpoint();
  const navbarId = useId();
  const navbarLeftId = `${navbarId}-left`;
  const navbarRightId = `${navbarId}-right`;
  // -1 means even the desktop ellipsis has moved into the user menu.
  const [desktopShortcutCapacity, setDesktopShortcutCapacity] = useState(-1);
  const [themeSelectorVisible, setThemeSelectorVisible] = useState(true);
  const [hiddenColoredActionCount, setHiddenColoredActionCount] = useState(0);
  const coloredActionWidths = useRef<Record<number, number>>({});
  const themeSelectorWidth = useRef(49);

  // Measure the actual navbar so account actions and translated labels are
  // included. Icon shortcuts leave first, followed by the ellipsis, then the
  // colored actions in their requested priority order.
  useLayoutEffect(() => {
    const left = document.getElementById(navbarLeftId);
    const right = document.getElementById(navbarRightId);
    const container = left?.parentElement;
    if (!left || !right || !container) return;

    right
      .querySelectorAll<HTMLElement>("[data-navbar-colored-priority]")
      .forEach((element) => {
        const priority = Number(element.dataset.navbarColoredPriority);
        if (Number.isFinite(priority)) {
          coloredActionWidths.current[priority] = element.offsetWidth;
        }
      });
    const renderedThemeSelector = right.querySelector<HTMLElement>(
      "[data-navbar-theme-selector]",
    );
    if (renderedThemeSelector) {
      themeSelectorWidth.current = renderedThemeSelector.offsetWidth + 8;
    }

    const shortcutWidth = 32;
    // Ellipsis (32px), divider (1px), and the two additional 8px gaps.
    const overflowMenuWidth = 49;
    const navbarGap = 8;
    const breathingRoom = 16;
    const occupiedWidth = left.scrollWidth + right.scrollWidth + navbarGap;
    const availableSpace = container.clientWidth - occupiedWidth - breathingRoom;

    if (availableSpace < 0) {
      if (desktopShortcutCapacity >= 0) {
        setDesktopShortcutCapacity((current) => current - 1);
      } else if (isXlUp && themeSelectorVisible) {
        setThemeSelectorVisible(false);
      } else if (hiddenColoredActionCount < 5) {
        setHiddenColoredActionCount((current) => current + 1);
      }
      return;
    }

    if (hiddenColoredActionCount > 0) {
      const nextPriority = hiddenColoredActionCount - 1;
      const restoreWidth =
        (coloredActionWidths.current[nextPriority] ?? 0) + navbarGap;
      if (availableSpace >= restoreWidth) {
        setHiddenColoredActionCount(nextPriority);
      }
      return;
    }

    if (isXlUp && !themeSelectorVisible) {
      if (availableSpace >= themeSelectorWidth.current) {
        setThemeSelectorVisible(true);
      }
      return;
    }

    if (isXlUp && desktopShortcutCapacity < 5) {
      const restoreWidth =
        desktopShortcutCapacity < 0 ? overflowMenuWidth : shortcutWidth;
      if (availableSpace >= restoreWidth) {
        setDesktopShortcutCapacity((current) => current + 1);
      }
    } else if (!isXlUp) {
      if (desktopShortcutCapacity !== -1) setDesktopShortcutCapacity(-1);
      if (themeSelectorVisible) setThemeSelectorVisible(false);
    }
  });

  const showDesktopOverflow = isXlUp && desktopShortcutCapacity >= 0;
  const showThemeSelector = isXlUp && themeSelectorVisible;
  const showMusicShortcut = desktopShortcutCapacity >= 1;
  const showNewsShortcut = desktopShortcutCapacity >= 2;
  const showLuckyShortcut = desktopShortcutCapacity >= 3;
  const showRadioShortcut = desktopShortcutCapacity >= 4;
  const showScreenshotsShortcut = desktopShortcutCapacity >= 5;

  const hasToken = hasCookie("token");
  const { data: user } = useSelf(hasToken);
  const { data: messageCounts } = useMessageCounts(Boolean(user));
  const { data: currentGameData } = useCurrentGame(hasToken);
  const { siteTheme } = useTheme();
  const hasUnreadNews = useUnreadNews();

  const joinableJam = isPostJamPhase(jamPhase) && nextJam ? nextJam : jam;
  const queryClient = useQueryClient();
  const { data: participation } = useJamParticipation(
    joinableJam?.slug,
    Boolean(user),
  );
  const currentJamTeams = jam
    ? (user?.teams ?? []).filter((team) => team.jamId == jam.id)
    : [];
  const currentJamTeam =
    currentJamTeams.find((team) => team.game?.published) ?? currentJamTeams[0];
  const currentJamGame: GameType | null =
    currentGameData && currentGameData.length > 0 ? currentGameData[0] : null;

  // Derive isInJam from user + jam data
  const computedIsInJam = user && joinableJam
    ? participation ??
      (user.jams?.filter((userjam: JamType) => userjam.id == joinableJam.id)
        .length ?? 0) > 0
    : false;

  return (
    <Navbar
      maxWidth="2xl"
      className="px-1 duration-500 ease-in-out transition-color shadow-2xl"
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
      height={64}
    >
      <Hotkey
        hotkey={["G", "Y"]}
        href="/themes"
        title="Browse all themes"
        description="Browse all community site themes"
      />
      {/* Navbar Left */}
      <NavbarContent id={navbarLeftId} justify="start">
        <Brand userLoggedIn={isLoggedIn} />
        <SearchBar />

        {showDesktopOverflow && (
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
              {showLuckyShortcut && (
                <NavbarButton
                  icon="dice3"
                  href="/lucky"
                  name="Navbar.Lucky.Title"
                  description="Navbar.Lucky.Description"
                  hotkey={["G", "L"]}
                  isIconOnly
                  color="blue"
                />
              )}
              {/* <NavbarButton
                icon={<Rss size={16} />}
                href="/rss"
                name="Navbar.RSS.Title"
                description="Navbar.RSS.Description"
                hotkey={["G", "S"]}
                isIconOnly
                color="yellow"
              /> */}
              {showMusicShortcut && (
                <NavbarButton
                  icon="music"
                  href="/music"
                  name="Navbar.Music.Title"
                  description="Navbar.Music.Description"
                  hotkey={["G", "M"]}
                  isIconOnly
                  color="cyan"
                />
              )}
              {showRadioShortcut && (
                <NavbarButton
                  iconNode={<AudioLines size={16} />}
                  href="/radio"
                  name="Navbar.Radio.Title"
                  description="Navbar.Radio.Description"
                  hotkey={["G", "B"]}
                  isIconOnly
                  color="green"
                />
              )}
              {showScreenshotsShortcut && (
                <NavbarButton
                  icon="images"
                  href="/screenshots"
                  name="Navbar.Screenshots.Title"
                  description="Navbar.Screenshots.Description"
                  hotkey={["G", "S"]}
                  isIconOnly
                  color="lime"
                />
              )}
              {showNewsShortcut && (
                <NavbarButton
                  icon="megaphone"
                  href="/news"
                  name="Navbar.News.Title"
                  description="Navbar.News.Description"
                  hotkey={["G", "W"]}
                  isIconOnly
                  color="orange"
                  indicator={hasUnreadNews}
                />
              )}
              <Dropdown
                position="bottom"
                menuStyle={{ width: "17rem" }}
                trigger={
                  <Button
                    icon="ellipsis"
                    size="md"
                    variant="ghost"
                    aria-label={t("AppStrings.More")}
                    style={{ color: siteTheme.colors.red }}
                  />
                }
              >
                {!showScreenshotsShortcut && (
                  <Dropdown.Item
                    value="screenshots"
                    href="/screenshots"
                    icon="images"
                    description={t("Navbar.Screenshots.Description")}
                    kbd="G S"
                  >
                    {t("Navbar.Screenshots.Title")}
                  </Dropdown.Item>
                )}
                {!showRadioShortcut && (
                  <Dropdown.Item
                    value="radio"
                    href="/radio"
                    icon="broadcast"
                    description={t("Navbar.Radio.Description")}
                    kbd="G B"
                  >
                    {t("Navbar.Radio.Title")}
                  </Dropdown.Item>
                )}
                {!showLuckyShortcut && (
                  <Dropdown.Item
                    value="lucky"
                    href="/lucky"
                    icon="dice3"
                    description={t("Navbar.Lucky.Description")}
                    kbd="G L"
                  >
                    {t("Navbar.Lucky.Title")}
                  </Dropdown.Item>
                )}
                {!showNewsShortcut && (
                  <Dropdown.Item
                    value="news"
                    href="/news"
                    icon="megaphone"
                    description={t("Navbar.News.Description")}
                    kbd="G W"
                  >
                    {t("Navbar.News.Title")}
                  </Dropdown.Item>
                )}
                {!showMusicShortcut && (
                  <Dropdown.Item
                    value="music"
                    href="/music"
                    icon="music"
                    description={t("Navbar.Music.Description")}
                    kbd="G M"
                  >
                    {t("Navbar.Music.Title")}
                  </Dropdown.Item>
                )}
                <Dropdown.Item
                  value="down2guess"
                  href="/d2guess"
                  icon="gamepad2"
                  description={t("Navbar.Down2Guess.Description")}
                  kbd="G D"
                >
                  {t("Navbar.Down2Guess.Title")}
                </Dropdown.Item>
                <Dropdown.Item
                  value="collections"
                  href="/collections"
                  icon="layers"
                  description={t("Navbar.Collections.Description")}
                  kbd="G N"
                >
                  {t("Navbar.Collections.Title")}
                </Dropdown.Item>
                <Dropdown.Item
                  value="quilts"
                  href="/quilts"
                  icon="paintbrush"
                  description={t("Navbar.Quilts.Description")}
                  kbd="G Q"
                >
                  {t("Navbar.Quilts.Title")}
                </Dropdown.Item>
                <Dropdown.Item
                  value="events"
                  href="/events"
                  icon="calendar"
                  description={t("Navbar.Events.Description")}
                  kbd="G V"
                >
                  {t("Navbar.Events.Title")}
                </Dropdown.Item>
                <Dropdown.Item
                  value="docs"
                  href="/docs"
                  icon="bookcopy"
                  description={t("Navbar.Docs.Description")}
                  kbd="G O"
                >
                  {t("Navbar.Docs.Title")}
                </Dropdown.Item>
                <Dropdown.Item
                  value="press-kit"
                  href="/press-kit"
                  icon="newspaper"
                  description={t("Navbar.PressKit.Description")}
                  kbd="G P"
                >
                  {t("Navbar.PressKit.Title")}
                </Dropdown.Item>
                <Dropdown.Item
                  value="api-docs"
                  href={API_DOCS_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  icon="code"
                  description={t("Navbar.ApiDocs.Description")}
                  kbd="G K"
                >
                  {t("Navbar.ApiDocs.Title")}
                </Dropdown.Item>
              </Dropdown>
              <Hotkey
                href="/d2guess"
                hotkey={["G", "D"]}
                title="Navbar.Down2Guess.Title"
                description="Navbar.Down2Guess.Description"
              />
              <Hotkey
                href="/collections"
                hotkey={["G", "N"]}
                title="Navbar.Collections.Title"
                description="Navbar.Collections.Description"
              />
              <Hotkey
                href="/quilts"
                hotkey={["G", "Q"]}
                title="Navbar.Quilts.Title"
                description="Navbar.Quilts.Description"
              />
              <Hotkey
                href="/events"
                hotkey={["G", "V"]}
                title="Navbar.Events.Title"
                description="Navbar.Events.Description"
              />
              <Hotkey
                href="/docs"
                hotkey={["G", "O"]}
                title="Navbar.Docs.Title"
                description="Navbar.Docs.Description"
              />
              <Hotkey
                href="/press-kit"
                hotkey={["G", "P"]}
                title="Navbar.PressKit.Title"
                description="Navbar.PressKit.Description"
              />
              <Hotkey
                href={API_DOCS_URL}
                hotkey={["G", "K"]}
                title="Navbar.ApiDocs.Title"
                description="Navbar.ApiDocs.Description"
              />
            </div>
          </>
        )}
      </NavbarContent>

      {/* Navbar Right */}
      <NavbarContent id={navbarRightId} justify="end" className="gap-2">
        {isLgUp && hiddenColoredActionCount < 3 && (
          <div className="flex shrink-0" data-navbar-colored-priority="2">
            <NavbarButton
              icon="info"
              href="/about"
              name="Navbar.About.Title"
              description="Navbar.About.Description"
              hotkey={["G", "A"]}
              color="red"
            />
          </div>
        )}
        {hiddenColoredActionCount < 5 && (
          <div className="flex shrink-0" data-navbar-colored-priority="4">
            <NavbarButton
              icon="gamepad"
              href="/games"
              name="Navbar.Games.Title"
              description="Navbar.Games.Description"
              hotkey={["G", "E"]}
              color="orange"
            />
          </div>
        )}
        {(jamPhase == "Upcoming Jam" ||
          jamPhase == "Post-Jam Refinement" ||
          (jamPhase == "Post-Jam Rating" && !currentJamGame)) &&
          isLgUp &&
          hiddenColoredActionCount < 2 && (
            <div className="flex shrink-0" data-navbar-colored-priority="1">
              <NavbarButton
                icon="trophy"
                href="/recap"
                name="Navbar.Results.Title"
                description="Navbar.Results.Description"
                hotkey={["G", "R"]}
                color="yellow"
              />
            </div>
          )}
        {jamPhase == "Suggestion" && isLgUp && hiddenColoredActionCount < 2 && (
          <div className="flex shrink-0" data-navbar-colored-priority="1">
            <NavbarButton
              icon="sparkles"
              href="/theme-suggestions"
              name="Navbar.ThemeSuggestions.Title"
              description="Navbar.ThemeSuggestions.Description"
              hotkey={["G", "F"]}
              color="yellow"
            />
          </div>
        )}
        {jamPhase == "Elimination" && isLgUp && hiddenColoredActionCount < 2 && (
          <div className="flex shrink-0" data-navbar-colored-priority="1">
            <NavbarButton
              icon="swords"
              href="/theme-elimination"
              name="Navbar.ThemeElimination.Title"
              description="Navbar.ThemeElimination.Description"
              hotkey={["G", "F"]}
              color="yellow"
            />
          </div>
        )}
        {jamPhase == "Voting" && isLgUp && hiddenColoredActionCount < 2 && (
          <div className="flex shrink-0" data-navbar-colored-priority="1">
            <NavbarButton
              icon="vote"
              href="/theme-voting"
              name="Navbar.ThemeVoting.Title"
              description="Navbar.ThemeVoting.Description"
              hotkey={["G", "F"]}
              color="yellow"
            />
          </div>
        )}
        {user &&
          jam &&
          computedIsInJam &&
          isLgUp &&
          hiddenColoredActionCount < 2 &&
          (jamPhase == "Jamming" ||
            jamPhase == "Submission" ||
            jamPhase == "Rating" ||
            (jamPhase == "Post-Jam Rating" && Boolean(currentJamGame))) && (
            <div className="flex shrink-0" data-navbar-colored-priority="1">
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
            </div>
          )}
        {/* Logged out */}
        {!user && isLgUp && hiddenColoredActionCount < 1 && (
          <div className="flex shrink-0" data-navbar-colored-priority="0">
            <NavbarButton
              icon="messagecircle"
              href="/home"
              name="Navbar.Forum.Title"
              description="Navbar.Forum.Description"
              hotkey={["G", "H"]}
              color="lime"
            />
          </div>
        )}
        {!user &&
          isMdUp &&
          hiddenColoredActionCount < 4 &&
          (hasCookie("hasLoggedIn") ? (
            <div className="flex shrink-0" data-navbar-colored-priority="3">
              <NavbarButton
                icon="login"
                href="/login"
                name="Navbar.Login.Title"
                description="Navbar.Login.Description"
                hotkey={["G", "J"]}
                color="green"
              />
            </div>
          ) : (
            <div className="flex shrink-0" data-navbar-colored-priority="3">
              <NavbarButton
                icon="login"
                href="/signup"
                name="Navbar.Join.Title"
                description="Navbar.Join.Description"
                hotkey={["G", "J"]}
                color="green"
              />
            </div>
          ))}
        {/* Logged in */}
        {user && isLgUp && hiddenColoredActionCount < 1 && (
          <div className="flex shrink-0" data-navbar-colored-priority="0">
            <NavbarButton
              icon="squarepen"
              href="/create-post"
              name="Navbar.CreatePost.Title"
              description="Navbar.CreatePost.Description"
              hotkey={["G", "C"]}
              color="lime"
            />
          </div>
        )}
        {user &&
          isMdUp &&
          jam &&
          computedIsInJam &&
          hiddenColoredActionCount < 4 && (
            <div className="flex shrink-0" data-navbar-colored-priority="3">
              <NavbarButton
                icon="users"
                href={currentJamTeam ? "/team" : "/team-finder"}
                name={
                  currentJamTeam
                    ? "Navbar.MyTeam.Title"
                    : "Navbar.TeamFinder.Title"
                }
                description={
                  currentJamTeam
                    ? "Navbar.MyTeam.Description"
                    : "Navbar.TeamFinder.Description"
                }
                color="green"
                hotkey={["G", "T"]}
              />
            </div>
        )}
        {user &&
          isMdUp &&
          joinableJam &&
          !computedIsInJam &&
          hiddenColoredActionCount < 4 && (
            <div className="flex shrink-0" data-navbar-colored-priority="3">
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
                    queryClient.setQueryData(
                      queryKeys.jam.participation(joinableJam.slug),
                      true,
                    );
                  }
                }}
                name="Navbar.JoinJam.Title"
                description="Navbar.JoinJam.Description"
                color="green"
                hotkey={["G", "J"]}
              />
            </div>
        )}
        <Divider orientation="vertical" />
        <LanguageDropdown languages={languages} />
        {showThemeSelector && (
          <div
            className="flex shrink-0 items-center gap-2"
            data-navbar-theme-selector
          >
            <Divider orientation="vertical" />
            {/* <ThemeToggle /> */}
            <SiteThemeDropdown />
          </div>
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
        {(user || isLgDown || !showDesktopOverflow) && (
          <>
            <Divider orientation="vertical" />
            {user &&
              ((user.receivedNotifications.length + (messageCounts?.total ?? 0)) ? (
                <Badge
                  position="bottom-right"
                  content={user.receivedNotifications.length + (messageCounts?.total ?? 0)}
                >
                  <NavbarButton
                    icon="bell"
                    href="/inbox/messages"
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
                  href="/inbox/messages"
                  name="Navbar.Inbox.Title"
                  description="Navbar.Inbox.Description"
                  hotkey={["G", "I"]}
                  color="green"
                  isIconOnly
                />
              ))}
            <NavbarUser
              user={user}
              showResponsiveShortcuts={!showDesktopOverflow}
              showThemesLink={!showThemeSelector}
              coloredOverflowItems={
                <>
                  {hiddenColoredActionCount >= 1 && user && (
                    <Dropdown.Item
                      value="create-post"
                      icon="squarepen"
                      href="/create-post"
                      description={t("Navbar.CreatePost.Description")}
                      kbd="G C"
                    >
                      {t("Navbar.CreatePost.Title")}
                    </Dropdown.Item>
                  )}
                  {hiddenColoredActionCount >= 1 && !user && (
                    <Dropdown.Item
                      value="forum"
                      icon="messagecircle"
                      href="/home"
                      description={t("Navbar.Forum.Description")}
                      kbd="G H"
                    >
                      {t("Navbar.Forum.Title")}
                    </Dropdown.Item>
                  )}
                  {hiddenColoredActionCount >= 2 &&
                    (jamPhase == "Upcoming Jam" ||
                      jamPhase == "Post-Jam Refinement" ||
                      (jamPhase == "Post-Jam Rating" && !currentJamGame)) && (
                      <Dropdown.Item
                        value="results"
                        icon="trophy"
                        href="/recap"
                        description={t("Navbar.Results.Description")}
                        kbd="G R"
                      >
                        {t("Navbar.Results.Title")}
                      </Dropdown.Item>
                    )}
                  {hiddenColoredActionCount >= 2 && jamPhase == "Suggestion" && (
                    <Dropdown.Item
                      value="theme-suggestions"
                      icon="sparkles"
                      href="/theme-suggestions"
                      description={t("Navbar.ThemeSuggestions.Description")}
                      kbd="G F"
                    >
                      {t("Navbar.ThemeSuggestions.Title")}
                    </Dropdown.Item>
                  )}
                  {hiddenColoredActionCount >= 2 && jamPhase == "Elimination" && (
                    <Dropdown.Item
                      value="theme-elimination"
                      icon="swords"
                      href="/theme-elimination"
                      description={t("Navbar.ThemeElimination.Description")}
                      kbd="G F"
                    >
                      {t("Navbar.ThemeElimination.Title")}
                    </Dropdown.Item>
                  )}
                  {hiddenColoredActionCount >= 2 && jamPhase == "Voting" && (
                    <Dropdown.Item
                      value="theme-voting"
                      icon="vote"
                      href="/theme-voting"
                      description={t("Navbar.ThemeVoting.Description")}
                      kbd="G F"
                    >
                      {t("Navbar.ThemeVoting.Title")}
                    </Dropdown.Item>
                  )}
                  {hiddenColoredActionCount >= 2 &&
                    user &&
                    jam &&
                    computedIsInJam &&
                    (jamPhase == "Jamming" ||
                      jamPhase == "Submission" ||
                      jamPhase == "Rating" ||
                      (jamPhase == "Post-Jam Rating" &&
                        Boolean(currentJamGame))) && (
                      <Dropdown.Item
                        value="current-game"
                        icon="gamepad2"
                        href={
                          currentJamGame
                            ? `/g/${currentJamGame.slug}`
                            : "/create-game"
                        }
                        description={t(
                          currentJamGame
                            ? "Navbar.MyGame.Description"
                            : "Navbar.CreateGame.Description",
                        )}
                        kbd="G F"
                      >
                        {t(
                          currentJamGame
                            ? "Navbar.MyGame.Title"
                            : "Navbar.CreateGame.Title",
                        )}
                      </Dropdown.Item>
                    )}
                  {hiddenColoredActionCount >= 3 && (
                    <Dropdown.Item
                      value="about"
                      icon="info"
                      href="/about"
                      description={t("Navbar.About.Description")}
                      kbd="G A"
                    >
                      {t("Navbar.About.Title")}
                    </Dropdown.Item>
                  )}
                  {hiddenColoredActionCount >= 4 &&
                    user &&
                    jam &&
                    computedIsInJam && (
                      <Dropdown.Item
                        value="team"
                        icon="users"
                        href={currentJamTeam ? "/team" : "/team-finder"}
                        description={t(
                          currentJamTeam
                            ? "Navbar.MyTeam.Description"
                            : "Navbar.TeamFinder.Description",
                        )}
                        kbd="G T"
                      >
                        {t(
                          currentJamTeam
                            ? "Navbar.MyTeam.Title"
                            : "Navbar.TeamFinder.Title",
                        )}
                      </Dropdown.Item>
                    )}
                  {hiddenColoredActionCount >= 4 && !user && isMdUp && (
                    <Dropdown.Item
                      value="login"
                      icon="login"
                      href={hasCookie("hasLoggedIn") ? "/login" : "/signup"}
                      description={t(
                        hasCookie("hasLoggedIn")
                          ? "Navbar.Login.Description"
                          : "Navbar.Join.Description",
                      )}
                      kbd="G J"
                    >
                      {t(
                        hasCookie("hasLoggedIn")
                          ? "Navbar.Login.Title"
                          : "Navbar.Join.Title",
                      )}
                    </Dropdown.Item>
                  )}
                  {hiddenColoredActionCount >= 4 &&
                    user &&
                    joinableJam &&
                    !computedIsInJam && (
                      <Dropdown.Item
                        value="join-jam"
                        icon="calendarplus"
                        description={t("Navbar.JoinJam.Description")}
                        kbd="G J"
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
                        {t("Navbar.JoinJam.Title")}
                      </Dropdown.Item>
                    )}
                  {hiddenColoredActionCount >= 5 && (
                    <Dropdown.Item
                      value="games"
                      icon="gamepad"
                      href="/games"
                      description={t("Navbar.Games.Description")}
                      kbd="G E"
                    >
                      {t("Navbar.Games.Title")}
                    </Dropdown.Item>
                  )}
                </>
              }
            />
          </>
        )}
      </NavbarContent>
    </Navbar>
  );
}
