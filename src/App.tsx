import ListingPageLoading from "@/components/listing-loading";
import { useTranslations as useUiTranslations } from "@/compat/next-intl";
import { lazy, Suspense, type ComponentType } from "react";
import { Navigate, Outlet, Route, Routes } from "react-router";
import { useLocation } from "react-router";
import MainLayout from "@/routes/MainLayout";
import { usePageMetadata } from "@/hooks/usePageMetadata";
import AdminGate from "@/components/admin/AdminGate";

const TwitchCallback = lazy(() => import("@/components/twitch-connection/TwitchCallback"));
const SplashRoute = lazy(() => import("@/routes/SplashRoute"));
const AboutPage = lazy(() => import("@/app/(main)/about/page"));
const AdminPage = lazy(() => import("@/app/(main)/admin/page"));
const AdminEmojisPage = lazy(() => import("@/app/(main)/admin/emojis/page"));
const AdminEventsPage = lazy(() => import("@/app/(main)/admin/events/page"));
const AdminImagesPage = lazy(() => import("@/app/(main)/admin/images/page"));
const AdminJamsPage = lazy(() => import("@/app/(main)/admin/jams/page"));
const AdminJamGamesPage = lazy(() => import("@/components/admin/AdminJamGames"));
const AdminResultsPage = lazy(() => import("@/app/(main)/admin/results/page"));
const AdminRecommendationsPage = lazy(() => import("@/app/(main)/admin/recommendations/page"));
const AdminThemeEliminationPage = lazy(
  () => import("@/app/(main)/admin/themes/elimination/page"),
);
const AdminThemeSuggestionsPage = lazy(
  () => import("@/app/(main)/admin/themes/suggestions/page"),
);
const AdminThemeVotingPage = lazy(
  () => import("@/app/(main)/admin/themes/voting/page"),
);
const CollectionsPage = lazy(() => import("@/app/(main)/collections/page"));
const CreateEventPage = lazy(() => import("@/app/(main)/create-event/page"));
const CreateGamePage = lazy(() => import("@/app/(main)/create-game/page"));
const ImportGamePage = lazy(() => import("@/app/(main)/import-game/page"));
const CreatePostPage = lazy(() => import("@/app/(main)/create-post/page"));
const DocsPage = lazy(() => import("@/app/(main)/docs/page"));
const DocsNewPage = lazy(() => import("@/app/(main)/docs/new/page"));
const DonatePage = lazy(() => import("@/app/(main)/donate/page"));
const EventPage = lazy(() => import("@/app/(main)/e/[slug]/page"));
const EventsPage = lazy(() => import("@/app/(main)/events/page"));
const ForgotPasswordPage = lazy(
  () => import("@/app/(main)/forgot-password/page"),
);
const Down2GuessPage = lazy(() => import("@/app/(main)/down2guess/page"));
const GamesPage = lazy(() => import("@/app/(main)/games/page"));
const HomePage = lazy(() => import("@/app/(main)/home/page"));
const InboxPage = lazy(() => import("@/app/(main)/inbox/page"));
const LinkDevicePage = lazy(() => import("@/app/(main)/link-device/page"));
const AuthorizeAppPage = lazy(() => import("@/app/(main)/authorize-app/page"));
const ConnectedAppsPage = lazy(() => import("@/app/(main)/connected-apps/page"));
const LoginPage = lazy(() => import("@/app/(main)/login/page"));
const LogoutPage = lazy(() => import("@/app/(main)/logout/page"));
const MusicPage = lazy(() => import("@/app/(main)/music/page"));
const NewsPage = lazy(() => import("@/app/(main)/news/page"));
const NewsArticlePage = lazy(() => import("@/app/(main)/news/[slug]/page"));
const PostPage = lazy(() => import("@/app/(main)/p/[slug]/page"));
const PressKitPage = lazy(() => import("@/app/(main)/press-kit/page"));
const PressKitNewPage = lazy(() => import("@/app/(main)/press-kit/new/page"));
const QuiltDetailPage = lazy(() => import("@/app/(main)/quilts/[quiltSlug]/page"));
const QuiltsPage = lazy(() => import("@/app/(main)/quilts/page"));
const RadioPage = lazy(() => import("@/app/(main)/radio/page"));
const RecapPage = lazy(() => import("@/app/(main)/recap/page"));
const BugReportPage = lazy(() => import("@/components/bug-reports/BugReportPage"));
const AdminBugReports = lazy(() => import("@/components/admin/AdminBugReports"));
const ReportsPage = lazy(() => import("@/app/(main)/reports/page"));
const ResultsPage = lazy(() => import("@/app/(main)/results/page"));
const RssPage = lazy(() => import("@/app/(main)/rss/page"));
const ScreenshotsPage = lazy(() => import("@/app/(main)/screenshots/page"));
const SettingsPage = lazy(() => import("@/app/(main)/settings/page"));
const SignupPage = lazy(() => import("@/app/(main)/signup/page"));
const SocialsPage = lazy(() => import("@/app/(main)/socials/page"));
const TeamPage = lazy(() => import("@/app/(main)/team/page"));
const TeamFinderPage = lazy(() => import("@/app/(main)/team-finder/page"));
const ThemeEliminationPage = lazy(
  () => import("@/app/(main)/theme-elimination/page"),
);
const ThemeSuggestionsPage = lazy(
  () => import("@/app/(main)/theme-suggestions/page"),
);
const ThemeVotingPage = lazy(() => import("@/app/(main)/theme-voting/page"));
const ThemesPage = lazy(() => import("@/app/(main)/themes/page"));
const LanguagesPage = lazy(() => import("@/app/(main)/languages/page"));
const WhyPage = lazy(() => import("@/app/(main)/why/page"));

