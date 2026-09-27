import { QueryClient } from "@tanstack/react-query";
import { registerSessionReset } from "./sessionState";

function createClient() {
  return new QueryClient({ defaultOptions: { queries: {
    staleTime: 60 * 1000, refetchOnMount: false, refetchOnReconnect: false,
    refetchOnWindowFocus: false, retry: false,
  } } });
}
let client = createClient();
export const getSessionQueryClient = () => client;
registerSessionReset(() => {
  const previous = client;
  client = createClient();
  void previous.cancelQueries();
  previous.clear();
  // Late mutation callbacks retain the old client, never the new account's cache.
});
