import { JamPhase, JamType } from "@/types/JamType";
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

export async function getCurrentJam(): Promise<ActiveJamResponse | null> {
  try {
    const response = await jamRequests.getCurrentJam();
    const json = await response.json();
    const data = json?.data ?? json;

    if (!data) {
      return null;
    }

    return {
      phase: data.phase ?? "No Active Jams",
      jam: data.jam ?? null,
      nextJam: data.nextJam ?? null,
    };
  } catch (error) {
    console.error("Error fetching active jam:", error);
    return null;
  }
}

export async function joinJam(jamId: number) {
  const response = await jamRequests.joinJam(jamId);

  if (response.status == 401) {
    return false;
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
