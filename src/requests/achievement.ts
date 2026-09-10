import { BASE_URL } from "./config";

export function getRecentAchievements() {
  return fetch(`${BASE_URL}/achievements/recent`);
}
