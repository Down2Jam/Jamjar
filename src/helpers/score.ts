import { toast } from "react-toastify";
import * as scoreRequests from "@/requests/score";

export async function postScore(
  value: number,
  evidence: string,
  leaderboardId: number
) {
  const response = await scoreRequests.postScore(
    value,
    evidence,
    leaderboardId
  );

  const data = await response.json();

  if (response.ok) {
    toast.success("Created score");
    return data.data;
  }

  toast.error(data.message);
  return false;
}

export async function deleteScore(scoreId: number) {
  const response = await scoreRequests.deleteScore(scoreId);

  const data = await response.json();

  if (response.ok) {
    toast.success("Deleted score");
    return true;
  }

  toast.error(data.message);
  return false;
}
