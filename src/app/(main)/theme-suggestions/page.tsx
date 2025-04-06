import ThemeSuggestions from "@/components/themes/theme-suggest";
import Sidebar from "@/components/sidebar";

export default async function Home() {
  return (
    <div className="flex justify-between flex-wrap">
      <div className="md:w-2/3">
        <ThemeSuggestions />
      </div>
      <Sidebar />
    </div>
  );
}
