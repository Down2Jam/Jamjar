"use client";

import {
  Avatar, Button, Card, Hstack, Icon, Input, Spinner, Text, Textarea, Vstack, addToast,
} from "bioloom-ui";
import type { CSSProperties } from "react";
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router";
import { useQueryClient } from "@tanstack/react-query";

import {
  useConversationThread, useConversations, useMessageCounts, useSearchUsers, useSelf,
} from "@/hooks/queries";
import { queryKeys } from "@/hooks/queries/queryKeys";
import { blockUser, createConversation, sendMessage, updateConversation } from "@/requests/message";
import type { Conversation, ConversationUser } from "@/types/MessageType";
import type { UserType } from "@/types/UserType";
import { useTheme } from "@/providers/useSiteTheme";
import NotificationsView from "./NotificationsView";

type InboxSection = "messages" | "requests" | "notifications";

function timeLabel(value: string) {
  const date = new Date(value);
  return date.toDateString() === new Date().toDateString()
    ? date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
    : date.toLocaleDateString([], { month: "short", day: "numeric" });
}

function title(conversation: Conversation, selfId: number) {
  return conversation.name || conversation.members
    .filter((member) => member.userId !== selfId)
    .map((member) => member.user.name)
    .join(", ") || "Conversation";
}

function NewConversation({ initialSlug, onCreated, onCancel }: {
  initialSlug?: string;
  onCreated: (id: number) => void;
  onCancel?: () => void;
}) {
  const [query, setQuery] = useState(initialSlug ?? "");
  const [selected, setSelected] = useState<ConversationUser[]>([]);
  const [name, setName] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const { data: self } = useSelf();
  const { data: results = [] } = useSearchUsers(query.trim(), query.trim().length > 1);

  useEffect(() => {
    if (!initialSlug || selected.length) return;
    const exact = results.find((user) => user.slug.toLowerCase() === initialSlug.toLowerCase());
    if (exact) setSelected([exact]);
  }, [initialSlug, results, selected.length]);

  const choose = (user: UserType) => {
    if (user.id !== self?.id && !selected.some((entry) => entry.id === user.id)) {
      setSelected((current) => [...current, user]);
      setQuery("");
    }
  };

  return (
    <Vstack align="stretch" className="gap-3 py-3">
      <Hstack justify="between">
        <Text size="lg" weight="semibold">New conversation</Text>
        {onCancel && <Button size="sm" variant="ghost" icon="x" onClick={onCancel}>Cancel</Button>}
      </Hstack>
      <Hstack wrap className="gap-1">
        {selected.map((user) => <Button key={user.id} size="sm" variant="ghost" icon="x"
          onClick={() => setSelected((current) => current.filter((entry) => entry.id !== user.id))}>{user.name}</Button>)}
      </Hstack>
      <div className="relative">
        <Input value={query} onValueChange={setQuery} placeholder="Search people" fullWidth />
        {query.trim().length > 1 && <div className="absolute z-20 mt-1 w-full rounded-lg border bg-neutral-950 p-1 shadow-xl">
          {results.filter((user) => user.id !== self?.id && !selected.some((item) => item.id === user.id)).slice(0, 8).map((user) =>
            <button key={user.id} type="button" className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left hover:bg-white/10" onClick={() => choose(user)}>
              <Avatar src={user.profilePicture} fallback={user.name} size={28} />
              <span>{user.name} <span className="opacity-60">@{user.slug}</span></span>
            </button>)}
        </div>}
      </div>
      {selected.length > 1 && <Input value={name} onValueChange={setName} placeholder="Group name (optional)" fullWidth />}
      <Textarea value={body} onValueChange={setBody} placeholder="Write the opening message" rows={4} maxLength={4000} fullWidth />
      <Text size="xs" color="textFaded">The opening message is delivered as a request.</Text>
      <Button color="blue" icon="send" loading={busy} disabled={!selected.length || !body.trim()} onClick={async () => {
        setBusy(true);
        try {
          const response = await createConversation({ recipientSlugs: selected.map((user) => user.slug), name: name.trim() || null, body: body.trim() });
          const json = await response.json().catch(() => null);
          if (!response.ok) throw new Error(json?.error?.message ?? "Could not send request");
          onCreated((json?.data ?? json).id);
        } catch (error) {
          addToast({ title: error instanceof Error ? error.message : "Could not send request" });
        } finally { setBusy(false); }
      }}>Send request</Button>
    </Vstack>
  );
}