const lazyRoute = <T extends ComponentType>(
  loader: () => Promise<Record<string, T>>,
  exportName: string,
) =>
  lazy(async () => {
    const module = await loader();
    return { default: module[exportName] };
  });

const CollectionRoute = lazyRoute(
  () => import("@/routes/RouteAdapters"),
  "CollectionRoute",
);
const DocsDetailRoute = lazyRoute(
  () => import("@/routes/RouteAdapters"),
  "DocsDetailRoute",
);
const GameRoute = lazyRoute(() => import("@/routes/RouteAdapters"), "GameRoute");
const GameEditRoute = lazyRoute(
  () => import("@/routes/RouteAdapters"),
  "GameEditRoute",
);
const LuckyRoute = lazyRoute(
  () => import("@/routes/RouteAdapters"),
  "LuckyRoute",
);
const PressKitDetailRoute = lazyRoute(
  () => import("@/routes/RouteAdapters"),
  "PressKitDetailRoute",
);
const RadioStationRoute = lazyRoute(
  () => import("@/routes/RouteAdapters"),
  "RadioStationRoute",
);
const RecapUserRoute = lazyRoute(
  () => import("@/routes/RouteAdapters"),
  "RecapUserRoute",
);
const TrackRoute = lazyRoute(
  () => import("@/routes/RouteAdapters"),
  "TrackRoute",
);
const TrackEditRoute = lazyRoute(
  () => import("@/routes/RouteAdapters"),
  "TrackEditRoute",
);
const UserRoute = lazyRoute(() => import("@/routes/RouteAdapters"), "UserRoute");

function RouteFallback() {
  return <div className="min-h-32" />;
}

function AdminRouteLayout() {
  return (
    <AdminGate>
      <Outlet />
    </AdminGate>
  );
}

