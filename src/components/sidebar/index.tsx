"use client";

import { Spacer } from "@nextui-org/react";
import Streams from "../streams";
import Timers from "../timers";
import SidebarBanner from "./SidebarBanner";
import SidebarButtons from "./SidebarButtons";
import SidebarEvents from "./SidebarEvents";
import SidebarGames from "./SidebarGames";
import SidebarStats from "./SidebarStats";
import SidebarMusic from "./SidebarMusic";

export default function Sidebar() {
  return (
    <div className="flex flex-col gap-3">
      <SidebarBanner />
      <SidebarButtons />
      <SidebarStats />
      <Streams />
      <Spacer y={20} />
      <SidebarEvents />
      <Spacer y={20} />
      <SidebarGames />
      <Spacer y={20} />
      <SidebarMusic />
    </div>
  );
}
