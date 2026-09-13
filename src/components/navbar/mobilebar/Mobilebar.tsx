"use client";

import { useTranslations as useUiTranslations } from "@/compat/next-intl";


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
import { isPostJamPhase, isThemeVotingOpen } from "@/helpers/jamDisplay";
import { joinJam } from "@/helpers/jam";
import { useQueryClient } from "@tanstack/react-query";
import { GameType } from "@/types/GameType";
import { JamType } from "@/types/JamType";

type MobilebarProps = {
  isLoggedIn: boolean;
};

export default function Mobilebar({ isLoggedIn }: MobilebarProps) {
  const uiText = useUiTranslations();
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
        backgroundColor: colors["mantle"],
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
            description={uiText("Navbar.Profile.Description")}
          >
             {uiText("Navbar.Profile.Title")} </Dropdown.Item>
        )}
        {user && (
          <Dropdown.Item
            value="settings"
            icon="settings"
            href="/settings"
            description={uiText("Navbar.Settings.Description")}
          >
             {uiText("Navbar.Settings.Title")} </Dropdown.Item>
        )}
        {user && (
          <Dropdown.Item
            value="import-game"
            icon="download"
            href="/import-game"
            description={uiText("AppStrings.ImportAGameFromItchIo")}
          >
             {uiText("AppStrings.ImportGame2")} </Dropdown.Item>
        )}
        {user && (
          <Dropdown.Item
            value="create-post"
            icon="squarepen"
            href="/create-post"
            description={uiText("Navbar.CreatePost.Description")}
          >
             {uiText("Navbar.CreatePost.Title")} </Dropdown.Item>
        )}
        {(jamPhase === "Upcoming Jam" ||
          jamPhase === "Post-Jam Refinement" ||
          (jamPhase === "Post-Jam Rating" && !currentJamGame)) && (
          <Dropdown.Item
            value="results"
            icon="trophy"
            href="/recap"
            description={uiText("AppStrings.ViewTheResultsOfTheLastD2Jam")}
          >
             {uiText("Navbar.Results.Title")} </Dropdown.Item>
        )}
        {jamPhase === "Suggestion" && (
          <Dropdown.Item
            value="theme-suggestions"
            icon="sparkles"
            href="/theme-suggestions"
            description={uiText("AppStrings.SubmitPossibleThemesForTheJam")}
          >
             {uiText("Navbar.ThemeSuggestions.Title")} </Dropdown.Item>
        )}
        {jamPhase === "Elimination" && (
          <Dropdown.Item
            value="theme-elimination"
            icon="swords"
            href="/theme-elimination"
            description={uiText("AppStrings.VoteOnSubmittedJamThemes")}
          >
             {uiText("Navbar.ThemeElimination.Title")} </Dropdown.Item>
        )}
        {isThemeVotingOpen(jamPhase, jam) && (
          <Dropdown.Item
            value="theme-voting"
            icon="vote"
            href="/theme-voting"
            description={uiText("AppStrings.VoteForTheFinalJamTheme")}
          >
             {uiText("Navbar.ThemeVoting.Title")} </Dropdown.Item>
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
                  ? uiText("Navbar.MyGame.Description")
                  : uiText("Navbar.CreateGame.Description")
              }
            >
              {currentJamGame ? uiText("Navbar.MyGame.Title") : uiText("Navbar.CreateGame.Title")}
            </Dropdown.Item>
          )}
        {user && jam && computedIsInJam && (
          <Dropdown.Item
            value="team"
            icon="users"
            href={currentJamTeam ? "/team" : "/team-finder"}
            description={
              currentJamTeam
                ? uiText("AppStrings.ViewYourTeamForTheJam")
                : uiText("AppStrings.FindATeamForTheJam")
            }
          >
            {currentJamTeam ? uiText("Navbar.MyTeam.Title") : uiText("Navbar.TeamFinder.Title")}
          </Dropdown.Item>
        )}
        {user && joinableJam && !computedIsInJam && (
          <Dropdown.Item
            value="join-jam"
            icon="calendarplus"
            description={uiText("AppStrings.MarkThatYouAreParticipatingInTheJam")}
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
             {uiText("Navbar.JoinJam.Title")} </Dropdown.Item>
        )}
        {user && (
          <Dropdown.Item
            value="inbox"
            icon="bell"
            href="/inbox/messages"
            description={uiText("Navbar.Inbox.Description")}
          >
             {uiText("Navbar.Inbox.Title")} </Dropdown.Item>
        )}
        <Dropdown.Item
          value="about"
          icon="info"
          href="/about"
          description={uiText("Navbar.About.Description")}
        >
           {uiText("Splash.About")} </Dropdown.Item>
        <Dropdown.Item
          value="games"
          icon="gamepad"
          href="/games"
          description={uiText("AppStrings.AllSubmittedGamesOnTheWebsite")}
        >
           {uiText("Navbar.Games.Title")} </Dropdown.Item>
        <Dropdown.Item
          value="forum"
          icon="messagecircle"
          href="/home"
          description={uiText("AppStrings.ChatWithOtherCommunityMembers")}
        >
           {uiText("Navbar.Forum.Title")} </Dropdown.Item>
        <Dropdown.Item
          value="themes"
          icon="palette"
          href="/themes"
          description={uiText("AppStrings.BrowseAllCommunitySiteThemes")}
        >
           {uiText("AppStrings.BrowseAllThemes")} </Dropdown.Item>
        <Dropdown.Item value="languages" href="/languages" description={uiText("AppStrings.ChooseYourSiteLanguage")}>
           {uiText("AppStrings.ViewAllLanguages")} </Dropdown.Item>
        <Dropdown.Item
          value="screenshots"
          icon="images"
          href="/screenshots"
          description={uiText("Navbar.Screenshots.Description")}
        >
           {uiText("Navbar.Screenshots.Title")} </Dropdown.Item>
        <Dropdown.Item
          value="radio"
          icon="broadcast"
          href="/radio"
          description={uiText("Navbar.Radio.Description")}
        >
           {uiText("Navbar.Radio.Title")} </Dropdown.Item>
        <Dropdown.Item
          value="lucky"
          icon="dice3"
          href="/lucky"
          description={uiText("AppStrings.GoToARandomGame")}
        >
           {uiText("Navbar.Lucky.Title")} </Dropdown.Item>
        <Dropdown.Item
          value="news"
          icon="megaphone"
          href="/news"
          description={uiText("Navbar.News.Description")}
        >
          <span className="inline-flex items-center gap-2">
             {uiText("Navbar.News.Title")} {hasUnreadNews && (
              <span
                aria-label={uiText("AppStrings.NewArticles")}
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
          description={uiText("AppStrings.AllSubmittedMusicOnTheWebsite")}
        >
           {uiText("Navbar.Music.Title")} </Dropdown.Item>
        <Dropdown.Item
          value="donate"
          icon="heart"
          href="/donate"
          description={uiText("Navbar.Donate.Description")}
        >
           {uiText("Navbar.Donate.Title")} </Dropdown.Item>
        <Dropdown.Item
          value="rss"
          icon="rss"
          href="/rss"
          description={uiText("Navbar.RSS.Description")}
        >
           {uiText("Navbar.RSS.Title")} </Dropdown.Item>
        <Dropdown.Item
          value="down2guess"
          icon="gamepad2"
          href="/d2guess"
          description={uiText("Navbar.Down2Guess.Description")}
        >
           {uiText("Navbar.Down2Guess.Title")} </Dropdown.Item>
        <Dropdown.Item
          value="collections"
          icon="layers"
          href="/collections"
          description={uiText("Navbar.Collections.Description")}
        >
           {uiText("Navbar.Collections.Title")} </Dropdown.Item>
        <Dropdown.Item
          value="quilts"
          icon="paintbrush"
          href="/quilts"
          description={uiText("Navbar.Quilts.Description")}
        >
           {uiText("Navbar.Quilts.Title")} </Dropdown.Item>
        <Dropdown.Item
          value="events"
          icon="calendar"
          href="/events"
          description={uiText("Navbar.Events.Description")}
        >
           {uiText("Navbar.Events.Title")} </Dropdown.Item>
        <Dropdown.Item
          value="docs"
          icon="bookcopy"
          href="/docs"
          description={uiText("Navbar.Docs.Description")}
        >
           {uiText("Navbar.Docs.Title")} </Dropdown.Item>
        <Dropdown.Item
          value="press-kit"
          icon="newspaper"
          href="/press-kit"
          description={uiText("Navbar.PressKit.Description")}
        >
           {uiText("Navbar.PressKit.Title")} </Dropdown.Item>
        <Dropdown.Item
          value="api-docs"
          icon="code"
          href={API_DOCS_URL}
          target="_blank"
          rel="noopener noreferrer"
          description={uiText("Navbar.ApiDocs.Description")}
        >
           {uiText("Navbar.ApiDocs.Title")} </Dropdown.Item>
        <Dropdown.Item
          value="bug"
          icon="bug"
          href={`/report-bug?page=${encodeURIComponent(window.location.pathname)}`}
          description={uiText("AppStrings.SubmitBugReport")}
        >
           {uiText("Navbar.ReportBug.Title")} </Dropdown.Item>
        {user ? (
          <Dropdown.Item value="logout" icon="logout" href="/logout">
             {uiText("Navbar.Logout.Title")} </Dropdown.Item>
        ) : (
          <Dropdown.Item
            value="join"
            icon="login"
            href={isLoggedIn ? "/login" : "/signup"}
          >
            {isLoggedIn ? uiText("Navbar.Login.Title") : uiText("AppStrings.SignUp")}
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
