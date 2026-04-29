"use client";

import {
  createCollection,
  followCollection,
  listCollections,
} from "@/requests/collection";
import { readArray, readItem } from "@/requests/helpers";
import { addToast, Button, Card, Hstack, Input, Text, Vstack } from "bioloom-ui";
import NextLink from "@/compat/next-link";
import { useEffect, useState } from "react";

type CollectionSummary = {
  id: string;
  title: string;
  description?: string | null;
  visibility?: string;
  followerCount?: number;
  items?: unknown[];
  owner?: { name?: string; slug?: string };
};

export default function CollectionsPage() {
  const [collections, setCollections] = useState<CollectionSummary[]>([]);
  const [mine, setMine] = useState(false);
  const [query, setQuery] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const loadCollections = async () => {
    setLoading(true);
    const response = await listCollections({
      mine,
      q: query.trim() || undefined,
      limit: 30,
    });
    if (response.ok) {
      setCollections(await readArray<CollectionSummary>(response));
    }
    setLoading(false);
  };

  useEffect(() => {
    loadCollections();
  }, [mine]);

  return (
    <Vstack align="stretch">
      <Card>
        <Hstack justify="between" className="w-full">
          <Vstack align="start" gap={0}>
            <Text size="xl" weight="semibold" color="text">
              Collections
            </Text>
            <Text size="sm" color="textFaded">
              Curated games, posts, and music.
            </Text>
          </Vstack>
          <Hstack>
            <Button
              size="sm"
              color={mine ? "blue" : "default"}
              onClick={() => setMine((value) => !value)}
            >
              Mine
            </Button>
            <Button size="sm" icon="rotateccw" onClick={loadCollections}>
              Refresh
            </Button>
          </Hstack>
        </Hstack>
      </Card>

      <Card>
        <form
          className="flex flex-col gap-3"
          onSubmit={async (event) => {
            event.preventDefault();
            if (!title.trim()) return;
            const response = await createCollection({
              title: title.trim(),
              description: description.trim() || undefined,
              visibility: "public",
            });
            if (response.ok) {
              const created = await readItem<CollectionSummary>(response);
              setTitle("");
              setDescription("");
              if (created) setCollections((current) => [created, ...current]);
              addToast({ title: "Collection created" });
            } else {
              addToast({ title: "Could not create collection" });
            }
          }}
        >
          <Text color="text" weight="semibold">
            New collection
          </Text>
          <Input value={title} onValueChange={setTitle} placeholder="Title" />
          <Input
            value={description}
            onValueChange={setDescription}
            placeholder="Description"
          />
          <Button type="submit" icon="plus" color="blue">
            Create collection
          </Button>
        </form>
      </Card>

      <Card>
        <Hstack className="w-full">
          <Input
            value={query}
            onValueChange={setQuery}
            placeholder="Search collections"
          />
          <Button icon="search" onClick={loadCollections} disabled={loading}>
            Search
          </Button>
        </Hstack>
      </Card>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {collections.map((collection) => (
          <Card key={collection.id}>
            <Vstack align="start">
              <NextLink href={`/collections/${collection.id}`}>
                <Text size="lg" weight="semibold" color="text">
                  {collection.title}
                </Text>
              </NextLink>
              {collection.description && (
                <Text size="sm" color="textFaded">
                  {collection.description}
                </Text>
              )}
              <Text size="xs" color="textFaded">
                {collection.owner?.name ?? "Unknown"} · {collection.items?.length ?? 0} items ·{" "}
                {collection.followerCount ?? 0} followers
              </Text>
              <Button
                size="sm"
                icon="star"
                onClick={async () => {
                  const response = await followCollection(collection.id, true);
                  if (response.ok) await loadCollections();
                }}
              >
                Follow
              </Button>
            </Vstack>
          </Card>
        ))}
      </div>
    </Vstack>
  );
}
