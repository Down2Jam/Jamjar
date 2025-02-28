import { BASE_URL } from "./config";

export async function getStreamers() {
  return fetch(`${BASE_URL}/streamers`);
}
