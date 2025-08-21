import SidebarBanner from "./SidebarBanner";
import SidebarButtons from "./SidebarButtons";
import SidebarStats from "./SidebarStats";
import SidebarStreams from "./SidebarStreams";
import SidebarEvents from "./SidebarEvents";
import SidebarGames from "./SidebarGames";
import SidebarMusic from "./SidebarMusic";

export default function Sidebar() {
  return (
    <div className="hidden flex-col gap-3 md:flex">
      <SidebarBanner />
      <SidebarButtons />
      <SidebarStats />
      <SidebarStreams />
      <SidebarEvents />
      <SidebarGames />
      <SidebarMusic />
    </div>
  );
}
