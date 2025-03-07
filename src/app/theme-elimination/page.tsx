import ThemeSlaughter from "@/components/themes/theme-slaughter";
import Sidebar from "@/components/sidebar";

export default async function Home() {
  return (
    <div className="flex justify-between flex-col md:flex-row">
      <div className="w-full md:w-2/3">
        <ThemeSlaughter />
      </div>
      <Sidebar />
    </div>
  );
}
