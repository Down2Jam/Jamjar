import { BASE_URL } from "./config";

export async function getTeams() {
  return fetch(`${BASE_URL}/teams`);
}

export async function getTeamRoles() {
  return fetch(`${BASE_URL}/teamroles`);
}
