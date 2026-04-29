import { lazy, Suspense, type ComponentType } from "react";
import { Navigate, Route, Routes } from "react-router";
import { useLocation } from "react-router";
import MainLayout from "@/routes/MainLayout";
import { usePageMetadata } from "@/hooks/usePageMetadata";

const SplashRoute = lazy(() => import("@/routes/SplashRoute"));
const AboutPage = lazy(() => import("@/app/(main)/about/page"));
const AdminPage = lazy(() => import("@/app/(main)/admin/page"));
const AdminEmojisPage = lazy(() => import("@/app/(main)/admin/emojis/page"));
const AdminEventsPage = lazy(() => import("@/app/(main)/admin/events/page"));
const AdminImagesPage = lazy(() => import("@/app/(main)/admin/images/page"));
const AdminJamsPage = lazy(() => import("@/app/(main)/admin/jams/page"));
const AdminResultsPage = lazy(() => import("@/app/(main)/admin/results/page"));
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
const CreatePostPage = lazy(() => import("@/app/(main)/create-post/page"));
const DocsPage = lazy(() => import("@/app/(main)/docs/page"));
const DocsNewPage = lazy(() => import("@/app/(main)/docs/new/page"));
const DonatePage = lazy(() => import("@/app/(main)/donate/page"));
const EventPage = lazy(() => import("@/app/(main)/e/[slug]/page"));
const EventsPage = lazy(() => import("@/app/(main)/events/page"));
const ForgotPasswordPage = lazy(
  () => import("@/app/(main)/forgot-password/page"),
);
const GamedlePage = lazy(() => import("@/app/(main)/gamedle/page"));
const GamesPage = lazy(() => import("@/app/(main)/games/page"));
const HomePage = lazy(() => import("@/app/(main)/home/page"));
const InboxPage = lazy(() => import("@/app/(main)/inbox/page"));
const LoginPage = lazy(() => import("@/app/(main)/login/page"));
const LogoutPage = lazy(() => import("@/app/(main)/logout/page"));
const MusicPage = lazy(() => import("@/app/(main)/music/page"));
const PostPage = lazy(() => import("@/app/(main)/p/[slug]/page"));
const PressKitPage = lazy(() => import("@/app/(main)/press-kit/page"));
const PressKitNewPage = lazy(() => import("@/app/(main)/press-kit/new/page"));
const QuiltDetailPage = lazy(() => import("@/app/(main)/quilts/[quiltSlug]/page"));
const QuiltsPage = lazy(() => import("@/app/(main)/quilts/page"));
const RadioPage = lazy(() => import("@/app/(main)/radio/page"));
const RecapPage = lazy(() => import("@/app/(main)/recap/page"));
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

