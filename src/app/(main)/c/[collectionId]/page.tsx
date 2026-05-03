"use client";

import {
  addCollectionComment,
  addCollectionItem,
  getCollection,
  getCollectionMusicMetadata,
  listCollectionComments,
  updateCollection,
  updateCollectionItem,
  type CollectionType,
  type CollectionItemType,
  type CollectionPlatformLink,
  type CollectionVisibility,
} from "@/requests/collection";
import { hasCookie } from "@/helpers/cookie";
import { useSelf } from "@/hooks/queries";
import { readItem } from "@/requests/helpers";
import { search } from "@/requests/search";
import Link from "@/compat/next-link";
import ContentStatusMeta from "@/components/posts/ContentStatusMeta";
import MentionedContent from "@/components/mentions/MentionedContent";
import ThemedProse from "@/components/themed-prose";
import Editor from "@/components/editor";
import { stripHtmlForMetadata, usePageMetadata } from "@/hooks/usePageMetadata";
import { CollectionArtwork } from "@/components/collections/CollectionArtwork";
import {
  Avatar,
  Button,
  Card,
  Hstack,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Spinner,
  Text,
  Textarea,
  Vstack,
  addToast,
  useDisclosure,
} from "bioloom-ui";
import { use, useEffect, useMemo, useState } from "react";

type LinkedGame = {
  id: number;
  name: string;
  slug: string;
  thumbnail?: string | null;
  short?: string | null;
};

type LinkedTrack = {
  id: number;
  name: string;
  slug: string;
  url?: string | null;
  thumbnail?: string | null;
  game?: LinkedGame | null;
  composer?: { name?: string; slug?: string } | null;
};

type LinkedPost = {
  id: number;
  title?: string | null;
  slug?: string | null;
  author?: { name?: string; slug?: string } | null;
};

type CollectionItem = {
  id: number;
  itemType: CollectionItemType;
  itemId: number;
  title?: string | null;
  url?: string | null;
  thumbnailUrl?: string | null;
  platformLinks?: CollectionPlatformLink[] | null;
  note?: string | null;
  game?: LinkedGame | null;
  track?: LinkedTrack | null;
  post?: LinkedPost | null;
};

type CollectionDetails = {
  id: number;
  slug: string;
  title: string;
  description?: string | null;
  visibility?: string;
  collectionType?: CollectionType;
  playbackMode?: "manual" | "shuffle" | "repeat";
  followerCount?: number;
  itemCount?: number;
  itemTypes?: Record<string, number>;
  owner?: { id?: number; name?: string; slug?: string };
  items?: CollectionItem[];
};

type CollectionComment = {
  id: number;
  content: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  authorName?: string;
  authorSlug?: string;
  authorProfilePicture?: string | null;
  author?: { name?: string; slug?: string; profilePicture?: string | null };
};

type TrackSearchResult = {
  id: number;
  name: string;
  slug: string;
  url?: string | null;
  game?: LinkedGame | null;
  composer?: { name?: string; slug?: string } | null;
};

type GameSearchResult = LinkedGame;

type PostSearchResult = LinkedPost;

type ExternalMetadata = {
  title: string;
  thumbnailUrl?: string | null;
  authorName?: string | null;
  url: string;
};

function isYoutubeMusicUrl(value: string) {
  return value.includes("music.youtube.com");
}

function inferPlatform(url: string): CollectionPlatformLink["platform"] {
  if (isYoutubeMusicUrl(url)) return "youtubeMusic";
  if (url.includes("youtube.com") || url.includes("youtu.be")) return "youtube";
  return "d2jam";
}

