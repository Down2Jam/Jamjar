"use client";

import {
  createCollection,
  listCollections,
  type CollectionType,
} from "@/requests/collection";
import {
  CollectionArtwork,
  type CollectionArtworkSummary,
} from "@/components/collections/CollectionArtwork";
import { readArray, readItem } from "@/requests/helpers";
import { hasCookie } from "@/helpers/cookie";
import { useSelf } from "@/hooks/queries";
import { usePageMetadata } from "@/hooks/usePageMetadata";
import {
  addToast,
  Button,
  Hstack,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Text,
  Vstack,
  useDisclosure,
} from "bioloom-ui";
import NextLink from "@/compat/next-link";
import { LibraryBig } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type CollectionSummary = CollectionArtworkSummary;

type FilterType = "all" | "game" | "music" | "post";

const FILTERS: Array<{
  key: FilterType;
  label: string;
  collectionType?: CollectionType;
}> = [
  { key: "all", label: "All" },
  { key: "game", label: "Games", collectionType: "game" },
  { key: "music", label: "Music", collectionType: "music" },
  { key: "post", label: "Posts", collectionType: "post" },
];

const COLLECTION_TYPES: Array<{ key: CollectionType; label: string }> = [
  { key: "game", label: "Games" },
  { key: "music", label: "Music" },
  { key: "post", label: "Posts" },
];

function visibilityLabel(visibility?: string) {
  if (visibility === "private") return "Private";
  if (visibility === "unlisted") return "Unlisted";
  return null;
}

