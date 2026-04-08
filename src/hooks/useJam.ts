"use client";

import { useCurrentJam } from "@/hooks/queries";
import type { JamType, JamPhase } from "@/types/JamType";

type UseJamReturn = {
  jam: JamType | null;
  nextJam: JamType | null;
  jamPhase: JamPhase | null;
};

export function useJam(): UseJamReturn {
  const { data } = useCurrentJam();

  return {
    jam: data?.jam ?? null,
    nextJam: data?.nextJam ?? null,
    jamPhase: data?.phase ?? null,
  };
}
