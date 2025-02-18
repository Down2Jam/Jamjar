import Timers from "@/components/timers";
import ThemeVoting from "@/components/themes/theme-vote";
import SidebarStreams from "@/components/sidebar/SidebarStreams";

export default async function Home() {
  return (
    <div className="flex justify-between flex-wrap">
      <div className="md:w-2/3">
        <ThemeVoting />
      </div>
      <div>
        <Timers />
        <SidebarStreams />
      </div>
    </div>
  );
}