const indexedRouteMetadata = [
  {
    pattern: /^\/$/,
    title: "Down2Jam",
    description: "The community centered game jam",
  },
  {
    pattern: /^\/home\/?$/,
    title: "Forum",
    description: "Community posts, announcements, and updates from Down2Jam.",
  },
  {
    pattern: /^\/about\/?$/,
    title: "About",
    description: "Learn about Down2Jam, the community centered game jam.",
  },
  {
    pattern: /^\/games\/?$/,
    title: "Games",
    description: "Browse games submitted to Down2Jam.",
  },
  {
    pattern: /^\/music\/?$/,
    title: "Music",
    description: "Listen to music submitted for Down2Jam games.",
  },
  {
    pattern: /^\/results\/?$/,
    title: "Results",
    description: "Explore Down2Jam results, winners, ratings, and rankings.",
  },
  {
    pattern: /^\/radio(?:\/[^/]+)?\/?$/,
    title: "Radio",
    description: "Listen to Down2Jam music radio.",
  },
  {
    pattern: /^\/screenshots\/?$/,
    title: "Screenshots",
    description: "Browse screenshots from Down2Jam games.",
  },
  {
    pattern: /^\/quilts(?:\/[^/]+)?\/?$/,
    title: "Quilts",
    description: "Make collaborative pixel art quilts with the Down2Jam community.",
  },
  {
    pattern: /^\/events\/?$/,
    title: "Events",
    description: "Find current and upcoming Down2Jam community events.",
  },
  {
    pattern: /^\/collections(?:\/[^/]+)?\/?$/,
    title: "Collections",
    description: "Browse curated collections of Down2Jam games, music, and posts.",
  },
  {
    pattern: /^\/team-finder\/?$/,
    title: "Team Finder",
    description: "Find teammates for the next Down2Jam.",
  },
  {
    pattern: /^\/theme-suggestions\/?$/,
    title: "Theme Suggestions",
    description: "Suggest themes for an upcoming Down2Jam.",
  },
  {
    pattern: /^\/theme-elimination\/?$/,
    title: "Theme Elimination",
    description: "Help narrow down Down2Jam theme suggestions.",
  },
  {
    pattern: /^\/theme-voting\/?$/,
    title: "Theme Voting",
    description: "Vote on themes for the next Down2Jam.",
  },
  {
    pattern: /^\/docs(?:\/[^/]+)?\/?$/,
    title: "Documentation",
    description: "Read Down2Jam site documentation and guides.",
  },
  {
    pattern: /^\/press-kit(?:\/[^/]+)?\/?$/,
    title: "Press Kit",
    description: "Download and view Down2Jam press kit materials.",
  },
  {
    pattern: /^\/donate\/?$/,
    title: "Donate",
    description: "Support Down2Jam and its community.",
  },
  {
    pattern: /^\/why\/?$/,
    title: "Why Down2Jam",
    description: "Why Down2Jam exists and how it supports community game jams.",
  },
  {
    pattern: /^\/socials\/?$/,
    title: "Socials",
    description: "Find Down2Jam community links and social channels.",
  },
  {
    pattern: /^\/gamedle\/?$/,
    title: "Gamedle",
    description: "Play the Down2Jam game guessing challenge.",
  },
  {
    pattern: /^\/recap(?:\/[^/]+)?\/?$/,
    title: "Jam Recap",
    description: "View Down2Jam recap stats and highlights.",
  },
];

const noindexRoutePatterns = [
  /^\/admin(?:\/|$)/,
  /^\/create-/,
  /^\/docs\/new\/?$/,
  /^\/forgot-password\/?$/,
  /^\/inbox\/?$/,
  /^\/login\/?$/,
  /^\/logout\/?$/,
  /^\/lucky\/?$/,
  /^\/reports\/?$/,
  /^\/settings\/?$/,
  /^\/signup\/?$/,
  /^\/team\/?$/,
  /^\/g\/[^/]+\/edit\/?$/,
  /^\/m\/[^/]+\/edit\/?$/,
  /^\/press-kit\/new\/?$/,
];

function DefaultMetadata() {
  const location = useLocation();
  const routeMetadata = indexedRouteMetadata.find((entry) =>
    entry.pattern.test(location.pathname),
  );
  const isNoindex = noindexRoutePatterns.some((pattern) =>
    pattern.test(location.pathname),
  );
  usePageMetadata({
    title: routeMetadata?.title ?? "Down2Jam",
    description:
      routeMetadata?.description ?? "The community centered game jam",
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
        <Route element={<MainLayout />}>
          <Route index element={<SplashRoute />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="admin" element={<AdminPage />} />
          <Route path="admin/emojis" element={<AdminEmojisPage />} />
          <Route path="admin/events" element={<AdminEventsPage />} />
          <Route path="admin/images" element={<AdminImagesPage />} />
          <Route path="admin/jams" element={<AdminJamsPage />} />
          <Route path="admin/results" element={<AdminResultsPage />} />
          <Route
            path="admin/themes/elimination"
            element={<AdminThemeEliminationPage />}
          />
          <Route
            path="admin/themes/suggestions"
            element={<AdminThemeSuggestionsPage />}
          />
          <Route path="admin/themes/voting" element={<AdminThemeVotingPage />} />
          <Route path="collections" element={<CollectionsPage />} />
          <Route path="collections/:collectionId" element={<CollectionRoute />} />
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
          <Route path="gamedle" element={<GamedlePage />} />
          <Route path="games" element={<GamesPage />} />
          <Route path="home" element={<HomePage />} />
          <Route path="inbox" element={<InboxPage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="logout" element={<LogoutPage />} />
          <Route path="lucky" element={<LuckyRoute />} />
          <Route path="m/:trackSlug" element={<TrackRoute />} />
          <Route path="m/:trackSlug/edit" element={<TrackEditRoute />} />
          <Route path="music" element={<MusicPage />} />
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
          <Route path="u/:slug" element={<UserRoute />} />
          <Route path="why" element={<WhyPage />} />
          <Route path="*" element={<Navigate to="/home" replace />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
