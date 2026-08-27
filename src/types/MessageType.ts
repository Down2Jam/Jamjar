export type ConversationUser = {
  id: number;
  slug: string;
  name: string;
  profilePicture?: string | null;
};

export type ConversationMember = {
  conversationId: number;
  userId: number;
  status: "PENDING" | "ACCEPTED" | "DECLINED";
  role: "OWNER" | "MEMBER";
  mutedAt?: string | null;
  archivedAt?: string | null;
  user: ConversationUser;
};

export type ConversationMessage = {
  id: number;
  conversationId: number;
  senderId: number;
  body: string;
  createdAt: string;
  deletedAt?: string | null;
  sender: ConversationUser;
};

export type Conversation = {
  id: number;
  type: "DIRECT" | "GROUP";
  name?: string | null;
  createdById: number;
  createdAt: string;
  updatedAt: string;
  lastMessageAt: string;
  members: ConversationMember[];
  latestMessage?: ConversationMessage | null;
  membership: {
    status: "PENDING" | "ACCEPTED" | "DECLINED";
    role: "OWNER" | "MEMBER";
    mutedAt?: string | null;
    archivedAt?: string | null;
  };
  requestDirection?: "incoming" | "outgoing" | null;
  unreadCount: number;
};

export type ConversationThread = {
  conversation: Conversation;
  messages: ConversationMessage[];
};

export type MessageCounts = {
  unreadMessages: number;
  requests: number;
  total: number;
};