const indexedRouteMetadata = [
  {
    pattern: /^\/$/,
    title: "Splash.Title",
    description: "Splash.Description",
  },
  {
    pattern: /^\/home\/?$/,
    title: "Navbar.Forum.Title",
    description: "AppStrings.CommunityPostsAnnouncementsAndUpdatesFromDown2Jam",
  },
  {
    pattern: /^\/about\/?$/,
    title: "Splash.About",
    description: "AppStrings.LearnAboutDown2JamTheCommunityCenteredGameJam",
  },
  {
    pattern: /^\/games\/?$/,
    title: "Navbar.Games.Title",
    description: "AppStrings.BrowseGamesSubmittedToDown2Jam",
  },
  {
    pattern: /^\/music\/?$/,
    title: "Navbar.Music.Title",
    description: "AppStrings.ListenToMusicSubmittedForDown2JamGames",
  },
  {
    pattern: /^\/results\/?$/,
    title: "Navbar.Results.Title",
    description: "AppStrings.ExploreDown2JamResultsWinnersRatingsAndRankings",
  },
  {
    pattern: /^\/radio(?:\/[^/]+)?\/?$/,
    title: "Navbar.Radio.Title",
    description: "AppStrings.ListenToDown2JamMusicRadio",
  },
  {
    pattern: /^\/import-game\/?$/,
    title: "AppStrings.ImportAGame",
    description: "AppStrings.ImportAnItchIoJamGameAndAddItToTheGameArchive",
  },
  {
    pattern: /^\/rss\/?$/,
    title: "AppStrings.RSSFeeds",
    description: "AppStrings.SubscribeToDown2JamUpdatesWithRSS",
  },
  {
    pattern: /^\/screenshots\/?$/,
    title: "Navbar.Screenshots.Title",
    description: "AppStrings.BrowseScreenshotsFromDown2JamGames",
  },
  {
    pattern: /^\/quilts(?:\/[^/]+)?\/?$/,
    title: "Navbar.Quilts.Title",
    description: "AppStrings.MakeCollaborativePixelArtQuiltsWithTheDown2JamCommunity",
  },
  {
    pattern: /^\/events\/?$/,
    title: "Navbar.Events.Title",
    description: "AppStrings.FindCurrentAndUpcomingDown2JamCommunityEvents",
  },
  {
    pattern: /^\/collections(?:\/[^/]+)?\/?$/,
    title: "Navbar.Collections.Title",
    description: "AppStrings.BrowseCuratedCollectionsOfDown2JamGamesMusicAndPosts",
  },
  {
    pattern: /^\/team-finder\/?$/,
    title: "Navbar.TeamFinder.Title",
    description: "AppStrings.FindTeammatesForTheNextDown2Jam",
  },
  {
    pattern: /^\/theme-suggestions\/?$/,
    title: "Navbar.ThemeSuggestions.Title",
    description: "AppStrings.SuggestThemesForAnUpcomingDown2Jam",
  },
  {
    pattern: /^\/theme-elimination\/?$/,
    title: "Navbar.ThemeElimination.Title",
    description: "AppStrings.HelpNarrowDownDown2JamThemeSuggestions",
  },
  {
    pattern: /^\/theme-voting\/?$/,
    title: "Navbar.ThemeVoting.Title",
    description: "AppStrings.VoteOnThemesForTheNextDown2Jam",
  },
  {
    pattern: /^\/themes\/?$/,
    title: "AppStrings.SiteThemes2",
    description: "AppStrings.BrowseAndPreviewTheAvailableDown2JamSiteThemes",
  },
  {
    pattern: /^\/languages\/?$/,
    title: "AppStrings.Languages",
    description: "AppStrings.BrowseAndChooseYourDown2JamSiteLanguage",
  },
  {
    pattern: /^\/docs(?:\/[^/]+)?\/?$/,
    title: "AppStrings.Documentation",
    description: "AppStrings.ReadDown2JamSiteDocumentationAndGuides",
  },
  {
    pattern: /^\/news(?:\/[^/]+)?\/?$/,
    title: "Navbar.News.Title",
    description: "AppStrings.OfficialDown2JamNewsAnnouncementsAndSiteUpdates",
  },
  {
    pattern: /^\/press-kit(?:\/[^/]+)?\/?$/,
    title: "Navbar.PressKit.Title",
    description: "AppStrings.DownloadAndViewDown2JamPressKitMaterials",
  },
  {
    pattern: /^\/donate\/?$/,
    title: "Navbar.Donate.Title",
    description: "AppStrings.SupportDown2JamAndItsCommunity",
  },
  {
    pattern: /^\/why\/?$/,
    title: "AppStrings.WhyDown2Jam",
    description: "AppStrings.WhyDown2JamExistsAndHowItSupportsCommunityGameJams",
  },
  {
    pattern: /^\/socials\/?$/,
    title: "AppStrings.Socials",
    description: "AppStrings.FindDown2JamCommunityLinksAndSocialChannels",
  },
  {
    pattern: /^\/d2guess\/?$/,
    title: "Navbar.Down2Guess.Title",
    description:
      "AppStrings.TryToGuessWhatRandomGameFromDown2JamTheSiteIsThinkingOf",
  },
  {
    pattern: /^\/recap(?:\/[^/]+)?\/?$/,
    title: "AppStrings.JamRecap",
    description: "AppStrings.ViewDown2JamRecapStatsAndHighlights",
  },
];