function ConversationList({ data, isLoading, selectedId, selfId, onSelect }: {
  data: Conversation[];
  isLoading: boolean;
  selectedId?: number;
  selfId: number;
  onSelect: (id: number) => void;
}) {
  if (isLoading) return <div className="flex justify-center py-12"><Spinner /></div>;
  return <Vstack align="stretch" gap={0}>{data.map((conversation) => {
    const avatar = conversation.members.find((member) => member.userId !== selfId)?.user;
    return <button key={conversation.id} type="button" onClick={() => onSelect(conversation.id)}
      className={`w-full border-b border-[color:var(--inbox-divider)] px-3 py-3 text-left hover:opacity-80 ${selectedId === conversation.id ? "bg-white/5" : ""}`}>
      <Hstack align="start" className="gap-3">
        <Avatar src={avatar?.profilePicture ?? undefined} fallback={title(conversation, selfId)} size={38} />
        <Vstack align="stretch" gap={0} className="min-w-0 flex-1">
          <Hstack justify="between" className="gap-2"><Text weight={conversation.unreadCount ? "semibold" : "normal"} className="truncate">{title(conversation, selfId)}</Text><Text size="xs" color="textFaded">{timeLabel(conversation.lastMessageAt)}</Text></Hstack>
          <Hstack justify="between" className="gap-2"><Text size="sm" color="textFaded" className="truncate">{conversation.latestMessage?.body}</Text>{conversation.unreadCount > 0 && <span className="rounded-full bg-blue-500 px-1.5 text-xs text-white">{conversation.unreadCount}</span>}</Hstack>
          {conversation.requestDirection && <Text size="xs" color="textFaded">{conversation.requestDirection === "incoming" ? "Message request" : "Request sent"}</Text>}
        </Vstack>
      </Hstack>
    </button>;
  })}</Vstack>;
}

function EmptyInbox({ box, onCompose, onBack }: {
  box: "messages" | "requests" | "archived";
  onCompose: () => void;
  onBack: () => void;
}) {
  const content = box === "requests"
    ? { icon: "userplus" as const, title: "No message requests", detail: "New requests from people will appear here." }
    : box === "archived"
      ? { icon: "inbox" as const, title: "No archived conversations", detail: "Conversations you archive will appear here." }
      : { icon: "messagessquare" as const, title: "No conversations yet", detail: "Start a private or group conversation." };

  return <div className="flex min-h-[22rem] flex-col items-center justify-center gap-3 px-6 py-12 text-center">
    <Icon name={content.icon} size={36} color="textFaded" />
    <Vstack gap={1}>
      <Text size="lg" weight="semibold">{content.title}</Text>
      <Text size="sm" color="textFaded">{content.detail}</Text>
    </Vstack>
    {box === "messages" && <Button color="blue" icon="squarepen" onClick={onCompose}>New conversation</Button>}
    {box === "archived" && <Button icon="arrowleft" onClick={onBack}>Back to conversations</Button>}
  </div>;
}

