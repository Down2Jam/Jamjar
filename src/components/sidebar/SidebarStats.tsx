import { Spacer } from "@nextui-org/react";
import Timers from "../timers";
import { getCurrentJam } from "@/helpers/jam";

export default async function SidebarStats() {
  const jamResponse = await getCurrentJam();
  const currentJam = jamResponse?.jam;
  const stats = { entrants: currentJam?.users.length || 0 };

  return (
    <div className="border rounded-xl p-4 text-[#333] dark:text-white text-center bg-[#ffffff] dark:bg-[#18181a] border-[#dbdbdb] dark:border-[#1f1f21] shadow-2xl">
      <Timers />
      <Spacer />
      <p>Entrants</p>
      <p className="text-4xl">{stats?.entrants}</p>
    </div>
  );
}
