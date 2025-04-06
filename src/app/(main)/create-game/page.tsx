import CreateGame from "@/components/create-game";
import Sidebar from "@/components/sidebar";

export default function CreateGamePage() {
  return (
    <div className="flex justify-between flex-col md:flex-row">
      <div className="w-full md:w-2/3">
        <CreateGame />
      </div>
      <Sidebar />
    </div>
  );
}