export default function CollectionsPage() {
  const [collections, setCollections] = useState<CollectionSummary[]>([]);
  const [filter, setFilter] = useState<FilterType>("all");
  const [query, setQuery] = useState("");
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [description, setDescription] = useState("");
  const [collectionType, setCollectionType] = useState<CollectionType>("music");
  const [loading, setLoading] = useState(false);
  const { data: self } = useSelf(hasCookie("token"));
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  usePageMetadata({
    title: "Collections",
    description: "Curated games, posts, D2Jam music, and external music links.",
    canonical: "/collections",
    image: "/images/D2J_Icon.png",
  });

  const activeFilter = useMemo(
    () => FILTERS.find((entry) => entry.key === filter),
    [filter],
  );

  const toKebabSlug = (value: string) =>
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 80);

  const loadCollections = async () => {
    setLoading(true);
    try {
      const response = await listCollections({
        q: query.trim() || undefined,
        collectionType: activeFilter?.collectionType,
        limit: 48,
      });
      if (response.ok) {
        setCollections(await readArray<CollectionSummary>(response));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCollections();
  }, [activeFilter?.collectionType]);

  return (
    <>
      <Vstack align="stretch" gap={5}>
        <Hstack justify="between" className="w-full flex-wrap gap-3">
          <Vstack align="start" gap={0}>
            <Text size="2xl" weight="semibold" color="text">
              Collections
            </Text>
            <Text size="sm" color="textFaded">
              Curated games, posts, D2Jam music, and external music links.
            </Text>
          </Vstack>
          <Hstack wrap>
            <Button icon="plus" color="blue" onClick={onOpen}>
              New Collection
            </Button>
          </Hstack>
        </Hstack>

        <Hstack className="w-full flex-wrap gap-3" justify="between">
          <Hstack wrap>
            {FILTERS.map((entry) => (
              <Button
                key={entry.key}
                size="sm"
                variant="ghost"
                color={filter === entry.key ? "blue" : "default"}
                onClick={() => setFilter(entry.key)}
              >
                {entry.label}
              </Button>
            ))}
          </Hstack>
          <form
            className="flex min-w-[260px] flex-1 gap-2 sm:flex-initial"
            onSubmit={(event) => {
              event.preventDefault();
              loadCollections();
            }}
          >
            <Input
              value={query}
              onValueChange={setQuery}
              placeholder="Search collections"
            />
            <Button icon="search" type="submit" disabled={loading}>
              Search
            </Button>
          </form>
        </Hstack>

        {loading && collections.length === 0 ? (
          <section className="grid gap-x-5 gap-y-7 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="animate-pulse">
                <div className="relative aspect-square w-full">
                  <div className="absolute left-[4%] top-[4%] z-10 h-[62%] w-[62%] rounded-full bg-white/10 shadow-lg shadow-black/25" />
                  <div className="absolute bottom-[4%] right-[4%] h-[62%] w-[62%] rounded-full bg-white/5 shadow-lg shadow-black/25" />
                </div>
                <div className="mt-2 space-y-2">
                  <div className="h-4 w-2/3 rounded-full bg-white/10" />
                  <div className="h-3 w-1/3 rounded-full bg-white/5" />
                </div>
              </div>
            ))}
          </section>
        ) : collections.length === 0 ? (
          <div className="rounded-lg border border-white/10 bg-white/[0.03] p-6">
            <Text color="textFaded">No collections found.</Text>
          </div>
        ) : (
          <section className="grid gap-x-5 gap-y-7 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {collections.map((collection) => {
              const ownedBySelf =
                Boolean(collection.owner?.id && self?.id === collection.owner.id) ||
                Boolean(collection.owner?.slug && self?.slug === collection.owner.slug);
              const privateLabel = ownedBySelf
                ? visibilityLabel(collection.visibility)
                : null;
              return (
                <NextLink
                  key={collection.id}
                  className="group block"
                  href={`/c/${collection.slug}`}
                >
                  <CollectionArtwork collection={collection} />
                  <Vstack align="start" gap={0} className="mt-2 min-w-0">
                    <div className="flex w-full min-w-0 items-center gap-2">
                      <Text
                        size="md"
                        weight="semibold"
                        color="text"
                        className="min-w-0 flex-1 truncate transition-colors group-hover:text-blue-300"
                      >
                        {collection.title}
                      </Text>
                      {privateLabel && (
                        <span className="shrink-0 rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-[11px] font-semibold leading-none text-white/70">
                          {privateLabel}
                        </span>
                      )}
                    </div>
                    <Text size="sm" color="textFaded" className="w-full truncate">
                      {collection.owner?.name ?? "Unknown"}
                    </Text>
                  </Vstack>
                </NextLink>
              );
            })}
          </section>
        )}
      </Vstack>

      <Modal isOpen={isOpen} onOpenChange={onOpenChange} backdrop="opaque">
        <ModalContent>
          {(onClose) => (
            <form
              onSubmit={async (event) => {
                event.preventDefault();
                if (!title.trim()) return;
                const response = await createCollection({
                  title: title.trim(),
                  slug: slug.trim() || undefined,
                  description: description.trim() || undefined,
                  collectionType,
                  visibility: "public",
                });
                if (response.ok) {
                  const created = await readItem<CollectionSummary>(response);
                  setTitle("");
                  setSlug("");
                  setSlugEdited(false);
                  setDescription("");
                  setCollectionType("music");
                  if (created) setCollections((current) => [created, ...current]);
                  addToast({ title: "Collection created" });
                  onClose();
                } else {
                  addToast({ title: "Could not create collection" });
                }
              }}
            >
              <ModalHeader>
                <Hstack>
                  <LibraryBig size={20} />
                  <span>Create Collection</span>
                </Hstack>
              </ModalHeader>
              <ModalBody>
                <Vstack align="stretch" gap={3}>
                  <Input
                    value={title}
                    onValueChange={(value) => {
                      setTitle(value);
                      if (!slugEdited) setSlug(toKebabSlug(value));
                    }}
                    placeholder="Title"
                  />
                  <Input
                    value={slug}
                    onValueChange={(value) => {
                      setSlugEdited(true);
                      setSlug(toKebabSlug(value));
                    }}
                    placeholder="collection-slug"
                  />
                  <Input
                    value={description}
                    onValueChange={setDescription}
                    placeholder="Description"
                  />
                  <Vstack align="start" gap={2}>
                    <Text size="sm" color="textFaded">
                      Type
                    </Text>
                    <Hstack wrap>
                      {COLLECTION_TYPES.map((entry) => (
                        <Button
                          key={entry.key}
                          type="button"
                          size="sm"
                          variant="ghost"
                          color={collectionType === entry.key ? "blue" : "default"}
                          onClick={() => setCollectionType(entry.key)}
                        >
                          {entry.label}
                        </Button>
                      ))}
                    </Hstack>
                  </Vstack>
                </Vstack>
              </ModalBody>
              <ModalFooter>
                <Button variant="ghost" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" icon="plus" color="blue">
                  Create
                </Button>
              </ModalFooter>
            </form>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
