"use client";

import { useEffect, useState } from "react";
import { getCurrentJam } from "@/helpers/jam"; // Adjust this path if needed
import type { JamType, JamPhase } from "@/types/JamType"; // Adjust types

type UseJamReturn = {
  jam: JamType | null;
  jamPhase: JamPhase | null;
};

export function useJam(): UseJamReturn {
  const [jam, setJam] = useState<JamType | null>(null);
  const [jamPhase, setJamPhase] = useState<JamPhase | null>(null);

  useEffect(() => {
    const fetchJam = async () => {
      const jamResponse = await getCurrentJam();
      setJam(jamResponse?.jam || null);
      setJamPhase(jamResponse?.phase || null);
    };

    fetchJam();
  }, []);

  return { jam, jamPhase };
}