function Thread({ id, selfId }: { id: number; selfId: number }) {
  const { data, isLoading, refetch } = useConversationThread(id);
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const queryClient = useQueryClient();

  const invalidate = async () => {
    await Promise.all([
      refetch(),
      queryClient.invalidateQueries({ queryKey: ["message", "conversations"] }),
      queryClient.invalidateQueries({ queryKey: queryKeys.message.counts() }),
    ]);
  };
  useEffect(() => {
    if (!data?.conversation.unreadCount) return;
    updateConversation(id, "read").then(invalidate);
  }, [id, data?.conversation.unreadCount]);
  if (isLoading || !data) return <div className="flex flex-1 justify-center py-20"><Spinner /></div>;

  const conversation = data.conversation;
  const selfMember = conversation.members.find((member) => member.userId === selfId);
  const others = conversation.members.filter((member) => member.userId !== selfId).map((member) => member.user);
  const incoming = conversation.requestDirection === "incoming";
  const outgoing = conversation.requestDirection === "outgoing";
  const action = async (value: Parameters<typeof updateConversation>[1]) => {
    if ((await updateConversation(id, value)).ok) await invalidate();
  };

  return <div className="flex min-h-[34rem] flex-1 flex-col">
    <Hstack justify="between" className="border-b border-[color:var(--inbox-divider)] px-4 py-3 gap-2">
      <Vstack align="start" gap={0}><Text weight="semibold">{title(conversation, selfId)}</Text><Text size="xs" color="textFaded">{conversation.type === "GROUP" ? `${conversation.members.length} members` : `@${others[0]?.slug}`}</Text></Vstack>
      <Hstack className="gap-1">
        <Button size="sm" variant="ghost" icon="bell" onClick={() => action(selfMember?.mutedAt ? "unmute" : "mute")} />
        <Button size="sm" variant="ghost" icon={selfMember?.archivedAt ? "rotateccw" : "trash2"} onClick={() => action(selfMember?.archivedAt ? "unarchive" : "archive")} />
        {conversation.type === "DIRECT" && others[0] && <Button size="sm" variant="ghost" icon="ban" onClick={async () => {
          if ((await blockUser(others[0].slug)).ok) addToast({ title: `Blocked ${others[0].name}` });
        }} />}
      </Hstack>
    </Hstack>
    {incoming && <Hstack justify="between" className="border-b border-[color:var(--inbox-divider)] px-4 py-3 flex-wrap gap-2"><Text size="sm">Accept this request to continue.</Text><Hstack><Button size="sm" color="blue" icon="check" onClick={() => action("accept")}>Accept</Button><Button size="sm" icon="x" onClick={() => action("decline")}>Decline</Button></Hstack></Hstack>}
    <div className="flex flex-1 flex-col gap-2 overflow-y-auto px-4 py-4">
      {data.messages.map((message) => <div key={message.id} className={`flex ${message.senderId === selfId ? "justify-end" : "justify-start"}`}>
        <div className={`max-w-[80%] rounded-xl px-3 py-2 ${message.senderId === selfId ? "bg-blue-900" : "bg-white/10"}`}>
          {conversation.type === "GROUP" && message.senderId !== selfId && <Text size="xs" color="textFaded">{message.sender.name}</Text>}
          <p className="whitespace-pre-wrap break-words text-sm">{message.body}</p>
          <Hstack justify="end" className="mt-1"><Text size="xs" color="textFaded">{timeLabel(message.createdAt)}</Text></Hstack>
        </div>
      </div>)}
    </div>
    <div className="border-t border-[color:var(--inbox-divider)] p-3">
      {outgoing ? <Text size="sm" color="textFaded">Request sent. You can send more messages after someone accepts.</Text> :
        <Hstack align="end" className="gap-2"><Textarea value={body} onValueChange={setBody} rows={2} maxLength={4000} fullWidth placeholder={incoming ? "Reply to accept" : "Write a message"} onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); document.getElementById(`send-${id}`)?.click(); }
        }} /><Button id={`send-${id}`} color="blue" icon="send" loading={busy} disabled={!body.trim()} onClick={async () => {
          setBusy(true);
          try {
            if (incoming) await updateConversation(id, "accept");
            if (!(await sendMessage(id, body.trim())).ok) throw new Error("Could not send message");
            setBody(""); await invalidate();
          } catch (error) { addToast({ title: error instanceof Error ? error.message : "Could not send message" }); }
          finally { setBusy(false); }
        }} /></Hstack>}
    </div>
  </div>;
}

