import * as scoreRequests from "@/requests/score";
import { addToast } from "@heroui/react";

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
    addToast({
      title: "Created score",
    });
    return data.data;
  }

  addToast({
    title: data.message,
  });
  return false;
}

export async function deleteScore(scoreId: number) {
  const response = await scoreRequests.deleteScore(scoreId);

  const data = await response.json();

  if (response.ok) {
    addToast({
      title: "Deleted score",
    });
    return true;
  }

  addToast({
    title: data.message,
  });
  return false;
}
