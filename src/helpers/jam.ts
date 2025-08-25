import { JamPhase, JamType } from "@/types/JamType";
import * as jamRequests from "@/requests/jam";
import { addToast } from "@heroui/react";

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
      jam: data.jam,
    };
  } catch (error) {
    console.error("Error fetching active jam:", error);
    return null;
  }
}

export async function joinJam(jamId: number) {
  const response = await jamRequests.joinJam(jamId);

  if (response.status == 401) {
    addToast({
      title: "You have already joined the jam",
    });
    return false;
  } else if (response.ok) {
    addToast({
      title: "Joined jam",
    });
    return true;
  } else {
    addToast({
      title: "Error while trying to join jam",
    });
    return false;
  }
}

export async function hasJoinedCurrentJam(): Promise<boolean> {
  try {
    const response = await jamRequests.hasJoinedCurrentJam();

    return (await response.json()).data;
  } catch (error) {
    console.error("Error checking jam participation:", error);
    return false;
  }
}
