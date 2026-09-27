"use client";

import { useCurrentJamMetadata } from "@/hooks/queries";
import type { JamMetadata, JamPhase } from "@/types/JamType";

type UseJamReturn = {
  jam: JamMetadata | null;
  nextJam: JamMetadata | null;
  jamPhase: JamPhase | null;
};

export function useJam(): UseJamReturn {
  const { data } = useCurrentJamMetadata();

  return {
    jam: data?.jam ?? null,
    nextJam: data?.nextJam ?? null,
    jamPhase: data?.phase ?? null,
  };
}
