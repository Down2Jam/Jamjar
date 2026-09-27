import { Outlet, useMatch } from "react-router";
import PageBackground from "@/app/(main)/PageBackground";
import Navbar from "@/components/navbar";

export default function MainLayout() {
  const gamePage = useMatch("/g/:gameSlug");
  const musicPage = useMatch("/m/:trackSlug");
  const recapPage = useMatch("/recap/*");
  const adminRecapPage = useMatch("/admin/recap");
  const isRecap = Boolean(recapPage || adminRecapPage);
  return (
    <PageBackground plain={isRecap} defaultImage={gamePage || musicPage ? null : undefined} dimBackground={!gamePage && !musicPage}>
      <Navbar />
      <div className={isRecap ? "z-10 mx-auto w-full grow pb-[calc(5rem+env(safe-area-inset-bottom))]" : `z-10 mx-auto w-full max-w-6xl grow ${gamePage ? "pb-0" : "pb-[calc(5rem+env(safe-area-inset-bottom))]"} sm:pb-4 xl:max-w-7xl 2xl:max-w-[96em] ${gamePage || musicPage ? "mt-0 px-0 lg:mt-4 lg:px-8" : "mt-4 px-2 sm:px-8"}`}>
        <Outlet />
      </div>
    </PageBackground>
  );
}
