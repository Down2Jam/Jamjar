import * as teamRequests from "@/requests/team";
import { addToast } from "@heroui/react";

export async function applyToTeam(teamId: number, body: string) {
  const response = await teamRequests.applyToTeam(teamId, body);

  if (response.ok) {
    addToast({
      title: "Applied to team",
    });
    return true;
  }

  const data = await response.json();
  addToast({
    title: data.message,
  });
  return false;
}

export async function deleteTeam(teamId: number) {
  const response = await teamRequests.deleteTeam(teamId);

  if (response.ok) {
    addToast({
      title: "Deleted team",
    });
    return true;
  }

  const data = await response.json();
  addToast({
    title: data.message,
  });
  return false;
}

export async function handleInvite(inviteId: number, accept: boolean) {
  const response = await teamRequests.handleInvite(inviteId, accept);

  if (response.ok) {
    addToast({
      title: accept ? "Accepted invite" : "Rejected invite",
    });
    return true;
  }

  const data = await response.json();
  addToast({
    title: data.message,
  });
  return false;
}

export async function handleApplication(inviteId: number, accept: boolean) {
  const response = await teamRequests.handleApplication(inviteId, accept);

  if (response.ok) {
    addToast({
      title: accept ? "Accepted application" : "Rejected application",
    });
    return true;
  }

  const data = await response.json();
  addToast({
    title: data.message,
  });
  return false;
}

export async function leaveTeam(teamId: number) {
  const response = await teamRequests.leaveTeam(teamId);

  if (response.ok) {
    addToast({
      title: "Left team",
    });
    return true;
  }

  const data = await response.json();
  addToast({
    title: data.message,
  });
  return false;
}

export async function inviteToTeam(
  teamId: number,
  targetUserId: number,
  body: string
) {
  const response = await teamRequests.inviteToTeam(teamId, targetUserId, body);

  const data = await response.json();

  if (response.ok) {
    addToast({
      title: "Invited to team",
    });
    return data.data;
  }

  addToast({
    title: data.message,
  });
  return false;
}

export async function createTeam() {
  const response = await teamRequests.createTeam();

  if (response.ok) {
    addToast({
      title: "Created team",
    });
    return true;
  }

  const data = await response.json();
  addToast({
    title: data.message,
  });
  return false;
}
