"use client";

import { Image, Spacer } from "@nextui-org/react";
import NextImage from "next/image";
import Streams from "../streams";
import Timers from "../timers";
import ButtonLink from "../link-components/ButtonLink";
import { SiDiscord } from "@icons-pack/react-simple-icons";
import { useEffect, useState } from "react";
import { getCurrentJam } from "@/helpers/jam";

export default function SidebarStats() {
  const [stats, setStats] = useState<{ entrants: number }>();
  useEffect(() => {
    loadUser();
    async function loadUser() {
      const jamResponse = await getCurrentJam();
      console.log(jamResponse);
      console.log(jamResponse?.jam);
      const currentJam = jamResponse?.jam;
      setStats({ entrants: currentJam?.users.length || 0 });
    }
  }, []);

  return (
    <div className="border rounded-xl p-4 text-center bg-[#1c2026] border-[#1892b3]">
      <Timers />
      <Spacer />
      <p>Entrants</p>
      <p className="text-4xl">{stats?.entrants}</p>
    </div>
  );
}
