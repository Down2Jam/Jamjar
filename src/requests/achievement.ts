import { BASE_URL } from "./config";

export function getRecentAchievements(jamId?: number) {
  const params = new URLSearchParams();
  if (jamId !== undefined) params.set("jamId", String(jamId));
  return fetch(
    `${BASE_URL}/achievements/recent${params.size ? `?${params.toString()}` : ""}`,
  );
}
