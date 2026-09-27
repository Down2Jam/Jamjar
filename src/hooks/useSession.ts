import { useSyncExternalStore } from "react";
import { getSessionSnapshot, subscribeSession } from "../requests/sessionState";

export function useSession() {
  return useSyncExternalStore(subscribeSession, getSessionSnapshot, getSessionSnapshot);
}
