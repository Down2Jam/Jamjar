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

export default function Sidebar() {
  return (
    <div className="hidden flex-col gap-3 md:flex md:w-[clamp(260px,30vw,480px)]">
      <SidebarStats />
      <SidebarNextJam />
      <SidebarStreams />
      <SidebarEvents />
      <SidebarGames />
      <SidebarMusic />
      <SidebarVideos />
      <SidebarScreenshots />
      <SidebarAchievements />
      <SidebarScores />
    </div>
  );
}
