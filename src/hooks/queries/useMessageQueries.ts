import { useQuery } from "@tanstack/react-query";

import {
  getConversationMessages,
  getMessageCounts,
  listConversations,
} from "@/requests/message";
import type {
  Conversation,
  ConversationThread,
  MessageCounts,
} from "@/types/MessageType";
import { unwrapArray, unwrapItem } from "./helpers";
import { queryKeys } from "./queryKeys";

export function useConversations(box: "messages" | "requests" | "archived") {
  return useQuery<Conversation[]>({
    queryKey: queryKeys.message.conversations(box),
    queryFn: async () => {
      const response = await listConversations(box);
      if (!response.ok) throw new Error("Could not load conversations");
      return unwrapArray<Conversation>(await response.json());
    },
    refetchInterval: 20_000,
  });
}

export function useConversationThread(id?: number) {
  return useQuery<ConversationThread>({
    queryKey: queryKeys.message.thread(id ?? 0),
    queryFn: async () => {
      const response = await getConversationMessages(id!);
      if (!response.ok) throw new Error("Could not load messages");
      return unwrapItem<ConversationThread>(await response.json())!;
    },
    enabled: Boolean(id),
    refetchInterval: 5_000,
  });
}

export function useMessageCounts(enabled = true) {
  return useQuery<MessageCounts>({
    queryKey: queryKeys.message.counts(),
    queryFn: async () => {
      const response = await getMessageCounts();
      if (!response.ok) throw new Error("Could not load message counts");
      return unwrapItem<MessageCounts>(await response.json())!;
    },
    enabled,
    refetchInterval: 20_000,
    retry: false,
  });
}
