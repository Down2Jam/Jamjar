"use client";

import Editor from "@/components/editor";
import { getCookie, hasCookie } from "@/helpers/cookie";
import { UserType } from "@/types/UserType";
import { addToast, Avatar, Form, ImageCropData, ImageInput } from "bioloom-ui";
import { redirect, usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { getSelf, updateUser } from "@/requests/user";
import { getTeamRoles } from "@/requests/team";
import { RoleType } from "@/types/RoleType";
import { Input } from "bioloom-ui";
import { Button } from "bioloom-ui";
import { Text } from "bioloom-ui";
import { Hstack, Stack, Vstack } from "bioloom-ui";
import { Icon } from "bioloom-ui";
import { Card } from "bioloom-ui";
import { Spinner } from "bioloom-ui";
import { Dropdown } from "bioloom-ui";
import { useTheme } from "@/providers/SiteThemeProvider";
import { Textarea } from "bioloom-ui";
import { useEmojis } from "@/providers/EmojiProvider";
import { createUserEmoji, deleteEmoji, updateEmoji } from "@/requests/emoji";

const PREFIX_CHARS = "abcdefghijklmnopqrstuvwxyz0123456789";
const MIN_EMOTE_PREFIX_LENGTH = 4;
const MAX_EMOTE_PREFIX_LENGTH = 8;
const DEFAULT_EMOTE_PREFIX_LENGTH = 6;

function buildDefaultEmotePrefix(source?: string | null) {
  const normalized = String(source ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

  if (
    normalized.length >= MIN_EMOTE_PREFIX_LENGTH &&
    normalized.length <= MAX_EMOTE_PREFIX_LENGTH
  ) {
    return normalized;
  }

  let prefix = normalized.slice(0, DEFAULT_EMOTE_PREFIX_LENGTH);
  let seed = 0;
  const seedSource = normalized || "jamjar";
  for (let i = 0; i < seedSource.length; i++) {
    seed = (seed * 31 + seedSource.charCodeAt(i)) >>> 0;
  }
  while (prefix.length < DEFAULT_EMOTE_PREFIX_LENGTH) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    prefix += PREFIX_CHARS[seed % PREFIX_CHARS.length];
  }

  return prefix;
}

export default function UserPage() {
  const [user, setUser] = useState<UserType>();
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [bannerPicture, setBannerPicture] = useState<string | null>(null);
  const [short, setShort] = useState("");
  const [bio, setBio] = useState("");
  const [errors] = useState({});
  const pathname = usePathname();
  const [waitingSave, setWaitingSave] = useState(false);
  const [showEmail, setShowEmail] = useState(false);
  const [primaryRoles, setPrimaryRoles] = useState<Set<string>>(new Set());
  const [secondaryRoles, setSecondaryRoles] = useState<Set<string>>(new Set());
  const [roles, setRoles] = useState<RoleType[]>([]);
  const { colors } = useTheme();
  const [defaultPfps, setDefaultPfps] = useState<string[]>([]);
  const { emojis, refresh: refreshEmojis } = useEmojis();
  const [emoteSlug, setEmoteSlug] = useState("");
  const [emoteImage, setEmoteImage] = useState<string | null>(null);
  const [savingEmote, setSavingEmote] = useState(false);
  const [emotePrefixInput, setEmotePrefixInput] = useState("");
  const [emoteArtistSlug, setEmoteArtistSlug] = useState("");
  const [editingEmoteId, setEditingEmoteId] = useState<number | null>(null);
  const [editingEmoteSlug, setEditingEmoteSlug] = useState("");
  const [editingEmoteImage, setEditingEmoteImage] = useState<string | null>(
    null,
  );
  const [editingEmoteArtistSlug, setEditingEmoteArtistSlug] = useState("");
  const [savingEditEmote, setSavingEditEmote] = useState(false);
  const [emoteArtistMatches, setEmoteArtistMatches] = useState<
    Array<{ slug: string; name: string; profilePicture?: string | null }>
  >([]);
  const [emoteArtistOpen, setEmoteArtistOpen] = useState(false);
  const [emoteArtistIndex, setEmoteArtistIndex] = useState(0);
  const emoteArtistTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const [editEmoteArtistMatches, setEditEmoteArtistMatches] = useState<
    Array<{ slug: string; name: string; profilePicture?: string | null }>
  >([]);
  const [editEmoteArtistOpen, setEditEmoteArtistOpen] = useState(false);
  const [editEmoteArtistIndex, setEditEmoteArtistIndex] = useState(0);
  const editEmoteArtistTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  useEffect(() => {
    fetch(
      process.env.NEXT_PUBLIC_MODE === "PROD"
        ? "https://d2jam.com/api/v1/pfps"
        : "http://localhost:3005/api/v1/pfps",
    )
      .then((res) => res.json())
      .then((data) => setDefaultPfps(data.data))
      .catch((err) => console.error("Failed to load pfps", err));
  }, []);

  useEffect(() => {
    loadUser();
    async function loadUser() {
      try {
        if (!hasCookie("token")) {
          setUser(undefined);
          redirect("/");
          return;
        }

        const response = await getSelf();

        if (response.status == 200) {
          const data = await response.json();
          setUser(data);

          setProfilePicture(data.profilePicture || null);
          setBannerPicture(data.bannerPicture || null);
          setBio(data.bio ?? "");
          setShort(data.short ?? "");
          setName(data.name ?? "");
          setEmail(data.email ?? "");
          setEmotePrefixInput(data.emotePrefix ?? "");
          setPrimaryRoles(
            new Set(data.primaryRoles.map((role: RoleType) => role.slug)) ??
              new Set(),
          );
          setSecondaryRoles(
            new Set(data.secondaryRoles.map((role: RoleType) => role.slug)) ??
              new Set(),
          );
        } else {
          setUser(undefined);
        }

        const rolesResponse = await getTeamRoles();

        if (rolesResponse.status == 200) {
          const data = await rolesResponse.json();
          setRoles(data.data);
        } else {
          setRoles([]);
        }
      } catch (error) {
        console.error(error);
      }
    }
  }, [pathname]);

  useEffect(() => {
    return () => {
      if (emoteArtistTimerRef.current) {
        clearTimeout(emoteArtistTimerRef.current);
      }
      if (editEmoteArtistTimerRef.current) {
        clearTimeout(editEmoteArtistTimerRef.current);
      }
    };
  }, []);

  if (!user) {
    return (
      <Vstack>
        <Card className="max-w-96">
          <Vstack>
            <Hstack>
              <Spinner />
              <Text size="xl">Loading</Text>
            </Hstack>
            <Text color="textFaded">Loading settings...</Text>
          </Vstack>
        </Card>
      </Vstack>
    );
  }

  const userEmotes = emojis.filter(
    (emoji) =>
      emoji.scopeType === "USER" &&
      (emoji.scopeUserId === user.id || emoji.ownerUser?.id === user.id),
  );

  const cleanedPrefixInput = emotePrefixInput
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
  const emotePrefix =
    cleanedPrefixInput || user.emotePrefix || buildDefaultEmotePrefix(name);
  const cleanedEmoteSlug = emoteSlug
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9_-]/g, "")
    .slice(0, 44);
  const cleanedEditingEmoteSlug = editingEmoteSlug
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9_-]/g, "")
    .slice(0, 44);

  const scheduleEmoteArtistFetch = (value: string) => {
    const query = value.trim();
    if (emoteArtistTimerRef.current) {
      clearTimeout(emoteArtistTimerRef.current);
    }
    if (!query) {
      setEmoteArtistMatches([]);
      setEmoteArtistOpen(false);
      setEmoteArtistIndex(0);
      return;
    }
    emoteArtistTimerRef.current = setTimeout(async () => {
      try {
        const response = await fetch(
          `${
            process.env.NEXT_PUBLIC_MODE === "PROD"
              ? "https://d2jam.com/api/v1"
              : "http://localhost:3005/api/v1"
          }/user/search?q=${encodeURIComponent(query)}`,
          {
            headers: { authorization: `Bearer ${getCookie("token")}` },
            credentials: "include",
          },
        );
        if (!response.ok) return;
        const data = await response.json();
        const matches = Array.isArray(data)
          ? data
          : Array.isArray(data?.data)
            ? data.data
            : [];
        const cleaned = matches.map((u: any) => ({
          slug: u.slug,
          name: u.name ?? u.slug,
          profilePicture: u.profilePicture ?? null,
        }));
        setEmoteArtistMatches(cleaned.slice(0, 6));
        setEmoteArtistOpen(cleaned.length > 0);
        setEmoteArtistIndex(0);
      } catch (error) {
        console.error("Failed to search users", error);
      }
    }, 200);
  };

  const scheduleEditEmoteArtistFetch = (value: string) => {
    const query = value.trim();
    if (editEmoteArtistTimerRef.current) {
      clearTimeout(editEmoteArtistTimerRef.current);
    }
    if (!query) {
      setEditEmoteArtistMatches([]);
      setEditEmoteArtistOpen(false);
      setEditEmoteArtistIndex(0);
      return;
    }
    editEmoteArtistTimerRef.current = setTimeout(async () => {
      try {
        const response = await fetch(
          `${
            process.env.NEXT_PUBLIC_MODE === "PROD"
              ? "https://d2jam.com/api/v1"
              : "http://localhost:3005/api/v1"
          }/user/search?q=${encodeURIComponent(query)}`,
          {
            headers: { authorization: `Bearer ${getCookie("token")}` },
            credentials: "include",
          },
        );
        if (!response.ok) return;
        const data = await response.json();
        const matches = Array.isArray(data)
          ? data
          : Array.isArray(data?.data)
            ? data.data
            : [];
        const cleaned = matches.map((u: any) => ({
          slug: u.slug,
          name: u.name ?? u.slug,
          profilePicture: u.profilePicture ?? null,
        }));
        setEditEmoteArtistMatches(cleaned.slice(0, 6));
        setEditEmoteArtistOpen(cleaned.length > 0);
        setEditEmoteArtistIndex(0);
      } catch (error) {
        console.error("Failed to search users", error);
      }
    }, 200);
  };

  const uploadImage = async (file: File, crop?: ImageCropData) => {
    const formData = new FormData();
    formData.append("upload", file);
    if (crop) {
      formData.append("cropLeft", String(crop.left));
      formData.append("cropTop", String(crop.top));
      formData.append("cropWidth", String(crop.width));
      formData.append("cropHeight", String(crop.height));
    }

    const response = await fetch(
      process.env.NEXT_PUBLIC_MODE === "PROD"
        ? "https://d2jam.com/api/v1/image"
        : "http://localhost:3005/api/v1/image",
      {
        method: "POST",
        body: formData,
        headers: {
          authorization: `Bearer ${getCookie("token")}`,
        },
        credentials: "include",
      },
    );

    if (!response.ok) {
      throw new Error("Failed to upload image");
    }

    return response.json();
  };

  return (
    <div className="flex items-center justify-center">
      <Form
        className="w-full max-w-2xl flex flex-col gap-4"
        validationErrors={errors}
        onReset={() => {
          setProfilePicture(user.profilePicture ?? null);
          setBannerPicture(user.bannerPicture ?? null);
          setBio(user.bio ?? "");
          setShort(user.short ?? "");
          setName(user.name ?? "");
          setPrimaryRoles(
            new Set(user.primaryRoles.map((role) => role.slug)) ?? new Set(),
          );
          setSecondaryRoles(
            new Set(user.secondaryRoles.map((role) => role.slug)) ?? new Set(),
          );
          setEmotePrefixInput(user.emotePrefix ?? "");
        }}
        onSubmit={async (e) => {
          e.preventDefault();

          if (!name) {
            addToast({
              title: "You need to enter a name",
            });
            return;
          }

          if (
            cleanedPrefixInput &&
            (cleanedPrefixInput.length < MIN_EMOTE_PREFIX_LENGTH ||
              cleanedPrefixInput.length > MAX_EMOTE_PREFIX_LENGTH)
          ) {
            addToast({ title: "Emote prefix must be 4 to 8 characters." });
            return;
          }

          setWaitingSave(true);

          const response = await updateUser(
            user.slug,
            name,
            bio,
            short,
            profilePicture,
            bannerPicture,
            Array.from(primaryRoles),
            Array.from(secondaryRoles),
            cleanedPrefixInput || buildDefaultEmotePrefix(name),
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
          );

          if (response.ok) {
            addToast({ title: "Changed settings" });
            setUser((await response.json()).data);
            setWaitingSave(false);
          } else {
            addToast({ title: "Failed to update settings" });
            setWaitingSave(false);
          }
        }}
      >
        <Card>
          <Vstack align="start">
            <Hstack>
              <Icon name="cog" color="text" />
              <Text size="xl" color="text" weight="semibold">
                Settings
              </Text>
            </Hstack>
            <Text size="sm" color="textFaded">
              Manage your preferences
            </Text>
          </Vstack>
        </Card>

        <Stack align="stretch" className="flex-col lg:flex-row">
          <Card>
            <Vstack align="start">
              <div>
                <Text color="text">Settings.Name.Title</Text>
                <Text color="textFaded" size="xs">
                  Settings.Name.Description
                </Text>
              </div>
              <Input
                value={name}
                onValueChange={setName}
                name="name"
                placeholder="Enter a name"
                type="text"
              />
            </Vstack>
          </Card>

          <Card>
            <Vstack align="start">
              <div>
                <Text color="text">Settings.Email.Title</Text>
                <Text color="textFaded" size="xs">
                  Settings.Email.Description
                </Text>
              </div>
              {showEmail && (
                <Input
                  value={email}
                  onValueChange={setEmail}
                  name="email"
                  placeholder="Enter an email"
                  type="text"
                />
              )}
              <Button size="sm" onClick={() => setShowEmail(!showEmail)}>
                {showEmail ? "Settings.Email.Hide" : "Settings.Email.Show"}
              </Button>
            </Vstack>
          </Card>
        </Stack>

        <Card>
          <Vstack align="start">
            <div>
              <Text color="text">Settings.Bio.Title</Text>
              <Text color="textFaded" size="xs">
                Settings.Bio.Description
              </Text>
            </div>
            <Editor content={bio} setContent={setBio} format="markdown" />
          </Vstack>
        </Card>

        <Card>
          <Vstack align="start">
            <div>
              <Text color="text">Settings.Short.Title</Text>
              <Text color="textFaded" size="xs">
                Settings.Short.Description
              </Text>
            </div>
            <Textarea
              value={short}
              onValueChange={setShort}
              name="short"
              placeholder="Enter a short bio"
              maxLength={155}
            />
          </Vstack>
        </Card>

        <Card>
          <Hstack>
            <Vstack align="start">
              <div>
                <Text color="text">Settings.ProfilePicture.Title</Text>
                <Text color="textFaded" size="xs">
                  Settings.ProfilePicture.Description
                </Text>
              </div>
              <ImageInput
                value={profilePicture}
                width={120}
                height={120}
                placeholder="Upload"
                onSelect={async (file, crop) => {
                  try {
                    const data = await uploadImage(file, crop);
                    setProfilePicture(data.data);
                    addToast({
                      title: data.message,
                    });
                  } catch (error) {
                    console.error(error);
                    addToast({
                      title: "Error uploading image",
                    });
                  }
                }}
              />
              <Text size="sm" color="textFaded">
                Or choose a default profile picture:
              </Text>
              <div className="flex flex-wrap gap-2">
                {defaultPfps.map((src, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setProfilePicture(src)}
                    className={`relative w-16 h-16 rounded-full border-2 duration-300`}
                    style={{
                      borderColor:
                        profilePicture === src ? colors["blue"] : "transparent",
                    }}
                  >
                    <img
                      src={src}
                      alt={`Default pfp ${index + 1}`}
                      className="h-full w-full rounded-full object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                  </button>
                ))}
              </div>
            </Vstack>
            {profilePicture && (
              <Vstack>
                <Avatar src={profilePicture} />
              </Vstack>
            )}
          </Hstack>
        </Card>

        <Card>
          <Vstack align="start" className="gap-3">
            <div>
              <Text color="text">User Emotes</Text>
              <Text color="textFaded" size="xs">
                Your emotes use the prefix{" "}
                <span className="font-semibold">{emotePrefix}</span>.
              </Text>
              <Text color="textFaded" size="sm">
                Only upload emotes you have the license to use! Any emotes you
                don't own will be removed from the site.
              </Text>
            </div>
            <Vstack align="start">
              <Text color="textFaded" size="xs">
                Emote Prefix
              </Text>
              <Input
                value={emotePrefixInput}
                onValueChange={(value) =>
                  setEmotePrefixInput(
                    value
                      .toLowerCase()
                      .replace(/[^a-z0-9]/g, "")
                      .slice(0, MAX_EMOTE_PREFIX_LENGTH),
                  )
                }
                name="emotePrefix"
                placeholder="e.g. abc123"
                maxLength={MAX_EMOTE_PREFIX_LENGTH}
              />
            </Vstack>
            <Hstack className="items-end flex-wrap">
              <Input
                label="Emote slug"
                labelPlacement="outside"
                placeholder="smile"
                value={emoteSlug}
                onValueChange={setEmoteSlug}
              />
              <div className="relative">
                <Input
                  label="Artist user slug"
                  labelPlacement="outside"
                  placeholder="username"
                  value={emoteArtistSlug}
                  onValueChange={(value) => {
                    setEmoteArtistSlug(value);
                    scheduleEmoteArtistFetch(value);
                  }}
                  onKeyDown={(event) => {
                    if (!emoteArtistOpen || emoteArtistMatches.length === 0) {
                      return;
                    }
                    if (event.key === "ArrowDown") {
                      event.preventDefault();
                      setEmoteArtistIndex((prev) =>
                        prev + 1 >= emoteArtistMatches.length ? 0 : prev + 1,
                      );
                    } else if (event.key === "ArrowUp") {
                      event.preventDefault();
                      setEmoteArtistIndex((prev) =>
                        prev === 0 ? emoteArtistMatches.length - 1 : prev - 1,
                      );
                    } else if (event.key === "Enter") {
                      event.preventDefault();
                      const match = emoteArtistMatches[emoteArtistIndex];
                      if (match) {
                        setEmoteArtistSlug(match.slug);
                        setEmoteArtistOpen(false);
                      }
                    } else if (event.key === "Escape") {
                      setEmoteArtistOpen(false);
                    }
                  }}
                />
                {emoteArtistOpen && emoteArtistMatches.length > 0 && (
                  <div className="absolute z-50 mt-2 w-full rounded-lg border border-gray-700 bg-black/80 p-2">
                    {emoteArtistMatches.map((match, index) => (
                      <button
                        key={match.slug}
                        type="button"
                        className="flex w-full items-center gap-2 rounded-md px-2 py-1 text-left"
                        style={{
                          backgroundColor:
                            index === emoteArtistIndex
                              ? "rgba(59,130,246,0.3)"
                              : "transparent",
                        }}
                        onMouseDown={(event) => {
                          event.preventDefault();
                          setEmoteArtistSlug(match.slug);
                          setEmoteArtistOpen(false);
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
                          <span className="text-xs opacity-70">
                            @{match.slug}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <Vstack align="start" gap={1}>
                <Text size="xs" color="textFaded">
                  Upload image
                </Text>
                <ImageInput
                  value={emoteImage}
                  width={80}
                  height={80}
                  placeholder="Upload"
                  onSelect={async (file, crop) => {
                    try {
                      const data = await uploadImage(file, crop);
                      setEmoteImage(data.data);
                      addToast({ title: data.message });
                    } catch (error) {
                      console.error(error);
                      addToast({ title: "Error uploading image" });
                    }
                  }}
                />
              </Vstack>
              <Vstack align="start" gap={1}>
                <Text size="xs" color="textFaded">
                  Preview
                </Text>
                <Text size="sm">
                  :{emotePrefix}
                  {cleanedEmoteSlug || "emote"}:
                </Text>
              </Vstack>
              <Button
                color="blue"
                loading={savingEmote}
                onClick={async () => {
                  if (!cleanedEmoteSlug || !emoteImage) {
                    addToast({ title: "Slug and image are required" });
                    return;
                  }
                  setSavingEmote(true);
                  try {
                    const response = await createUserEmoji(
                      cleanedEmoteSlug,
                      emoteImage,
                      emoteArtistSlug.trim() || null,
                    );
                    const data = await response.json().catch(() => null);
                    if (!response.ok) {
                      addToast({
                        title: data?.message ?? "Failed to add emote",
                      });
                      return;
                    }
                    addToast({ title: "Emote added" });
                    setEmoteSlug("");
                    setEmoteImage(null);
                    setEmoteArtistSlug("");
                    await refreshEmojis();
                  } catch (error) {
                    console.error(error);
                    addToast({ title: "Failed to add emote" });
                  } finally {
                    setSavingEmote(false);
                  }
                }}
              >
                Add Emote
              </Button>
            </Hstack>

            {userEmotes.length === 0 ? (
              <Text size="sm" color="textFaded">
                No user emotes yet.
              </Text>
            ) : (
              <div className="flex flex-wrap gap-3">
                {userEmotes.map((emoji) => (
                  <div
                    key={emoji.id}
                    className="flex items-center gap-2 rounded-lg border border-gray-700 px-3 py-2"
                  >
                    <img
                      src={emoji.image}
                      alt={`:${emoji.slug}:`}
                      className="h-6 w-6"
                      loading="lazy"
                      decoding="async"
                    />
                    <Text size="sm">:{emoji.slug}:</Text>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEditingEmoteId(emoji.id);
                        setEditingEmoteSlug(
                          emoji.slug.replace(emotePrefix, ""),
                        );
                        setEditingEmoteImage(emoji.image);
                        setEditingEmoteArtistSlug(emoji.artistUser?.slug ?? "");
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      color="red"
                      variant="ghost"
                      onClick={async () => {
                        const response = await deleteEmoji(emoji.id);
                        const data = await response.json().catch(() => null);
                        if (!response.ok) {
                          addToast({
                            title: data?.message ?? "Failed to delete emote",
                          });
                          return;
                        }
                        addToast({ title: data?.message ?? "Emote deleted" });
                        await refreshEmojis();
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            )}
            {editingEmoteId && (
              <Card className="w-full">
                <Vstack align="start" className="gap-3">
                  <Text color="text" weight="semibold">
                    Edit Emote
                  </Text>
                  <Hstack className="items-end flex-wrap">
                    <Input
                      label="Emote slug"
                      labelPlacement="outside"
                      placeholder="smile"
                      value={editingEmoteSlug}
                      onValueChange={setEditingEmoteSlug}
                    />
                    <div className="relative">
                      <Input
                        label="Artist user slug"
                        labelPlacement="outside"
                        placeholder="username"
                        value={editingEmoteArtistSlug}
                        onValueChange={(value) => {
                          setEditingEmoteArtistSlug(value);
                          scheduleEditEmoteArtistFetch(value);
                        }}
                        onKeyDown={(event) => {
                          if (
                            !editEmoteArtistOpen ||
                            editEmoteArtistMatches.length === 0
                          ) {
                            return;
                          }
                          if (event.key === "ArrowDown") {
                            event.preventDefault();
                            setEditEmoteArtistIndex((prev) =>
                              prev + 1 >= editEmoteArtistMatches.length
                                ? 0
                                : prev + 1,
                            );
                          } else if (event.key === "ArrowUp") {
                            event.preventDefault();
                            setEditEmoteArtistIndex((prev) =>
                              prev === 0
                                ? editEmoteArtistMatches.length - 1
                                : prev - 1,
                            );
                          } else if (event.key === "Enter") {
                            event.preventDefault();
                            const match =
                              editEmoteArtistMatches[editEmoteArtistIndex];
                            if (match) {
                              setEditingEmoteArtistSlug(match.slug);
                              setEditEmoteArtistOpen(false);
                            }
                          } else if (event.key === "Escape") {
                            setEditEmoteArtistOpen(false);
                          }
                        }}
                      />
                      {editEmoteArtistOpen &&
                        editEmoteArtistMatches.length > 0 && (
                          <div className="absolute z-50 mt-2 w-full rounded-lg border border-gray-700 bg-black/80 p-2">
                            {editEmoteArtistMatches.map((match, index) => (
                              <button
                                key={match.slug}
                                type="button"
                                className="flex w-full items-center gap-2 rounded-md px-2 py-1 text-left"
                                style={{
                                  backgroundColor:
                                    index === editEmoteArtistIndex
                                      ? "rgba(59,130,246,0.3)"
                                      : "transparent",
                                }}
                                onMouseDown={(event) => {
                                  event.preventDefault();
                                  setEditingEmoteArtistSlug(match.slug);
                                  setEditEmoteArtistOpen(false);
                                }}
                              >
                                <img
                                  src={
                                    match.profilePicture ||
                                    "/images/D2J_Icon.png"
                                  }
                                  alt={match.name}
                                  className="h-5 w-5 rounded-full"
                                  loading="lazy"
                                  decoding="async"
                                />
                                <div className="flex flex-col text-sm">
                                  <span>{match.name}</span>
                                  <span className="text-xs opacity-70">
                                    @{match.slug}
                                  </span>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                    </div>
                    <Vstack align="start" gap={1}>
                      <Text size="xs" color="textFaded">
                        Upload image
                      </Text>
                      <ImageInput
                        value={editingEmoteImage}
                        width={80}
                        height={80}
                        placeholder="Upload"
                        onSelect={async (file, crop) => {
                          try {
                            const data = await uploadImage(file, crop);
                            setEditingEmoteImage(data.data);
                            addToast({ title: data.message });
                          } catch (error) {
                            console.error(error);
                            addToast({ title: "Error uploading image" });
                          }
                        }}
                      />
                    </Vstack>
                    <Vstack align="start" gap={1}>
                      <Text size="xs" color="textFaded">
                        Preview
                      </Text>
                      <Text size="sm">
                        :{emotePrefix}
                        {cleanedEditingEmoteSlug || "emote"}:
                      </Text>
                    </Vstack>
                    <Hstack>
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setEditingEmoteId(null);
                          setEditingEmoteSlug("");
                          setEditingEmoteImage(null);
                          setEditingEmoteArtistSlug("");
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        color="blue"
                        loading={savingEditEmote}
                        onClick={async () => {
                          if (!editingEmoteId) return;
                          if (!cleanedEditingEmoteSlug || !editingEmoteImage) {
                            addToast({ title: "Slug and image are required" });
                            return;
                          }
                          setSavingEditEmote(true);
                          try {
                            const response = await updateEmoji(editingEmoteId, {
                              slug: `${emotePrefix}${cleanedEditingEmoteSlug}`,
                              image: editingEmoteImage,
                              artistSlug: editingEmoteArtistSlug.trim() || null,
                              scopeUserId: user.id,
                              scopeGameId: null,
                            });
                            const data = await response
                              .json()
                              .catch(() => null);
                            if (!response.ok) {
                              addToast({
                                title:
                                  data?.message ?? "Failed to update emote",
                              });
                              return;
                            }
                            addToast({ title: "Emote updated" });
                            setEditingEmoteId(null);
                            setEditingEmoteSlug("");
                            setEditingEmoteImage(null);
                            setEditingEmoteArtistSlug("");
                            await refreshEmojis();
                          } catch (error) {
                            console.error(error);
                            addToast({ title: "Failed to update emote" });
                          } finally {
                            setSavingEditEmote(false);
                          }
                        }}
                      >
                        Save
                      </Button>
                    </Hstack>
                  </Hstack>
                </Vstack>
              </Card>
            )}
          </Vstack>
        </Card>

        <Card>
          <Hstack>
            <Vstack align="start">
              <div>
                <Text color="text">Settings.BannerPicture.Title</Text>
                <Text color="textFaded" size="xs">
                  Settings.BannerPicture.Description
                </Text>
              </div>
              <ImageInput
                value={bannerPicture}
                width={440}
                height={40}
                placeholder="Upload"
                onSelect={async (file, crop) => {
                  try {
                    const data = await uploadImage(file, crop);
                    setBannerPicture(data.data);
                    addToast({
                      title: data.message,
                    });
                  } catch (error) {
                    console.error(error);
                    addToast({
                      title: "Error uploading image",
                    });
                  }
                }}
              />
            </Vstack>

            {bannerPicture && (
              <Vstack>
                <div className="bg-[#222222] w-full aspect-[11/1] relative mb-3">
                  <img
                    src={bannerPicture}
                    alt={`${user.name}'s profile banner`}
                    className="h-full w-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              </Vstack>
            )}
          </Hstack>
        </Card>
        <Hstack>
          <Card>
            <Vstack align="start">
              <div>
                <Text color="text">Settings.PrimaryRoles.Title</Text>
                <Text color="textFaded" size="xs">
                  Settings.PrimaryRoles.Description
                </Text>
              </div>
              <Dropdown
                multiple
                selectedValues={primaryRoles}
                onSelectionChange={(selection) => {
                  setPrimaryRoles(selection as Set<string>);
                }}
                position="top"
                trigger={
                  <Button size="sm">
                    {primaryRoles.size > 0
                      ? Array.from(primaryRoles)
                          .map(
                            (role) =>
                              roles.find((findrole) => findrole.slug == role)
                                ?.name || "Unknown",
                          )
                          .join(", ")
                      : "No Roles"}
                  </Button>
                }
              >
                {roles.map((primaryRole) => (
                  <Dropdown.Item
                    key={primaryRole.slug}
                    value={primaryRole.slug}
                    description={primaryRole.description}
                  >
                    {primaryRole.name}
                  </Dropdown.Item>
                ))}
              </Dropdown>
            </Vstack>
          </Card>

          <Card>
            <Vstack align="start">
              <div>
                <Text color="text">Settings.SecondaryRoles.Title</Text>
                <Text color="textFaded" size="xs">
                  Settings.SecondaryRoles.Description
                </Text>
              </div>
              <Dropdown
                position="top"
                multiple
                selectedValues={secondaryRoles}
                onSelectionChange={(selection) => {
                  setSecondaryRoles(selection as Set<string>);
                }}
                trigger={
                  <Button size="sm">
                    {secondaryRoles.size > 0
                      ? Array.from(secondaryRoles)
                          .map(
                            (role) =>
                              roles.find((findrole) => findrole.slug == role)
                                ?.name || "Unknown",
                          )
                          .join(", ")
                      : "No Roles"}
                  </Button>
                }
              >
                {roles.map((secondaryRole) => (
                  <Dropdown.Item
                    key={secondaryRole.slug}
                    value={secondaryRole.slug}
                    description={secondaryRole.description}
                  >
                    {secondaryRole.name}
                  </Dropdown.Item>
                ))}
              </Dropdown>
            </Vstack>
          </Card>
        </Hstack>

        <div className="flex gap-2 mb-4">
          {waitingSave ? (
            <Spinner />
          ) : (
            <>
              <Button type="submit" color="blue" icon="save">
                Save
              </Button>
              <Button type="reset" icon="rotateccw">
                Reset
              </Button>
            </>
          )}
        </div>
      </Form>
    </div>
  );
}
