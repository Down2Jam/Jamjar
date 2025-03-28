import ThemeVoting from "@/components/themes/theme-vote";
import Sidebar from "@/components/sidebar";

export default async function Home() {
  return (
    <div className="flex justify-between flex-wrap">
      <div className="md:w-2/3">
        <ThemeVoting />
      </div>
      <Sidebar />
    </div>
  );
}
