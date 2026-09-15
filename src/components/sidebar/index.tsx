import SidebarStats from "./SidebarStats";
import SidebarNextJam from "./SidebarNextJam";
import SidebarStreams from "./SidebarStreams";
import SidebarEvents from "./SidebarEvents";
import SidebarGames from "./SidebarGames";
import SidebarMusic from "./SidebarMusic";
import SidebarScreenshots from "./SidebarScreenshots";
import SidebarVideos from "./SidebarVideos";
import SidebarAchievements from "./SidebarAchievements";
import SidebarScores from "./SidebarScores";
import { useEffect, useRef, useState, type ReactNode } from "react";
import useBreakpoint from "@/hooks/useBreakpoint";
import { useCurrentJam } from "@/hooks/queries";
import { SidebarCardSkeleton } from "@/components/skeletons";

function DeferredSection({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!ref.current) return;
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      setVisible(true);
      observer.disconnect();
    }, { rootMargin: "200px" });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return <div ref={ref} style={visible ? undefined : { minHeight: 240 }}>
    {visible ? children : <SidebarCardSkeleton lines={3} />}
  </div>;
}

export default function Sidebar() {
  const { isMdUp } = useBreakpoint();
  const { isPending, isSuccess } = useCurrentJam();

  // CSS hiding still mounts children and runs their queries. Wait for the jam
  // as well, so sections never fetch an all-jams list with provisional filters.
  if (!isMdUp) return null;
  if (isPending) return <div className="md:w-[clamp(260px,30vw,480px)]"><SidebarCardSkeleton lines={3} /></div>;
  if (!isSuccess) return null;

  return (
    <div className="hidden flex-col gap-3 md:flex md:w-[clamp(260px,30vw,480px)]">
      <SidebarStats />
      <SidebarNextJam />
      <DeferredSection><SidebarStreams /></DeferredSection>
      <DeferredSection><SidebarEvents /></DeferredSection>
      <DeferredSection><SidebarGames /></DeferredSection>
      <DeferredSection><SidebarMusic /></DeferredSection>
      <DeferredSection><SidebarVideos /></DeferredSection>
      <DeferredSection><SidebarScreenshots /></DeferredSection>
      <DeferredSection><SidebarAchievements /></DeferredSection>
      <DeferredSection><SidebarScores /></DeferredSection>
    </div>
  );
}