export default function InboxPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { data: self, isError: selfError } = useSelf();
  const { colors } = useTheme();
  const { data: counts } = useMessageCounts(Boolean(self));
  const [composing, setComposing] = useState(Boolean(params.get("to")));
  const archived = params.get("archived") === "1";
  const section: InboxSection = location.pathname.includes("/requests") ? "requests" : location.pathname.includes("/notifications") ? "notifications" : "messages";
  const conversationBox = archived && section === "messages" ? "archived" : section === "requests" ? "requests" : "messages";
  const { data: conversations = [], isLoading: conversationsLoading } = useConversations(conversationBox);
  const selectedId = useMemo(() => {
    const parsed = Number(location.pathname.split("/").filter(Boolean).at(-1));
    return Number.isInteger(parsed) ? parsed : undefined;
  }, [location.pathname]);
  useEffect(() => {
    if (selfError) navigate("/login");
  }, [navigate, selfError]);
  if (!self) return <div className="flex justify-center py-20"><Spinner /></div>;

  const empty = !conversationsLoading && !conversations.length && !selectedId && !composing;
  const inboxSurfaceStyle = {
    "--inbox-divider": `color-mix(in srgb, ${colors["text"]} 5%, transparent)`,
  } as CSSProperties;

  return <Vstack align="stretch" className="mx-auto w-full max-w-6xl gap-3">
    <Hstack justify="between" className="flex-wrap gap-3 px-1 py-2"><Hstack><Icon name="inbox" /><Text size="xl" weight="semibold">Inbox</Text></Hstack><Hstack wrap className="gap-2">
      <Button size="sm" icon="bell" color={section === "notifications" ? "blue" : "default"} onClick={() => navigate("/inbox/notifications")}>Notifications {self.receivedNotifications.length ? `(${self.receivedNotifications.length})` : ""}</Button>
      <Button size="sm" icon="messagecircle" color={section === "messages" ? "blue" : "default"} onClick={() => navigate("/inbox/messages")}>Messages {counts?.unreadMessages ? `(${counts.unreadMessages})` : ""}</Button>
      <Button size="sm" icon="userplus" color={section === "requests" ? "blue" : "default"} onClick={() => navigate("/inbox/requests")}>Requests {counts?.requests ? `(${counts.requests})` : ""}</Button>
    </Hstack></Hstack>
    {section === "notifications" ? <NotificationsView /> : composing && !selectedId && section === "messages" && !archived ? <div className="mx-auto w-full max-w-xl py-4">
      <Card shadow="none">
        <NewConversation initialSlug={params.get("to") ?? undefined} onCancel={() => setComposing(false)} onCreated={(id) => { setComposing(false); navigate(`/inbox/requests/${id}`); }} />
      </Card>
    </div> : empty ? <Card padding={0} shadow="none"><EmptyInbox box={conversationBox} onCompose={() => setComposing(true)} onBack={() => navigate("/inbox/messages")} /></Card> : <Card padding={0} shadow="none" className="overflow-hidden" style={inboxSurfaceStyle}><div className="flex min-h-[32rem] flex-col lg:flex-row">
      <aside className={`w-full border-b border-[color:var(--inbox-divider)] lg:w-80 lg:border-b-0 lg:border-r ${selectedId ? "hidden lg:block" : "block"}`}>
        <Hstack justify="between" className="border-b border-[color:var(--inbox-divider)] px-3 py-3"><Text weight="semibold">{section === "requests" ? "Message requests" : archived ? "Archived" : "Conversations"}</Text>{section === "messages" && <Hstack className="gap-1">{archived ? <Button size="sm" variant="ghost" icon="arrowleft" onClick={() => navigate("/inbox/messages")}>Back</Button> : <><Button size="sm" variant="ghost" icon="inbox" onClick={() => navigate("/inbox/messages?archived=1")}>Archived</Button><Button size="sm" variant="ghost" icon="squarepen" onClick={() => { navigate("/inbox/messages"); setComposing(true); }}>New</Button></>}</Hstack>}</Hstack>
        {composing && section === "messages" && !archived ? <div className="px-3"><NewConversation initialSlug={params.get("to") ?? undefined} onCreated={(id) => { setComposing(false); navigate(`/inbox/requests/${id}`); }} /></div> : <ConversationList data={conversations} isLoading={conversationsLoading} selectedId={selectedId} selfId={self.id} onSelect={(id) => navigate(`/inbox/${section}/${id}${archived ? "?archived=1" : ""}`)} />}
      </aside>
      <main className={`${selectedId ? "flex" : "hidden lg:flex"} min-w-0 flex-1 flex-col`}>{selectedId ? <><button type="button" className="border-b border-[color:var(--inbox-divider)] px-4 py-2 text-left text-sm lg:hidden" onClick={() => navigate(`/inbox/${section}`)}>← Back</button><Thread id={selectedId} selfId={self.id} /></> : <div className="flex flex-1 items-center justify-center"><Text color="textFaded">Select a conversation.</Text></div>}</main>
    </div></Card>}
  </Vstack>;
}
