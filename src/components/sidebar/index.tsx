import SidebarBanner from "./SidebarBanner";
import SidebarButtons from "./SidebarButtons";
import SidebarStats from "./SidebarStats";
import SidebarStreams from "./SidebarStreams";

export default function Sidebar() {
  return (
    <div className="flex flex-col gap-3">
      <SidebarBanner />
      <SidebarButtons />
      <SidebarStats />
      <SidebarStreams />
      {/* <Spacer y={20} />
      <SidebarEvents /> */}
      {/* <Spacer y={20} />
      <SidebarGames />
      <Spacer y={20} />
      <SidebarMusic /> */}
    </div>
  );
}
