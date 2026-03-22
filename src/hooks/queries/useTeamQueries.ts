"use client";

import { useQuery } from "@tanstack/react-query";
import { getTeams, getTeamsUser, getTeamRoles } from "@/requests/team";
import { queryKeys } from "./queryKeys";
import type { TeamType } from "@/types/TeamType";
import type { RoleType } from "@/types/RoleType";
import { unwrapArray } from "./helpers";

export function useTeams(enabled = true) {
  return useQuery<TeamType[]>({
    queryKey: queryKeys.team.list(),
    queryFn: async () => {
      const res = await getTeams();
      const json = await res.json();
      return unwrapArray<TeamType>(json);
    },
    enabled,
  });
}

export function useTeamsUser(enabled = true) {
  return useQuery<TeamType[]>({
    queryKey: queryKeys.team.user(),
    queryFn: async () => {
      const res = await getTeamsUser();
      const json = await res.json();
      return unwrapArray<TeamType>(json);
    },
    enabled,
  });
}

export function useTeamRoles() {
  return useQuery<RoleType[]>({
    queryKey: queryKeys.team.roles(),
    queryFn: async () => {
      const res = await getTeamRoles();
      const json = await res.json();
      return unwrapArray<RoleType>(json);
    },
    staleTime: 10 * 60 * 1000,
  });
}