function compactPlatformLinks(links: CollectionPlatformLink[]) {
  const seen = new Set<string>();
  return links.filter((link) => {
    if (!link.url.trim()) return false;
    const key = `${link.platform}:${link.url.trim()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function itemThumbnail(item: CollectionItem) {
  return (
    item.thumbnailUrl ||
    item.track?.thumbnail ||
    item.track?.game?.thumbnail ||
    item.game?.thumbnail ||
    "/images/D2J_Icon.png"
  );
}

function itemTitle(item: CollectionItem) {
  return item.title || item.track?.name || item.game?.name || item.post?.title || "Untitled item";
}

function collectionMetadataImage(collection?: CollectionDetails | null) {
  const itemWithImage = collection?.items?.find((item) =>
    Boolean(
      item.thumbnailUrl ||
        item.track?.thumbnail ||
        item.track?.game?.thumbnail ||
        item.game?.thumbnail,
    ),
  );
  return itemWithImage ? itemThumbnail(itemWithImage) : "/images/D2J_Icon.png";
}

function musicLinks(item: CollectionItem) {
  const links: CollectionPlatformLink[] = [];
  if (item.track?.slug) links.push({ platform: "d2jam", url: `/m/${item.track.slug}` });
  if (item.url) links.push({ platform: inferPlatform(item.url), url: item.url });
  if (item.platformLinks) links.push(...item.platformLinks);
  return compactPlatformLinks(links);
}

function platformLabel(platform: CollectionPlatformLink["platform"]) {
  if (platform === "youtubeMusic") return "YouTube Music";
  if (platform === "youtube") return "YouTube";
  return "D2Jam";
}

function primaryMusicLink(item: CollectionItem) {
  return musicLinks(item)[0]?.url ?? item.url ?? (item.track?.slug ? `/m/${item.track.slug}` : "#");
}

function musicAuthor(item: CollectionItem) {
  return item.track?.composer?.name ?? item.track?.game?.name ?? null;
}

function itemDescription(item: CollectionItem) {
  return item.note?.trim() || null;
}

function MusicDiscItem({
  item,
  canEdit = false,
  onEdit,
}: {
  item: CollectionItem;
  canEdit?: boolean;
  onEdit?: (item: CollectionItem) => void;
}) {
  const link = primaryMusicLink(item);
  const platform = musicLinks(item)[0]?.platform ?? inferPlatform(link);
  const isExternal = !link.startsWith("/");
  const author = musicAuthor(item);
  const meta = item.itemType === "track"
    ? author
    : [author, platformLabel(platform)].filter(Boolean).join(" - ");
  const description = itemDescription(item);

  return (
    <div className="group/item min-w-0">
      <a
        href={link}
        target={isExternal ? "_blank" : undefined}
        rel={isExternal ? "noreferrer" : undefined}
        className="group block"
        aria-label={`Open ${itemTitle(item)}`}
      >
        <div className="relative aspect-square w-full max-w-56 overflow-hidden rounded-full bg-white/5 shadow-lg shadow-black/25 transition-transform group-hover:-translate-y-0.5">
          <img
            src={itemThumbnail(item)}
            alt=""
            className="h-full w-full object-cover"
            style={{
              WebkitMaskImage:
                "radial-gradient(circle at center, transparent 0 10%, black 11% 100%)",
              maskImage:
                "radial-gradient(circle at center, transparent 0 10%, black 11% 100%)",
            }}
            loading="lazy"
            decoding="async"
          />
        </div>
      </a>
      <Vstack align="start" gap={0} className="mt-2 min-w-0 max-w-56">
        <Hstack className="w-full gap-1">
          <Text weight="semibold" color="text" className="min-w-0 flex-1 truncate">
            {itemTitle(item)}
          </Text>
          {canEdit && (
            <Button
              size="sm"
              variant="ghost"
              icon="pencil"
              className="shrink-0 opacity-70 transition-opacity hover:opacity-100"
              aria-label={`Edit description for ${itemTitle(item)}`}
              onClick={() => onEdit?.(item)}
            />
          )}
        </Hstack>
        {meta && (
          <Text size="sm" color="textFaded" className="w-full truncate">
            {meta}
          </Text>
        )}
        {description && (
          <Text size="sm" color="textFaded" className="mt-1 line-clamp-2 w-full">
            {description}
          </Text>
        )}
      </Vstack>
    </div>
  );
}

function CollectionCommentCard({ comment }: { comment: CollectionComment }) {
  const authorName = comment.author?.name ?? comment.authorName ?? "Unknown";
  const authorSlug = comment.author?.slug ?? comment.authorSlug;
  const authorProfilePicture =
    comment.author?.profilePicture ?? comment.authorProfilePicture ?? undefined;

  const author = (
    <span className="flex items-center gap-2">
      <Avatar size={24} src={authorProfilePicture} />
      <span>{authorName}</span>
    </span>
  );

  return (
    <Card>
      <div
        id={`collection-comment-${comment.id}`}
        className="flex items-center gap-3 pt-1 text-xs"
      >
        <Text size="xs" color="textFaded">
          PostCard.By
        </Text>
        {authorSlug ? (
          <Link href={`/u/${authorSlug}`} className="flex items-center gap-2">
            {author}
          </Link>
        ) : (
          author
        )}
        {comment.createdAt && (
          <ContentStatusMeta
            createdAt={comment.createdAt}
            editedAt={
              comment.updatedAt && comment.updatedAt !== comment.createdAt
                ? comment.updatedAt
                : null
            }
          />
        )}
      </div>
      <ThemedProse className="p-4">
        <MentionedContent
          html={comment.content}
          className="!duration-250 !ease-linear !transition-all max-w-full break-words"
        />
      </ThemedProse>
    </Card>
  );
}

function CollectionItemRow({
  item,
  canEdit = false,
  onEdit,
}: {
  item: CollectionItem;
  canEdit?: boolean;
  onEdit?: (item: CollectionItem) => void;
}) {
  if (item.itemType === "track" || item.itemType === "youtube_track") {
    return <MusicDiscItem item={item} canEdit={canEdit} onEdit={onEdit} />;
  }

  if (item.itemType === "game" && item.game) {
    return (
      <div className="flex items-center justify-between gap-3 border-b border-white/10 py-3 last:border-b-0">
        <Hstack className="min-w-0">
          <img
            src={itemThumbnail(item)}
            alt=""
            className="h-12 w-20 rounded-md object-cover"
            loading="lazy"
            decoding="async"
          />
          <Vstack align="start" gap={0} className="min-w-0">
            <Text weight="semibold">{item.game.name}</Text>
            {item.game.short && (
              <Text size="sm" color="textFaded" className="line-clamp-1">
                {item.game.short}
              </Text>
            )}
            {itemDescription(item) && (
              <Text size="sm" color="textFaded" className="line-clamp-2">
                {itemDescription(item)}
              </Text>
            )}
          </Vstack>
        </Hstack>
        <Hstack>
          {canEdit && (
            <Button
              size="sm"
              variant="ghost"
              icon="pencil"
              aria-label={`Edit description for ${item.game.name}`}
              onClick={() => onEdit?.(item)}
            />
          )}
          <Button size="sm" href={`/g/${item.game.slug}`}>
            Open
          </Button>
        </Hstack>
      </div>
    );
  }

  if (item.itemType === "post" && item.post) {
    return (
      <div className="flex items-center justify-between gap-3 border-b border-white/10 py-3 last:border-b-0">
        <Vstack align="start" gap={0}>
          <Text weight="semibold">{item.post.title ?? "Post"}</Text>
          <Text size="sm" color="textFaded">
            {item.post.author?.name ?? "Unknown"}
          </Text>
          {itemDescription(item) && (
            <Text size="sm" color="textFaded" className="line-clamp-2">
              {itemDescription(item)}
            </Text>
          )}
        </Vstack>
        <Hstack>
          {canEdit && (
            <Button
              size="sm"
              variant="ghost"
              icon="pencil"
              aria-label={`Edit description for ${item.post.title ?? "post"}`}
              onClick={() => onEdit?.(item)}
            />
          )}
          {item.post.slug && (
            <Button size="sm" href={`/p/${item.post.slug}`}>
              Open
            </Button>
          )}
        </Hstack>
      </div>
    );
  }

  return (
    <div className="border-b border-white/10 py-3 last:border-b-0">
      <Text color="textFaded">
        {item.itemType} #{item.itemId}
      </Text>
    </div>
  );
}

export default function CollectionPage({
  params,
}: {
  params: Promise<{ collectionId: string }>;
}) {
  const { collectionId } = use(params);
  const [collection, setCollection] = useState<CollectionDetails | null>(null);
  const [comments, setComments] = useState<CollectionComment[]>([]);
  const [comment, setComment] = useState("");
  const [commentLoading, setCommentLoading] = useState(false);
  const [showCommentComposer, setShowCommentComposer] = useState(false);
  const [trackQuery, setTrackQuery] = useState("");
  const [trackResults, setTrackResults] = useState<TrackSearchResult[]>([]);
  const [selectedTrack, setSelectedTrack] = useState<TrackSearchResult | null>(null);
  const [contentQuery, setContentQuery] = useState("");
  const [gameResults, setGameResults] = useState<GameSearchResult[]>([]);
  const [postResults, setPostResults] = useState<PostSearchResult[]>([]);
  const [selectedGame, setSelectedGame] = useState<GameSearchResult | null>(null);
  const [selectedPost, setSelectedPost] = useState<PostSearchResult | null>(null);
  const [itemNote, setItemNote] = useState("");
  const [musicSource, setMusicSource] = useState<"d2jam" | "youtube">("d2jam");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [metadata, setMetadata] = useState<ExternalMetadata | null>(null);
  const [metadataLoading, setMetadataLoading] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editVisibility, setEditVisibility] = useState<Lowercase<CollectionVisibility>>("private");
  const [editPlaybackMode, setEditPlaybackMode] = useState<"manual" | "shuffle" | "repeat">("manual");
  const [editLoading, setEditLoading] = useState(false);
  const [editingItem, setEditingItem] = useState<CollectionItem | null>(null);
  const [editingItemNote, setEditingItemNote] = useState("");
  const [itemEditLoading, setItemEditLoading] = useState(false);
  const { data: user } = useSelf(hasCookie("token"));
  const { isOpen: isAddOpen, onOpen: openAdd, onOpenChange: onAddOpenChange } = useDisclosure();
  const {
    isOpen: isEditOpen,
    onOpen: openEdit,
    onOpenChange: onEditOpenChange,
  } = useDisclosure();
  const {
    isOpen: isItemEditOpen,
    onOpen: openItemEdit,
    onOpenChange: onItemEditOpenChange,
  } = useDisclosure();
  const isLoggedIn = Boolean(user);

  const openItemDescriptionEditor = (item: CollectionItem) => {
    setEditingItem(item);
    setEditingItemNote(item.note ?? "");
    openItemEdit();
  };

  const load = async () => {
    const [collectionResponse, commentsResponse] = await Promise.all([
      getCollection(collectionId),
      listCollectionComments(collectionId),
    ]);
    if (collectionResponse.ok) {
      setCollection(await readItem<CollectionDetails>(collectionResponse));
    }
    if (commentsResponse.ok) {
      const json = await commentsResponse.json();
      const data = json?.data ?? json;
      setComments(
        Array.isArray(data)
          ? data
          : Array.isArray(data?.items)
            ? data.items
            : [],
      );
    }
  };

  useEffect(() => {
    load();
  }, [collectionId]);

  useEffect(() => {
    if (!collection) return;
    setEditTitle(collection.title);
    setEditDescription(collection.description ?? "");
    setEditVisibility((collection.visibility?.toLowerCase() as Lowercase<CollectionVisibility>) ?? "private");
    setEditPlaybackMode(collection.playbackMode ?? "manual");
  }, [collection]);

  useEffect(() => {
    const trimmed = trackQuery.trim();
    if (trimmed.length < 2) {
      setTrackResults([]);
      return;
    }
    const controller = new AbortController();
    async function loadTracks() {
      const response = await search(trimmed, { type: "tracks", limit: 8 });
      if (!response.ok || controller.signal.aborted) return;
      const json = await response.json();
      if (controller.signal.aborted) return;
      setTrackResults(json.data?.tracks ?? []);
    }
    loadTracks();
    return () => controller.abort();
  }, [trackQuery]);

  useEffect(() => {
    if (collection?.collectionType !== "game" && collection?.collectionType !== "post") {
      setGameResults([]);
      setPostResults([]);
      return;
    }
    const trimmed = contentQuery.trim();
    if (trimmed.length < 2) {
      setGameResults([]);
      setPostResults([]);
      return;
    }
    const controller = new AbortController();
    async function loadContent() {
      const type = collection?.collectionType === "game" ? "games" : "posts";
      const response = await search(trimmed, { type, limit: 8 });
      if (!response.ok || controller.signal.aborted) return;
      const json = await response.json();
      if (controller.signal.aborted) return;
      if (collection?.collectionType === "game") {
        setGameResults(json.data?.games ?? []);
      } else {
        setPostResults(json.data?.posts ?? []);
      }
    }
    loadContent();
    return () => controller.abort();
  }, [collection?.collectionType, contentQuery]);

  useEffect(() => {
    const url = youtubeUrl.trim();
    if (!url) {
      setMetadata(null);
      return;
    }
    let active = true;
    const timeout = window.setTimeout(async () => {
      setMetadataLoading(true);
      try {
        const response = await getCollectionMusicMetadata(url);
        if (!active) return;
        if (response.ok) {
          setMetadata(await readItem<ExternalMetadata>(response));
        } else {
          setMetadata(null);
        }
      } finally {
        if (active) setMetadataLoading(false);
      }
    }, 350);
    return () => {
      active = false;
      window.clearTimeout(timeout);
    };
  }, [youtubeUrl]);

  const itemCounts = useMemo(() => {
    if (collection?.itemTypes) return collection.itemTypes;
    return (collection?.items ?? []).reduce<Record<string, number>>((counts, item) => {
      counts[item.itemType] = (counts[item.itemType] ?? 0) + 1;
      return counts;
    }, {});
  }, [collection?.itemTypes, collection?.items]);
  const musicCount = (itemCounts.track ?? 0) + (itemCounts.youtube_track ?? 0);

  const metadataCollectionType = collection?.collectionType ?? "music";
  const metadataRelevantCount =
    metadataCollectionType === "game"
      ? itemCounts.game ?? 0
      : metadataCollectionType === "music"
        ? musicCount
        : metadataCollectionType === "post"
          ? itemCounts.post ?? 0
          : musicCount;
  const metadataTypeLabel =
    metadataCollectionType === "game"
      ? `game${metadataRelevantCount === 1 ? "" : "s"}`
      : metadataCollectionType === "post"
        ? `post${metadataRelevantCount === 1 ? "" : "s"}`
        : `song${metadataRelevantCount === 1 ? "" : "s"}`;
  const metadataDescription =
    stripHtmlForMetadata(collection?.description) ||
    (collection
      ? `${collection.title} by ${collection.owner?.name ?? "Unknown"} collects ${metadataRelevantCount} ${metadataTypeLabel} on Down2Jam.`
      : "A curated Down2Jam collection.");

  usePageMetadata({
    title: collection?.title ?? "Collection",
    description: metadataDescription,
    image: collectionMetadataImage(collection),
    canonical: collection ? `/c/${collection.slug}` : `/c/${collectionId}`,
    type: "website",
    robots:
      collection?.visibility === "private" || collection?.visibility === "unlisted"
        ? "noindex,nofollow"
        : undefined,
  });

  if (!collection) {
    return <div className="h-28 animate-pulse rounded-md bg-white/5" />;
  }

  const collectionType = collection.collectionType ?? "music";
  const relevantCount =
    collectionType === "game"
      ? itemCounts.game ?? 0
      : collectionType === "music"
        ? musicCount
        : collectionType === "post"
          ? itemCounts.post ?? 0
          : musicCount;
  const relevantCountLabel =
    collectionType === "game"
      ? `${relevantCount} game${relevantCount === 1 ? "" : "s"}`
      : collectionType === "music"
        ? `${relevantCount} song${relevantCount === 1 ? "" : "s"}`
        : collectionType === "post"
          ? `${relevantCount} post${relevantCount === 1 ? "" : "s"}`
        : `${relevantCount} song${relevantCount === 1 ? "" : "s"}`;
  const addLabel =
    collectionType === "game"
      ? "Add Game"
      : collectionType === "post"
        ? "Add Post"
        : "Add Music";
  const isOwner =
    Boolean(collection.owner?.id && user?.id === collection.owner.id) ||
    Boolean(collection.owner?.slug && user?.slug === collection.owner.slug);
  const musicItems = (collection.items ?? []).filter(
    (item) => item.itemType === "track" || item.itemType === "youtube_track",
  );

  return (
    <>
      <Vstack align="stretch" gap={5}>
        <Hstack className="w-full flex-wrap items-start gap-5">
          <Hstack className="min-w-0 flex-wrap items-start gap-5">
            <div className="w-28 shrink-0 sm:w-32 md:w-36">
              <CollectionArtwork collection={{ ...collection, previewItems: collection.items }} />
            </div>
            <Vstack align="start" gap={1} className="min-w-0 flex-1 pt-1">
              <Text size="2xl" weight="semibold" color="text" className="max-w-full break-words">
                {collection.title}
              </Text>
              <Text size="sm" color="textFaded">
                {collection.owner?.name ?? "Unknown"} - {collection.visibility}
              </Text>
              <Text size="sm" color="textFaded">
                {relevantCountLabel}
              </Text>
              {collection.description && (
                <Text color="textFaded" className="max-w-2xl">
                  {collection.description}
                </Text>
              )}
              <Hstack className="mt-3 flex-wrap gap-2">
                {isOwner && (
                  <Button icon="pencil" variant="ghost" onClick={openEdit}>
                    Edit Collection
                  </Button>
                )}
                {isOwner && (
                  <Button icon="plus" color="blue" onClick={openAdd}>
                    {addLabel}
                  </Button>
                )}
              </Hstack>
            </Vstack>
          </Hstack>
        </Hstack>

        <section>
          <Hstack justify="between" className="mb-2 w-full">
            <Text size="lg" weight="semibold" color="text">
              Items
            </Text>
          </Hstack>
          {(collection.items ?? []).length === 0 ? (
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-6">
              <Text color="textFaded">No items yet.</Text>
            </div>
          ) : collectionType === "music" ? (
            <div className="grid gap-x-7 gap-y-9 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
              {musicItems.map((item) => (
                <MusicDiscItem
                  key={item.id}
                  item={item}
                  canEdit={isOwner}
                  onEdit={openItemDescriptionEditor}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-white/10 bg-white/[0.03] px-4">
              {collection.items?.map((item) => (
                <CollectionItemRow
                  key={item.id}
                  item={item}
                  canEdit={isOwner}
                  onEdit={openItemDescriptionEditor}
                />
              ))}
            </div>
          )}
        </section>

        <section>
          <Hstack justify="between" className="w-full">
            <Text size="lg" weight="semibold" color="text">
              Comments
            </Text>
            {isLoggedIn && (
              <Button
                size="sm"
                icon={showCommentComposer ? "x" : "plus"}
                variant={showCommentComposer ? "ghost" : undefined}
                onClick={() => setShowCommentComposer((current) => !current)}
              >
                {showCommentComposer ? "Cancel" : "Add Comment"}
              </Button>
            )}
          </Hstack>
          {!isLoggedIn && (
            <Text size="sm" color="textFaded" className="mt-2">
              Log in to add a comment.
            </Text>
          )}
          {showCommentComposer && (
            <div className="mt-2">
              <Editor
                content={comment}
                setContent={setComment}
                size="sm"
                format="markdown"
              />
              <div className="p-4" />
              {commentLoading ? (
                <Spinner />
              ) : (
                <Button
                  size="sm"
                  icon="plus"
                  onClick={async () => {
                    if (!comment.trim()) {
                      addToast({ title: "Please enter valid content" });
                      return;
                    }
                    if (!hasCookie("token")) {
                      addToast({ title: "You are not logged in" });
                      return;
                    }
                    setCommentLoading(true);
                    try {
                      const response = await addCollectionComment(collection.id, comment);
                      if (response.ok) {
                        setComment("");
                        setShowCommentComposer(false);
                        await load();
                        addToast({ title: "Successfully created comment" });
                      } else if (response.status === 401) {
                        addToast({ title: "Invalid User" });
                      } else {
                        addToast({ title: "An error occurred" });
                      }
                    } finally {
                      setCommentLoading(false);
                    }
                  }}
                >
                  Create Comment
                </Button>
              )}
            </div>
          )}
          {comments.length > 0 && (
            <div className="mt-3 flex flex-col gap-3">
              {comments.map((entry) => (
                <CollectionCommentCard key={entry.id} comment={entry} />
              ))}
            </div>
          )}
        </section>
      </Vstack>

      <Modal isOpen={isAddOpen} onOpenChange={onAddOpenChange} backdrop="opaque">
        <ModalContent>
          {(onClose) => (
            <form
              onSubmit={async (event) => {
                event.preventDefault();
                const links = compactPlatformLinks([
                  collectionType === "music" && musicSource === "youtube" && youtubeUrl.trim()
                    ? { platform: inferPlatform(youtubeUrl.trim()), url: youtubeUrl.trim() }
                    : null,
                ].filter(Boolean) as CollectionPlatformLink[]);

                if (collectionType === "game" && !selectedGame) {
                  addToast({ title: "Choose a game" });
                  return;
                }
                if (collectionType === "post" && !selectedPost) {
                  addToast({ title: "Choose a post" });
                  return;
                }
                if (collectionType === "music" && musicSource === "d2jam" && !selectedTrack) {
                  addToast({ title: "Choose a D2Jam track" });
                  return;
                }
                if (collectionType === "music" && musicSource === "youtube" && links.length === 0) {
                  addToast({ title: "Choose a D2Jam track or add a YouTube link" });
                  return;
                }

                setAddLoading(true);
                try {
                  const response = await addCollectionItem(collection.id, {
                    itemType:
                      collectionType === "game"
                        ? "game"
                        : collectionType === "post"
                          ? "post"
                          : musicSource === "d2jam"
                            ? "track"
                            : "youtube_track",
                    itemId: selectedGame?.id ?? selectedPost?.id ?? selectedTrack?.id,
                    title: selectedGame?.name ?? selectedPost?.title ?? selectedTrack?.name ?? metadata?.title,
                    url: collectionType === "music" ? links[0]?.url : undefined,
                    thumbnailUrl:
                      selectedGame?.thumbnail ??
                      selectedTrack?.game?.thumbnail ??
                      metadata?.thumbnailUrl ??
                      undefined,
                    platformLinks: collectionType === "music" ? links : undefined,
                    note: itemNote.trim() || undefined,
                  });
                  if (response.ok) {
                    setSelectedTrack(null);
                    setSelectedGame(null);
                    setSelectedPost(null);
                    setItemNote("");
                    setYoutubeUrl("");
                    setMetadata(null);
                    setTrackQuery("");
                    setTrackResults([]);
                    setContentQuery("");
                    setGameResults([]);
                    setPostResults([]);
                    await load();
                    addToast({ title: "Added to collection" });
                    onClose();
                  } else {
                    addToast({ title: "Could not add item" });
                  }
                } finally {
                  setAddLoading(false);
                }
              }}
            >
              <ModalHeader>{addLabel}</ModalHeader>
              <ModalBody>
                <Vstack align="stretch" gap={3}>
                  {collectionType === "music" ? (
                    <>
                      <div className="grid grid-cols-2 rounded-md bg-white/5 p-1">
                        <button
                          type="button"
                          className={`rounded px-3 py-2 text-sm font-semibold transition ${
                            musicSource === "d2jam"
                              ? "bg-white/15 text-white"
                              : "text-white/60 hover:text-white"
                          }`}
                          onClick={() => setMusicSource("d2jam")}
                        >
                          D2Jam music
                        </button>
                        <button
                          type="button"
                          className={`rounded px-3 py-2 text-sm font-semibold transition ${
                            musicSource === "youtube"
                              ? "bg-white/15 text-white"
                              : "text-white/60 hover:text-white"
                          }`}
                          onClick={() => setMusicSource("youtube")}
                        >
                          YouTube URL
                        </button>
                      </div>
                      {musicSource === "d2jam" ? (
                        <>
                          <Input
                            value={trackQuery}
                            onValueChange={setTrackQuery}
                            placeholder="Search D2Jam music"
                          />
                          {trackResults.length > 0 && (
                            <div className="rounded-md border border-white/10 bg-white/[0.03]">
                              {trackResults.map((track) => (
                                <button
                                  key={track.id}
                                  type="button"
                                  className="flex w-full cursor-pointer items-center justify-between border-b border-white/10 px-3 py-2 text-left last:border-b-0 hover:bg-white/5"
                                  onClick={() => {
                                    setSelectedTrack(track);
                                    setTrackResults([]);
                                  }}
                                >
                                  <span>
                                    <span className="block text-sm font-semibold text-white">
                                      {track.name}
                                    </span>
                                    <span className="block text-xs text-white/60">
                                      {track.game?.name ?? "Unknown game"}
                                    </span>
                                  </span>
                                  <span className="text-xs text-white/50">Select</span>
                                </button>
                              ))}
                            </div>
                          )}
                          {selectedTrack && (
                            <Hstack justify="between" className="rounded-md bg-white/5 px-3 py-2">
                              <Text size="sm">Selected: {selectedTrack.name}</Text>
                              <Button size="sm" variant="ghost" onClick={() => setSelectedTrack(null)}>
                                Clear
                              </Button>
                            </Hstack>
                          )}
                        </>
                      ) : (
                        <>
                          <Input
                            value={youtubeUrl}
                            onValueChange={setYoutubeUrl}
                            placeholder="YouTube URL"
                          />
                          {(metadataLoading || metadata) && (
                            <div className="rounded-md border border-white/10 bg-white/[0.03] p-3">
                              {metadataLoading ? (
                                <Text size="sm" color="textFaded">
                                  Loading metadata...
                                </Text>
                              ) : metadata ? (
                                <Hstack>
                                  {metadata.thumbnailUrl && (
                                    <img
                                      src={metadata.thumbnailUrl}
                                      alt=""
                                      className="h-12 w-12 rounded-md object-cover"
                                    />
                                  )}
                                  <Vstack align="start" gap={0}>
                                    <Text size="sm" weight="semibold">
                                      {metadata.title}
                                    </Text>
                                    {metadata.authorName && (
                                      <Text size="xs" color="textFaded">
                                        {metadata.authorName}
                                      </Text>
                                    )}
                                  </Vstack>
                                </Hstack>
                              ) : null}
                            </div>
                          )}
                        </>
                      )}
                    </>
                  ) : (
                    <>
                      <Input
                        value={contentQuery}
                        onValueChange={setContentQuery}
                        placeholder={collectionType === "game" ? "Search games" : "Search posts"}
                      />
                      {(collectionType === "game" ? gameResults : postResults).length > 0 && (
                        <div className="rounded-md border border-white/10 bg-white/[0.03]">
                          {collectionType === "game"
                            ? gameResults.map((game) => (
                                <button
                                  key={game.id}
                                  type="button"
                                  className="flex w-full cursor-pointer items-center justify-between border-b border-white/10 px-3 py-2 text-left last:border-b-0 hover:bg-white/5"
                                  onClick={() => {
                                    setSelectedGame(game);
                                    setGameResults([]);
                                  }}
                                >
                                  <span>
                                    <span className="block text-sm font-semibold text-white">{game.name}</span>
                                    {game.short && (
                                      <span className="block text-xs text-white/60">{game.short}</span>
                                    )}
                                  </span>
                                  <span className="text-xs text-white/50">Select</span>
                                </button>
                              ))
                            : postResults.map((post) => (
                                <button
                                  key={post.id}
                                  type="button"
                                  className="flex w-full cursor-pointer items-center justify-between border-b border-white/10 px-3 py-2 text-left last:border-b-0 hover:bg-white/5"
                                  onClick={() => {
                                    setSelectedPost(post);
                                    setPostResults([]);
                                  }}
                                >
                                  <span>
                                    <span className="block text-sm font-semibold text-white">
                                      {post.title ?? "Post"}
                                    </span>
                                    <span className="block text-xs text-white/60">
                                      {post.author?.name ?? "Unknown"}
                                    </span>
                                  </span>
                                  <span className="text-xs text-white/50">Select</span>
                                </button>
                              ))}
                        </div>
                      )}
                      {(selectedGame || selectedPost) && (
                        <Hstack justify="between" className="rounded-md bg-white/5 px-3 py-2">
                          <Text size="sm">
                            Selected: {selectedGame?.name ?? selectedPost?.title ?? "Item"}
                          </Text>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedGame(null);
                              setSelectedPost(null);
                            }}
                          >
                            Clear
                          </Button>
                        </Hstack>
                      )}
                    </>
                  )}
                  <Textarea
                    value={itemNote}
                    onValueChange={setItemNote}
                    placeholder="Entry description"
                  />
                </Vstack>
              </ModalBody>
              <ModalFooter>
                <Button variant="ghost" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" icon="plus" color="blue" disabled={addLoading}>
                  {addLabel}
                </Button>
              </ModalFooter>
            </form>
          )}
        </ModalContent>
      </Modal>

      <Modal isOpen={isEditOpen} onOpenChange={onEditOpenChange} backdrop="opaque">
        <ModalContent>
          {(onClose) => (
            <form
              onSubmit={async (event) => {
                event.preventDefault();
                if (!editTitle.trim()) {
                  addToast({ title: "Collection title is required" });
                  return;
                }
                setEditLoading(true);
                try {
                  const response = await updateCollection(collection.id, {
                    title: editTitle.trim(),
                    description: editDescription.trim() || null,
                    visibility: editVisibility,
                    playbackMode: editPlaybackMode,
                  });
                  if (response.ok) {
                    setCollection(await readItem<CollectionDetails>(response));
                    addToast({ title: "Collection updated" });
                    onClose();
                  } else {
                    addToast({ title: "Could not update collection" });
                  }
                } finally {
                  setEditLoading(false);
                }
              }}
            >
              <ModalHeader>Edit Collection</ModalHeader>
              <ModalBody>
                <Vstack align="stretch" gap={3}>
                  <Input
                    value={editTitle}
                    onValueChange={setEditTitle}
                    placeholder="Collection title"
                  />
                  <Textarea
                    value={editDescription}
                    onValueChange={setEditDescription}
                    placeholder="Description"
                  />
                  <Vstack align="stretch" gap={1}>
                    <Text size="sm" color="textFaded">
                      Visibility
                    </Text>
                    <select
                      value={editVisibility}
                      onChange={(event) =>
                        setEditVisibility(event.target.value as Lowercase<CollectionVisibility>)
                      }
                      className="rounded-md border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white outline-none focus:border-white/25"
                    >
                      <option value="private">Private</option>
                      <option value="unlisted">Unlisted</option>
                      <option value="public">Public</option>
                    </select>
                  </Vstack>
                  {collectionType === "music" && (
                    <Vstack align="stretch" gap={1}>
                      <Text size="sm" color="textFaded">
                        Playback
                      </Text>
                      <select
                        value={editPlaybackMode}
                        onChange={(event) =>
                          setEditPlaybackMode(event.target.value as "manual" | "shuffle" | "repeat")
                        }
                        className="rounded-md border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white outline-none focus:border-white/25"
                      >
                        <option value="manual">Manual</option>
                        <option value="shuffle">Shuffle</option>
                        <option value="repeat">Repeat</option>
                      </select>
                    </Vstack>
                  )}
                </Vstack>
              </ModalBody>
              <ModalFooter>
                <Button variant="ghost" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" icon="save" color="blue" disabled={editLoading}>
                  Save
                </Button>
              </ModalFooter>
            </form>
          )}
        </ModalContent>
      </Modal>

      <Modal isOpen={isItemEditOpen} onOpenChange={onItemEditOpenChange} backdrop="opaque">
        <ModalContent>
          {(onClose) => (
            <form
              onSubmit={async (event) => {
                event.preventDefault();
                if (!editingItem) return;
                setItemEditLoading(true);
                try {
                  const response = await updateCollectionItem(collection.id, editingItem.id, {
                    note: editingItemNote.trim() || null,
                  });
                  if (response.ok) {
                    setCollection(await readItem<CollectionDetails>(response));
                    setEditingItem(null);
                    setEditingItemNote("");
                    addToast({ title: "Entry description updated" });
                    onClose();
                  } else {
                    addToast({ title: "Could not update entry description" });
                  }
                } finally {
                  setItemEditLoading(false);
                }
              }}
            >
              <ModalHeader>Edit Entry Description</ModalHeader>
              <ModalBody>
                <Vstack align="stretch" gap={3}>
                  {editingItem && (
                    <Text size="sm" color="textFaded">
                      {itemTitle(editingItem)}
                    </Text>
                  )}
                  <Textarea
                    value={editingItemNote}
                    onValueChange={setEditingItemNote}
                    placeholder="Entry description"
                  />
                </Vstack>
              </ModalBody>
              <ModalFooter>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setEditingItem(null);
                    setEditingItemNote("");
                    onClose();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" icon="save" color="blue" disabled={itemEditLoading}>
                  Save
                </Button>
              </ModalFooter>
            </form>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
