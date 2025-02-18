import Timers from "@/components/timers";
import ThemeSlaughter from "@/components/themes/theme-slaughter";
import SidebarStreams from "@/components/sidebar/SidebarStreams";

export default async function Home() {
  return (
    <div className="flex justify-between flex-wrap">
      <div className="md:w-2/3">
        <ThemeSlaughter />
      </div>
      <div>
        <Timers />
        <SidebarStreams />
      </div>
    </div>
  );
}
