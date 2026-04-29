import { getCookie } from "@/helpers/cookie";
import { BASE_URL } from "./config";
import { UserType } from "@/types/UserType";
import { TeamInviteType } from "@/types/TeamInviteType";

export async function getTeams(cursor?: string | null, limit = 50) {
  const params = new URLSearchParams({ limit: String(limit) });
  if (cursor) params.set("cursor", cursor);
  return fetch(`${BASE_URL}/teams?${params.toString()}`);
}

export async function getTeamsUser(cursor?: string | null, limit = 50) {
  const params = new URLSearchParams({ limit: String(limit) });
  const userSlug = getCookie("user");
  if (userSlug) params.set("targetUserSlug", userSlug);
  if (cursor) params.set("cursor", cursor);
  return fetch(`${BASE_URL}/teams?${params.toString()}`);
}

export async function getTeamRoles() {
  return fetch(`${BASE_URL}/teamroles`);
}

export async function applyToTeam(teamId: number, body: string) {
  return fetch(`${BASE_URL}/application`, {
    body: JSON.stringify({
      targetTeamId: teamId,
      userSlug: getCookie("user"),
      content: body,
    }),
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      authorization: `Bearer ${getCookie("token")}`,
    },
  });
}

export async function deleteTeam(teamId: number) {
  return fetch(`${BASE_URL}/teams/${teamId}`, {
    method: "DELETE",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      authorization: `Bearer ${getCookie("token")}`,
    },
  });
}

export async function handleInvite(inviteId: number, accept: boolean) {
  return fetch(`${BASE_URL}/invite`, {
    body: JSON.stringify({
      inviteId: inviteId,
      accept: accept,
    }),
    method: "DELETE",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      authorization: `Bearer ${getCookie("token")}`,
    },
  });
}

export async function handleApplication(inviteId: number, accept: boolean) {
  return fetch(`${BASE_URL}/application`, {
    body: JSON.stringify({
      inviteId: inviteId,
      accept: accept,
    }),
    method: "DELETE",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      authorization: `Bearer ${getCookie("token")}`,
    },
  });
}

export async function leaveTeam(teamId: number) {
  return fetch(`${BASE_URL}/leave-team`, {
    body: JSON.stringify({
      targetTeamId: teamId,
    }),
    method: "DELETE",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      authorization: `Bearer ${getCookie("token")}`,
    },
  });
}

export async function inviteToTeam(
  teamId: number,
  targetUserId: number,
  body: string
) {
  return fetch(`${BASE_URL}/invite`, {
    body: JSON.stringify({
      targetTeamId: teamId,
      targetUserId: targetUserId,
      content: body,
    }),
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      authorization: `Bearer ${getCookie("token")}`,
    },
  });
}

export async function createTeam() {
  return fetch(`${BASE_URL}/teams`, {
    body: JSON.stringify({
      userSlug: getCookie("user"),
    }),
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      authorization: `Bearer ${getCookie("token")}`,
    },
  });
}

export async function updateTeam(
  teamId: number,
  users: UserType[],
  invitations: TeamInviteType[],
  applicationsOpen: boolean,
  wantedRoles: string[],
  description: string,
  name: string
) {
  const tokenCookie = getCookie("token");
  if (!tokenCookie) return Promise.reject("Token cookie not found.");

  return fetch(`${BASE_URL}/teams/${teamId}`, {
    body: JSON.stringify({
      targetTeamId: teamId,
      applicationsOpen: applicationsOpen,
      rolesWanted: wantedRoles,
      description: description,
      users: users,
      invitations: invitations,
      name: name,
    }),
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      authorization: `Bearer ${tokenCookie}`,
    },
    credentials: "include",
  });
}
