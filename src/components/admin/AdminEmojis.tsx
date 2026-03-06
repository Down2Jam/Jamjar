"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  addToast,
  Button,
  Card,
  Hstack,
  Input,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  Text,
  Vstack,
  ImageInput,
} from "bioloom-ui";
import { useEmojis } from "@/providers/EmojiProvider";
import { createEmoji, deleteEmoji, updateEmoji } from "@/requests/emoji";
import { getCookie } from "@/helpers/cookie";
import { BASE_URL } from "@/requests/config";
import type { MutableRefObject } from "react";

const sanitizeSlug = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9_-]/g, "")
    .slice(0, 50);

export default function AdminEmojis() {
  const { emojis, loading, refresh } = useEmojis();
  const [slug, setSlug] = useState("");
  const [image, setImage] = useState("");
  const [artistSlug, setArtistSlug] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editing, setEditing] = useState<number | null>(null);
  const [editSlug, setEditSlug] = useState("");
  const [editImage, setEditImage] = useState("");
  const [editArtistSlug, setEditArtistSlug] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const [artistMatches, setArtistMatches] = useState<
    Array<{ slug: string; name: string; profilePicture?: string | null }>
  >([]);
  const [artistOpen, setArtistOpen] = useState(false);
  const [artistIndex, setArtistIndex] = useState(0);
  const [editArtistMatches, setEditArtistMatches] = useState<
    Array<{ slug: string; name: string; profilePicture?: string | null }>
  >([]);
  const [editArtistOpen, setEditArtistOpen] = useState(false);
  const [editArtistIndex, setEditArtistIndex] = useState(0);
  const artistTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const editArtistTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cleanedSlug = useMemo(() => sanitizeSlug(slug), [slug]);
  const sortedEmojis = useMemo(() => {
    return [...emojis].sort((a, b) => a.slug.localeCompare(b.slug));
  }, [emojis]);

  const uploadImage = async (
    file: File,
    onUploaded: (url: string) => void
  ) => {
    const formData = new FormData();
    formData.append("upload", file);

    const url =
      process.env.NEXT_PUBLIC_MODE === "PROD"
        ? "https://d2jam.com/api/v1/image"
        : "http://localhost:3005/api/v1/image";

    setUploading(true);
    try {
      const response = await fetch(url, {
        method: "POST",
        body: formData,
        headers: { authorization: `Bearer ${getCookie("token")}` },
        credentials: "include",
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        addToast({ title: data?.message ?? "Failed to upload image" });
        return;
      }
      onUploaded(data?.data ?? "");
      addToast({ title: data?.message ?? "Image uploaded" });
    } catch (error) {
      console.error("Failed to upload image", error);
      addToast({ title: "Failed to upload image" });
    } finally {
      setUploading(false);
    }
  };

  const fetchArtistSuggestions = async (query: string) => {
    const response = await fetch(
      `${BASE_URL}/search?query=${encodeURIComponent(query)}&type=users`
    );
    if (!response.ok) return [];
    const payload = await response.json();
    const users = payload?.data?.users ?? [];
    return users.map((user: any) => ({
      slug: user.slug,
      name: user.name ?? user.slug,
      profilePicture: user.profilePicture ?? null,
    }));
  };

  const scheduleArtistFetch = (
    value: string,
    setMatches: (matches: Array<{ slug: string; name: string; profilePicture?: string | null }>) => void,
    setOpen: (open: boolean) => void,
    setIndex: (index: number) => void,
    timerRef: MutableRefObject<ReturnType<typeof setTimeout> | null>
  ) => {
    const query = value.trim();
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!query) {
      setMatches([]);
      setOpen(false);
      setIndex(0);
      return;
    }

    timerRef.current = setTimeout(async () => {
      const matches = await fetchArtistSuggestions(query);
      if (matches.length === 0) {
        setMatches([]);
        setOpen(false);
        setIndex(0);
        return;
      }
      setMatches(matches.slice(0, 6));
      setOpen(true);
      setIndex(0);
    }, 180);
  };

  useEffect(() => {
    return () => {
      if (artistTimerRef.current) clearTimeout(artistTimerRef.current);
      if (editArtistTimerRef.current) clearTimeout(editArtistTimerRef.current);
    };
  }, []);

  const handleCreate = async () => {
    if (!slug.trim() || !image.trim()) {
      addToast({ title: "Slug and image are required" });
      return;
    }

    setSaving(true);
    try {
      const response = await createEmoji(
        slug,
        image,
        null,
        artistSlug.trim() || null
      );
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        addToast({ title: data?.message ?? "Failed to create emoji" });
        return;
      }

      addToast({ title: "Emoji created" });
      setSlug("");
      setImage("");
      setArtistSlug("");
      await refresh();
    } catch (error) {
      console.error("Failed to create emoji", error);
      addToast({ title: "Failed to create emoji" });
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (emoji: (typeof emojis)[number]) => {
    setEditing(emoji.id);
    setEditSlug(emoji.slug);
    setEditImage(emoji.image);
    setEditArtistSlug(emoji.artistUser?.slug ?? "");
  };

  const cancelEdit = () => {
    setEditing(null);
    setEditSlug("");
    setEditImage("");
    setEditArtistSlug("");
  };

  const handleUpdate = async () => {
    if (!editing) return;
    if (!editSlug.trim() || !editImage.trim()) {
      addToast({ title: "Slug and image are required" });
      return;
    }

    setEditSaving(true);
    try {
      const response = await updateEmoji(editing, {
        slug: editSlug,
        image: editImage,
        artist: null,
        artistSlug: editArtistSlug.trim() || null,
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        addToast({ title: data?.message ?? "Failed to update emoji" });
        return;
      }
      addToast({ title: "Emoji updated" });
      cancelEdit();
      await refresh();
    } catch (error) {
      console.error("Failed to update emoji", error);
      addToast({ title: "Failed to update emoji" });
    } finally {
      setEditSaving(false);
    }
  };

  const handleDelete = async (emojiId: number) => {
    if (!window.confirm("Delete this emoji? This cannot be undone.")) {
      return;
    }
    try {
      const response = await deleteEmoji(emojiId);
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        addToast({ title: data?.message ?? "Failed to delete emoji" });
        return;
      }
      addToast({ title: data?.message ?? "Emoji deleted" });
      await refresh();
    } catch (error) {
      console.error("Failed to delete emoji", error);
      addToast({ title: "Failed to delete emoji" });
    }
  };

  return (
    <main className="flex flex-col gap-6 pb-10">
      <section className="flex flex-col gap-3">
        <Vstack align="stretch" gap={1}>
          <Text size="3xl" weight="bold">
            Emoji Control
          </Text>
          <Text size="sm" color="textFaded">
            Add custom emoji packs that can be used in posts, comments, and
            reactions.
          </Text>
        </Vstack>
      </section>

      <Card>
        <Vstack align="stretch" gap={3}>
          <Text size="lg" weight="semibold">
            Add Emoji
          </Text>
          <Hstack wrap>
            <Input
              label="Slug"
              labelPlacement="outside"
              placeholder="party-pop"
              value={slug}
              onValueChange={setSlug}
            />
            <Input
              label="Image URL"
              labelPlacement="outside"
              placeholder="https://..."
              value={image}
              onValueChange={setImage}
            />
            <div className="flex flex-col gap-2">
              <Text size="sm" color="textFaded">
                Upload image
              </Text>
              <ImageInput
                value={image}
                onSelect={(file) => uploadImage(file, setImage)}
                disabled={uploading}
                width={80}
                height={80}
                placeholder="Upload"
              />
            </div>
            <div className="relative">
              <Input
              label="Artist user slug (optional)"
              labelPlacement="outside"
              placeholder="username"
              value={artistSlug}
              onValueChange={(value) => {
                setArtistSlug(value);
                scheduleArtistFetch(
                  value,
                  setArtistMatches,
                  setArtistOpen,
                  setArtistIndex,
                  artistTimerRef
                );
              }}
              onKeyDown={(event) => {
                if (!artistOpen || artistMatches.length === 0) return;
                if (event.key === "ArrowDown") {
                  event.preventDefault();
                  setArtistIndex((prev) =>
                    prev + 1 >= artistMatches.length ? 0 : prev + 1
                  );
                } else if (event.key === "ArrowUp") {
                  event.preventDefault();
                  setArtistIndex((prev) =>
                    prev === 0 ? artistMatches.length - 1 : prev - 1
                  );
                } else if (event.key === "Enter") {
                  event.preventDefault();
                  const match = artistMatches[artistIndex];
                  if (match) {
                    setArtistSlug(match.slug);
                    setArtistOpen(false);
                  }
                } else if (event.key === "Escape") {
                  setArtistOpen(false);
                }
              }}
            />
            {artistOpen && artistMatches.length > 0 && (
              <div className="absolute z-50 mt-2 w-full rounded-lg border border-gray-700 bg-black/80 p-2">
                {artistMatches.map((match, index) => (
                  <button
                    key={match.slug}
                    type="button"
                    className="flex w-full items-center gap-2 rounded-md px-2 py-1 text-left"
                    style={{
                      backgroundColor:
                        index === artistIndex ? "rgba(59,130,246,0.3)" : "transparent",
                    }}
                    onMouseDown={(event) => {
                      event.preventDefault();
                      setArtistSlug(match.slug);
                      setArtistOpen(false);
                    }}
                  >
                    <img
                      src={match.profilePicture || "/images/D2J_Icon.png"}
                      alt={match.name}
                      className="h-5 w-5 rounded-full"
                      loading="lazy"
                      decoding="async"
                    />
                    <div className="flex flex-col text-sm">
                      <span>{match.name}</span>
                      <span className="text-xs opacity-70">@{match.slug}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
            </div>
          </Hstack>
          <Hstack justify="between" wrap>
            <Vstack align="start" gap={1}>
              <Text size="xs" color="textFaded">
                Shortcode preview
              </Text>
              <Text size="sm">
                :{cleanedSlug || "emoji"}:
              </Text>
            </Vstack>
            {image.trim() && (
              <Hstack>
                <img
                  src={image}
                  alt={cleanedSlug ? `:${cleanedSlug}:` : "emoji preview"}
                  className="h-10 w-10"
                  loading="lazy"
                  decoding="async"
                />
                <Text size="sm" color="textFaded">
                  Preview
                </Text>
              </Hstack>
            )}
            <Button color="blue" loading={saving} onClick={handleCreate}>
              Create Emoji
            </Button>
          </Hstack>
        </Vstack>
      </Card>

      <Card>
        <Vstack align="stretch" gap={3}>
          {editing && (
            <Vstack align="stretch" gap={3}>
              <Text size="lg" weight="semibold">
                Edit Emoji
              </Text>
              <Hstack wrap>
                <Input
                  label="Slug"
                  labelPlacement="outside"
                  value={editSlug}
                  onValueChange={setEditSlug}
                />
                <Input
                  label="Image URL"
                  labelPlacement="outside"
                  value={editImage}
                  onValueChange={setEditImage}
                />
                <div className="flex flex-col gap-2">
                  <Text size="sm" color="textFaded">
                    Upload image
                  </Text>
                  <ImageInput
                    value={editImage}
                    onSelect={(file) => uploadImage(file, setEditImage)}
                    disabled={uploading}
                    width={80}
                    height={80}
                    placeholder="Upload"
                  />
                </div>
                <div className="relative">
                  <Input
                  label="Artist user slug (optional)"
                  labelPlacement="outside"
                  value={editArtistSlug}
                  onValueChange={(value) => {
                    setEditArtistSlug(value);
                    scheduleArtistFetch(
                      value,
                      setEditArtistMatches,
                      setEditArtistOpen,
                      setEditArtistIndex,
                      editArtistTimerRef
                    );
                  }}
                  onKeyDown={(event) => {
                    if (!editArtistOpen || editArtistMatches.length === 0) return;
                    if (event.key === "ArrowDown") {
                      event.preventDefault();
                      setEditArtistIndex((prev) =>
                        prev + 1 >= editArtistMatches.length ? 0 : prev + 1
                      );
                    } else if (event.key === "ArrowUp") {
                      event.preventDefault();
                      setEditArtistIndex((prev) =>
                        prev === 0 ? editArtistMatches.length - 1 : prev - 1
                      );
                    } else if (event.key === "Enter") {
                      event.preventDefault();
                      const match = editArtistMatches[editArtistIndex];
                      if (match) {
                        setEditArtistSlug(match.slug);
                        setEditArtistOpen(false);
                      }
                    } else if (event.key === "Escape") {
                      setEditArtistOpen(false);
                    }
                  }}
                />
                {editArtistOpen && editArtistMatches.length > 0 && (
                  <div className="absolute z-50 mt-2 w-full rounded-lg border border-gray-700 bg-black/80 p-2">
                    {editArtistMatches.map((match, index) => (
                      <button
                        key={match.slug}
                        type="button"
                        className="flex w-full items-center gap-2 rounded-md px-2 py-1 text-left"
                        style={{
                          backgroundColor:
                            index === editArtistIndex ? "rgba(59,130,246,0.3)" : "transparent",
                        }}
                        onMouseDown={(event) => {
                          event.preventDefault();
                          setEditArtistSlug(match.slug);
                          setEditArtistOpen(false);
                        }}
                      >
                        <img
                          src={match.profilePicture || "/images/D2J_Icon.png"}
                          alt={match.name}
                          className="h-5 w-5 rounded-full"
                          loading="lazy"
                          decoding="async"
                        />
                        <div className="flex flex-col text-sm">
                          <span>{match.name}</span>
                          <span className="text-xs opacity-70">@{match.slug}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                </div>
              </Hstack>
              <Hstack justify="between" wrap>
                <Text size="xs" color="textFaded">
                  Updates apply to :{sanitizeSlug(editSlug) || "emoji"}:
                </Text>
                <Hstack>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={cancelEdit}
                    disabled={editSaving}
                  >
                    Cancel
                  </Button>
                  <Button color="blue" loading={editSaving} onClick={handleUpdate}>
                    Save Changes
                  </Button>
                </Hstack>
              </Hstack>
            </Vstack>
          )}
          <Hstack justify="between">
            <Text size="lg" weight="semibold">
              Emoji Library
            </Text>
            <Button size="sm" icon="rotateccw" onClick={refresh}>
              Refresh
            </Button>
          </Hstack>
          {loading ? (
            <Spinner />
          ) : sortedEmojis.length === 0 ? (
            <Text size="sm" color="textFaded">
              No emojis have been added yet.
            </Text>
          ) : (
            <Table>
              <TableHeader>
                <TableColumn>Emoji</TableColumn>
                <TableColumn>Slug</TableColumn>
                <TableColumn>Artist</TableColumn>
                <TableColumn>Preview</TableColumn>
                <TableColumn>Uploader</TableColumn>
              </TableHeader>
              <TableBody>
                {sortedEmojis.map((emoji) => (
                  <TableRow key={emoji.id}>
                    <TableCell>
                      <img
                        src={emoji.image}
                        alt={`:${emoji.slug}:`}
                        className="h-8 w-8"
                        loading="lazy"
                        decoding="async"
                      />
                    </TableCell>
                    <TableCell>
                      <Text size="sm">:{emoji.slug}:</Text>
                    </TableCell>
                    <TableCell>
                      {emoji.artistUser ? (
                        <a
                          href={`/u/${emoji.artistUser.slug}`}
                          className="flex items-center gap-2 text-sm"
                        >
                          <img
                            src={
                              emoji.artistUser.profilePicture || "/images/D2J_Icon.png"
                            }
                            alt={emoji.artistUser.name}
                            className="h-5 w-5 rounded-full"
                            loading="lazy"
                            decoding="async"
                          />
                          <span>{emoji.artistUser.name}</span>
                        </a>
                      ) : (
                        <Text size="sm" color="textFaded">
                          {emoji.artist || "Uncredited"}
                        </Text>
                      )}
                    </TableCell>
                    <TableCell>
                      <Hstack>
                        <Button
                          size="sm"
                          variant="ghost"
                          href={emoji.image}
                          icon="arrowupright"
                        >
                          View
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => startEdit(emoji)}>
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          color="red"
                          onClick={() => handleDelete(emoji.id)}
                        >
                          Delete
                        </Button>
                      </Hstack>
                    </TableCell>
                    <TableCell>
                      {emoji.uploaderUser ? (
                        <a
                          href={`/u/${emoji.uploaderUser.slug}`}
                          className="flex items-center gap-2 text-sm"
                        >
                          <img
                            src={
                              emoji.uploaderUser.profilePicture || "/images/D2J_Icon.png"
                            }
                            alt={emoji.uploaderUser.name}
                            className="h-5 w-5 rounded-full"
                            loading="lazy"
                            decoding="async"
                          />
                          <span>{emoji.uploaderUser.name}</span>
                        </a>
                      ) : (
                        <Text size="sm" color="textFaded">
                          Unknown
                        </Text>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Vstack>
      </Card>
    </main>
  );
}