const noindexRoutePatterns = [
  /^\/admin(?:\/|$)/,
  /^\/create-/,
  /^\/docs\/new\/?$/,
  /^\/forgot-password\/?$/,
  /^\/inbox\/?$/,
  /^\/link-device\/?$/,
  /^\/authorize-app\/?$/,
  /^\/connected-apps\/?$/,
  /^\/login\/?$/,
  /^\/logout\/?$/,
  /^\/lucky\/?$/,
  /^\/reports\/?$/,
  /^\/report-bug\/?$/,
  /^\/settings(?:\/|$)/,
  /^\/signup\/?$/,
  /^\/team\/?$/,
  /^\/g\/[^/]+\/edit\/?$/,
  /^\/m\/[^/]+\/edit\/?$/,
  /^\/press-kit\/new\/?$/,
];

function DefaultMetadata() {
  const uiText = useUiTranslations();
  const location = useLocation();
  const routeMetadata = indexedRouteMetadata.find((entry) =>
    entry.pattern.test(location.pathname),
  );
  const isNoindex = noindexRoutePatterns.some((pattern) =>
    pattern.test(location.pathname),
  );
  usePageMetadata({
    title: uiText(routeMetadata?.title ?? "Splash.Title"),
    description:
      uiText(routeMetadata?.description ?? "Splash.Description"),
    image: "/images/D2J_Icon.png",
    icon: "/images/D2J_Icon.svg",
    canonical: `${location.pathname}${location.search}`,
    robots: isNoindex ? "noindex,nofollow" : "index,follow,max-image-preview:large",
  });
  return null;
}

