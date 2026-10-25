import { Outlet, useMatch } from "react-router";
import PageBackground from "@/app/(main)/PageBackground";
import Navbar from "@/components/navbar";
import { useTheme } from "@/providers/useSiteTheme";

export default function MainLayout() {
  const { siteTheme } = useTheme();
  const musicLibraryPage = useMatch("/music");
  const createPostPage = useMatch("/create-post");
  const settingsPage = useMatch("/settings");
  const teamPage = useMatch("/team");
  const teamFinderPage = useMatch("/team-finder");
  const createGamePage = useMatch("/create-game");
  const createEventPage = useMatch("/create-event");
  const editGamePage = useMatch("/g/:gameSlug/edit");
  const reportBugPage = useMatch("/report-bug");
  const importGamePage = useMatch("/import-game");
  const eventsPage = useMatch("/events");
  const pressKitPage = useMatch("/press-kit/*");
  const rssPage = useMatch("/rss");
  const cardPage = Boolean(musicLibraryPage || createPostPage || settingsPage || teamPage || teamFinderPage || createGamePage || createEventPage || editGamePage || reportBugPage || importGamePage || eventsPage || pressKitPage || rssPage);
  const gamePage = useMatch("/g/:gameSlug");
  const musicPage = useMatch("/m/:trackSlug");
  const userPage = useMatch("/u/:userSlug");
  const gamesPage = useMatch("/games");
  const luckyPage = useMatch("/lucky");
  const aboutPage = useMatch("/about");
  const homePage = useMatch("/home");
  const siteThemesPage = useMatch("/themes");
  const languagesPage = useMatch("/languages");
  const radioPage = useMatch("/radio/*");
  const down2guessPage = useMatch("/d2guess");
  const useDefaultArtwork = Boolean(cardPage || gamePage || musicPage || userPage || gamesPage || luckyPage || aboutPage || homePage || siteThemesPage || languagesPage);
  const recapPage = useMatch("/recap/*");
  const adminRecapPage = useMatch("/admin/recap");
  const isRecap = Boolean(recapPage || adminRecapPage);
  return (
    <PageBackground plain={isRecap} fade={useDefaultArtwork} defaultImage={down2guessPage ? "/images/down2guess-collage.webp" : useDefaultArtwork ? "/images/background.png" : undefined} dimBackground={!gamePage && !musicPage}>
      {radioPage && <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 bg-black" />}
      {cardPage && <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 min-[701px]:hidden" style={{ backgroundColor: siteTheme.colors.mantle }} />}
      <Navbar />
      <div className={isRecap ? "z-10 mx-auto w-full grow pb-[calc(5rem+env(safe-area-inset-bottom))]" : `z-10 mx-auto w-full max-w-6xl grow ${musicLibraryPage ? "music-library-layout" : ""} ${cardPage ? "max-[700px]:mt-0! max-[700px]:px-0! max-[700px]:pt-0! max-[700px]:pb-[calc(5rem_+_env(safe-area-inset-bottom))]!" : ""} ${gamePage ? "pb-0" : "pb-[calc(5rem+env(safe-area-inset-bottom))]"} sm:pb-4 xl:max-w-7xl 2xl:max-w-[96em] ${gamePage || musicPage ? "mt-0 px-0 lg:mt-4 lg:px-8" : "mt-4 px-2 sm:px-8"}`}>
        <Outlet />
      </div>
      <div aria-hidden="true" style={{ height: "var(--expanded-player-height, 0px)", flexShrink: 0 }} />
    </PageBackground>
  );
}
