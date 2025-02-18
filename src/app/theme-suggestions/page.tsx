import Timers from "@/components/timers";
import ThemeSuggestions from "@/components/themes/theme-suggest";
import SidebarStreams from "@/components/sidebar/SidebarStreams";

export default async function Home() {
  return (
    <div className="flex justify-between flex-wrap">
      <div className="md:w-2/3">
        <ThemeSuggestions />
      </div>
      <div>
        <Timers />
        <SidebarStreams />
      </div>
    </div>
  );
}
