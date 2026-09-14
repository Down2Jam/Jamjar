import type { JamPhase, JamType } from "@/types/JamType";
import * as jamRequests from "@/requests/jam";
import { unwrapArray, unwrapItem } from "@/requests/helpers";

export interface ActiveJamResponse {
  phase: JamPhase;
  jam: JamType | null; // Jam will be null if no active jam is found
  nextJam?: JamType | null;
}

export async function getJams(): Promise<JamType[]> {
  const response = await jamRequests.getJams();
  return unwrapArray<JamType>(await response.json());
}

export async function getCurrentJam(): Promise<ActiveJamResponse> {
  const response = await jamRequests.getCurrentJam();
  // Reject failed refreshes so React Query retains the last successful jam
  // and retries, instead of caching a failure as an empty jam.
  if (!response.ok) {
    throw new Error(`Error fetching active jam (${response.status})`);
  }

  const data = unwrapItem<ActiveJamResponse>(await response.json());
  if (
    !data ||
    typeof data.phase !== "string" ||
    (!data.jam && data.phase !== "No Active Jams")
  ) {
    throw new Error("Invalid active jam response");
  }

  return {
    phase: data.phase,
    jam: data.jam ?? null,
    nextJam: data.nextJam ?? null,
  };
}

export async function joinJam(jamId: number) {
  const response = await jamRequests.joinJam(jamId);

  if (response.status == 401) {
    return false;
  } else if (response.status === 409) {
    // The desired state is already true, so let callers update their UI.
    return true;
  } else if (response.ok) {
    return true;
  } else {
    return false;
  }
}

export async function hasJoinedCurrentJam(): Promise<boolean> {
  try {
    const activeJam = await getCurrentJam();
    const jamSlug = (activeJam?.jam as (JamType & { slug?: string }) | null)
      ?.slug;
    if (!jamSlug) return false;

    const response = await jamRequests.hasJoinedJam(jamSlug);

    return Boolean(unwrapItem<boolean>(await response.json()));
  } catch (error) {
    console.error("Error checking jam participation:", error);
    return false;
  }
}

export async function hasJoinedJam(jamSlug: string): Promise<boolean> {
  try {
    const response = await jamRequests.hasJoinedJam(jamSlug);

    return Boolean(unwrapItem<boolean>(await response.json()));
  } catch (error) {
    console.error("Error checking jam participation:", error);
    return false;
  }
}

export async function leaveJam(jamSlug: string) {
  try {
    const response = await jamRequests.leaveJam(jamSlug);
    return response.ok;
  } catch (error) {
    console.error("Error leaving jam:", error);
    return false;
  }
}