export default function App() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <DefaultMetadata />
      <Routes>
        <Route path="/settings/twitch-callback" element={<TwitchCallback />} />
        <Route element={<MainLayout />}>
          <Route index element={<SplashRoute />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="admin" element={<AdminRouteLayout />}>
            <Route index element={<AdminPage />} />
            <Route path="bugs" element={<AdminBugReports />} />
            <Route path="emojis" element={<AdminEmojisPage />} />
            <Route path="events" element={<AdminEventsPage />} />
            <Route path="images" element={<AdminImagesPage />} />
            <Route path="jams" element={<AdminJamsPage />} />
            <Route path="jam-games" element={<AdminJamGamesPage />} />
            <Route path="results" element={<AdminResultsPage />} />
            <Route path="recommendations" element={<AdminRecommendationsPage />} />
            <Route
              path="themes/elimination"
              element={<AdminThemeEliminationPage />}
            />
            <Route
              path="themes/suggestions"
              element={<AdminThemeSuggestionsPage />}
            />
            <Route path="themes/voting" element={<AdminThemeVotingPage />} />
          </Route>
          <Route path="collections" element={<CollectionsPage />} />
          <Route path="c/:collectionId" element={<CollectionRoute />} />
          <Route path="create-event" element={<CreateEventPage />} />
          <Route path="create-game" element={<CreateGamePage />} />
          <Route path="create-post" element={<CreatePostPage />} />
          <Route path="docs" element={<DocsPage />} />
          <Route path="docs/new" element={<DocsNewPage />} />
          <Route path="docs/:slug" element={<DocsDetailRoute />} />
          <Route path="donate" element={<DonatePage />} />
          <Route path="e/:slug" element={<EventPage />} />
          <Route path="events" element={<EventsPage />} />
          <Route path="forgot-password" element={<ForgotPasswordPage />} />
          <Route path="g/:gameSlug" element={<GameRoute />} />
          <Route path="g/:gameSlug/edit" element={<GameEditRoute />} />
          <Route path="d2guess" element={<Down2GuessPage />} />
          <Route path="down2guess" element={<Navigate to="/d2guess" replace />} />
          <Route path="gamedle" element={<Navigate to="/d2guess" replace />} />
          <Route path="games" element={<Suspense fallback={<ListingPageLoading kind="games" />}><GamesPage /></Suspense>} />
          <Route path="import-game" element={<ImportGamePage />} />
          <Route path="home" element={<HomePage />} />
          <Route path="inbox/*" element={<InboxPage />} />
          <Route path="link-device" element={<LinkDevicePage />} />
          <Route path="authorize-app" element={<AuthorizeAppPage />} />
          <Route path="connected-apps" element={<ConnectedAppsPage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="logout" element={<LogoutPage />} />
          <Route path="lucky" element={<LuckyRoute />} />
          <Route path="m/:trackSlug" element={<TrackRoute />} />
          <Route path="m/:trackSlug/edit" element={<TrackEditRoute />} />
          <Route path="music" element={<Suspense fallback={<ListingPageLoading kind="music" />}><MusicPage /></Suspense>} />
          <Route path="news" element={<NewsPage />} />
          <Route path="news/:slug" element={<NewsArticlePage />} />
          <Route path="p/:slug" element={<PostPage />} />
          <Route path="press-kit" element={<PressKitPage />} />
          <Route path="press-kit/new" element={<PressKitNewPage />} />
          <Route path="press-kit/:slug" element={<PressKitDetailRoute />} />
          <Route path="quilts" element={<QuiltsPage />} />
          <Route path="quilts/:quiltSlug" element={<QuiltDetailPage />} />
          <Route path="radio" element={<RadioPage />} />
          <Route path="radio/:station" element={<RadioStationRoute />} />
          <Route path="recap" element={<RecapPage />} />
          <Route path="recap/:userSlug" element={<RecapUserRoute />} />
          <Route path="report-bug" element={<BugReportPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="results" element={<ResultsPage />} />
          <Route path="rss" element={<RssPage />} />
          <Route path="screenshots" element={<ScreenshotsPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="signup" element={<SignupPage />} />
          <Route path="socials" element={<SocialsPage />} />
          <Route path="team" element={<TeamPage />} />
          <Route path="team-finder" element={<TeamFinderPage />} />
          <Route path="theme-elimination" element={<ThemeEliminationPage />} />
          <Route path="theme-suggestions" element={<ThemeSuggestionsPage />} />
          <Route path="theme-voting" element={<ThemeVotingPage />} />
          <Route path="themes" element={<ThemesPage />} />
          <Route path="languages" element={<LanguagesPage />} />
          <Route path="u/:slug" element={<UserRoute />} />
          <Route path="why" element={<WhyPage />} />
          <Route path="*" element={<Navigate to="/home" replace />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
