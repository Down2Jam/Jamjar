"use client";

import { useQuery } from "@tanstack/react-query";
import { getSelf, getUser, searchUsers } from "@/requests/user";
import { queryKeys } from "./queryKeys";
import type { UserType } from "@/types/UserType";
import { unwrapArray, unwrapItem } from "./helpers";
import { useSession } from "../useSession";

export function useSelf(enabled = true) {
  const { signedIn } = useSession();
  const query = useQuery<UserType>({
    queryKey: queryKeys.user.self(),
    queryFn: async () => {
      const res = await getSelf();
      if (!res.ok) throw new Error("Not authenticated");
      const json = await res.json();
      const user = unwrapItem<UserType>(json);
      if (!user) throw new Error("No user data");
      return user;
    },
    retry: false,
    enabled: enabled && signedIn,
    staleTime: 2 * 60 * 1000,
  });
  return signedIn ? query : { ...query, data: undefined };
}

export function useUser(slug: string, enabled = true) {
  return useQuery<UserType>({
    queryKey: queryKeys.user.detail(slug),
    queryFn: async () => {
      const res = await getUser(slug);
      const json = await res.json();
      return unwrapItem<UserType>(json)!;
    },
    enabled: enabled && !!slug,
  });
}

export function useSearchUsers(query: string, enabled = true) {
  return useQuery<UserType[]>({
    queryKey: queryKeys.user.search(query),
    queryFn: async () => {
      const res = await searchUsers(query);
      const json = await res.json();
      return unwrapArray<UserType>(json);
    },
    enabled: enabled && query.length > 0,
  });
}
