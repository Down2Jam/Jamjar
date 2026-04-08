import SidebarBanner from "./SidebarBanner";
import SidebarButtons from "./SidebarButtons";
import SidebarStats from "./SidebarStats";
import SidebarNextJam from "./SidebarNextJam";
import SidebarStreams from "./SidebarStreams";
import SidebarEvents from "./SidebarEvents";
import SidebarGames from "./SidebarGames";
import SidebarMusic from "./SidebarMusic";

export default function Sidebar() {
  return (
    <div className="hidden flex-col gap-3 md:flex md:w-[480px] md:min-w-[480px] md:max-w-[480px]">
      <SidebarBanner />
      <SidebarButtons />
      <SidebarStats />
      <SidebarNextJam />
      <SidebarStreams />
      <SidebarEvents />
      <SidebarGames />
      <SidebarMusic />
    </div>
  );
}
