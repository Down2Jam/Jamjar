import SidebarBanner from "./SidebarBanner";
import SidebarButtons from "./SidebarButtons";
import SidebarStats from "./SidebarStats";
import SidebarStreams from "./SidebarStreams";
import SidebarEvents from "./SidebarEvents";
import SidebarGames from "./SidebarGames";

export default function Sidebar() {
  return (
    <div className="flex flex-col gap-3">
      <SidebarBanner />
      <SidebarButtons />
      <SidebarStats />
      <SidebarStreams />
      <SidebarEvents />
      <SidebarGames />
      {/*<Spacer y={20} />
      <SidebarMusic /> */}
    </div>
  );
}
