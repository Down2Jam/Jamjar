import { JamPhase, JamType } from "@/types/JamType";
import { toast } from "react-toastify";
import * as jamRequests from "@/requests/jam";

export interface ActiveJamResponse {
  phase: JamPhase;
  jam: JamType | null; // Jam will be null if no active jam is found
}

export async function getJams(): Promise<JamType[]> {
  const response = await jamRequests.getJams();
  return response.json();
}

export async function getCurrentJam(): Promise<ActiveJamResponse | null> {
  try {
    const response = await jamRequests.getCurrentJam();
    const data = (await response.json()).data;

    return {
      phase: data.phase,
      jam: data.futureJam,
    };
  } catch (error) {
    console.error("Error fetching active jam:", error);
    return null;
  }
}

export async function joinJam(jamId: number) {
  const response = await jamRequests.joinJam(jamId);

  if (response.status == 401) {
    toast.error("You have already joined the jam");
    return false;
  } else if (response.ok) {
    toast.success("Joined jam");
    return true;
  } else {
    toast.error("Error while trying to join jam");
    return false;
  }
}

export async function hasJoinedCurrentJam(): Promise<boolean> {
  try {
    const response = await jamRequests.hasJoinedCurrentJam();

    return response.ok;
  } catch (error) {
    console.error("Error checking jam participation:", error);
    return false;
  }
}
