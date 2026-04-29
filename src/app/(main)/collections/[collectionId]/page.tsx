"use client";

import {
  addCollectionComment,
  exportCollection,
  followCollection,
  getCollection,
  listCollectionComments,
} from "@/requests/collection";
import { readItem } from "@/requests/helpers";
import { Button, Card, Hstack, Input, Text, Vstack, addToast } from "bioloom-ui";
import { use, useEffect, useState } from "react";

type CollectionDetails = {
  id: string;
  title: string;
  description?: string | null;
  visibility?: string;
  followerCount?: number;
  owner?: { name?: string; slug?: string };
  items?: Array<{ id: string; itemType: string; itemId: number; note?: string | null }>;
  collaborators?: Array<{ id: string; userName?: string; role?: string; status?: string }>;
};

type CollectionComment = {
  id: string;
  content: string;
  authorName?: string;
  author?: { name?: string };
  createdAt?: string;
};

export default function CollectionPage({
  params,
}: {
  params: Promise<{ collectionId: string }>;
}) {
  const { collectionId } = use(params);
  const [collection, setCollection] = useState<CollectionDetails | null>(null);
  const [comments, setComments] = useState<CollectionComment[]>([]);
  const [comment, setComment] = useState("");

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

  if (!collection) {
    return (
      <Card>
        <Text color="textFaded">Loading collection...</Text>
      </Card>
    );
  }

  return (
    <Vstack align="stretch">
      <Card>
        <Hstack justify="between" className="w-full">
          <Vstack align="start">
            <Text size="2xl" weight="semibold" color="text">
              {collection.title}
            </Text>
            <Text size="sm" color="textFaded">
              {collection.owner?.name ?? "Unknown"} · {collection.visibility} ·{" "}
              {collection.followerCount ?? 0} followers
            </Text>
            {collection.description && (
              <Text color="textFaded">{collection.description}</Text>
            )}
          </Vstack>
          <Hstack>
            <Button
              size="sm"
              icon="star"
              onClick={async () => {
                const response = await followCollection(collection.id, true);
                if (response.ok) {
                  addToast({ title: "Collection followed" });
                  await load();
                }
              }}
            >
              Follow
            </Button>
            <Button
              size="sm"
              icon="download"
              onClick={async () => {
                const response = await exportCollection(collection.id);
                if (!response.ok) return;
                const data = await response.json();
                await navigator.clipboard?.writeText(JSON.stringify(data, null, 2));
                addToast({ title: "Collection export copied" });
              }}
            >
              Export
            </Button>
          </Hstack>
        </Hstack>
      </Card>

      <Card>
        <Vstack align="stretch">
          <Text weight="semibold" color="text">
            Items
          </Text>
          {(collection.items ?? []).length === 0 ? (
            <Text color="textFaded">No items yet.</Text>
          ) : (
            collection.items?.map((item) => (
              <Hstack key={item.id} justify="between" className="w-full">
                <Text color="text">
                  {item.itemType} #{item.itemId}
                </Text>
                {item.note && (
                  <Text size="sm" color="textFaded">
                    {item.note}
                  </Text>
                )}
              </Hstack>
            ))
          )}
        </Vstack>
      </Card>

      <Card>
        <Vstack align="stretch">
          <Text weight="semibold" color="text">
            Comments
          </Text>
          <form
            className="flex gap-2"
            onSubmit={async (event) => {
              event.preventDefault();
              if (!comment.trim()) return;
              const response = await addCollectionComment(collection.id, comment);
              if (response.ok) {
                setComment("");
                await load();
              }
            }}
          >
            <Input
              value={comment}
              onValueChange={setComment}
              placeholder="Add a comment"
            />
            <Button type="submit" icon="send">
              Send
            </Button>
          </form>
          {comments.map((entry) => (
            <Card key={entry.id}>
              <Vstack align="start" gap={1}>
                <Text size="sm" color="textFaded">
                  {entry.author?.name ?? entry.authorName ?? "Unknown"}
                </Text>
                <Text color="text">{entry.content}</Text>
              </Vstack>
            </Card>
          ))}
        </Vstack>
      </Card>
    </Vstack>
  );
}
