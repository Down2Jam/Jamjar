"use client";

import { useTranslations as useUiTranslations } from "@/compat/next-intl";


import TwitchConnection from "@/components/twitch-connection";
import Editor from "@/components/editor";
import { getCookie, hasCookie } from "@/helpers/cookie";
import { UserType } from "@/types/UserType";
import { addToast, Form, ImageCropData, ImageInput, Tabs, Tab, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Icon } from "bioloom-ui";
import { redirect, usePathname } from "@/compat/next-navigation";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { getSelf, updateUser } from "@/requests/user";
import { getTeamRoles } from "@/requests/team";
import { RoleType } from "@/types/RoleType";
import { Input } from "bioloom-ui";
import { Button } from "bioloom-ui";
import { Chip, Text } from "bioloom-ui";
import { Hstack, Vstack } from "bioloom-ui";
import { Card } from "bioloom-ui";
import { Spinner } from "bioloom-ui";
import { Dropdown } from "bioloom-ui";
import { Switch } from "bioloom-ui";
import { useTheme } from "@/providers/useSiteTheme";
import { Textarea } from "bioloom-ui";
import { useEmojis } from "@/providers/useEmojis";
import { createUserEmoji, deleteEmoji, updateEmoji } from "@/requests/emoji";
import { readArray, readItem, unwrapArray } from "@/requests/helpers";
import { BASE_URL } from "@/requests/config";
import EditorFooter from "@/components/game-editing-form/EditorFooter";
import GameTokensSection from "@/components/settings/GameTokensSection";
import ConnectedAppsSection from "@/components/settings/ConnectedAppsSection";
import DeveloperAppsSection, { DEVELOPER_APP_FORM_ID } from "@/components/settings/DeveloperAppsSection";
import NotificationSettingsSection from "@/components/settings/NotificationSettingsSection";
import StickerManager from "@/components/stickers/StickerManager";

import "@/components/game-editing-form/game-editor.css";
import "@/components/form-editor.css";

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
  const uiText = useUiTranslations();
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
  const [hideRatings, setHideRatings] = useState(false);
  const [autoHideRatingsWhileStreaming, setAutoHideRatingsWhileStreaming] =
    useState(false);
  const [messageRequestPolicy, setMessageRequestPolicy] = useState<
    "EVERYONE" | "FOLLOWING" | "NOBODY"
  >("EVERYONE");
  const [primaryRoles, setPrimaryRoles] = useState<Set<string>>(new Set());
  const [secondaryRoles, setSecondaryRoles] = useState<Set<string>>(new Set());
  const [roles, setRoles] = useState<RoleType[]>([]);
  const { colors, siteTheme } = useTheme();
  const [defaultPfps, setDefaultPfps] = useState<string[]>([]);
  const { emojis, refresh: refreshEmojis } = useEmojis();
  const [emoteSlug, setEmoteSlug] = useState("");
  const [emoteImage, setEmoteImage] = useState<string | null>(null);
  const [savingEmote, setSavingEmote] = useState(false);
  const [addingEmote, setAddingEmote] = useState(false);
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
    fetch(`${BASE_URL}/pfps`)
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
          const data = await readItem<UserType>(response);
          if (!data) {
            setUser(undefined);
            return;
          }
          setUser(data);

          setProfilePicture(data.profilePicture || null);
          setBannerPicture(data.bannerPicture || null);
          setBio(data.bio ?? "");
          setShort(data.short ?? "");
          setName(data.name ?? "");
          setEmail(data.email ?? "");
          setHideRatings(Boolean(data.hideRatings));
          setAutoHideRatingsWhileStreaming(
            Boolean(data.autoHideRatingsWhileStreaming),
          );
          setMessageRequestPolicy(data.messageRequestPolicy ?? "EVERYONE");
          setEmotePrefixInput(data.emotePrefix || buildDefaultEmotePrefix(data.name));
          const loadedPrimaryRoles = Array.isArray(data.primaryRoles)
            ? data.primaryRoles
            : [];
          const loadedSecondaryRoles = Array.isArray(data.secondaryRoles)
            ? data.secondaryRoles
            : [];
          setPrimaryRoles(
            new Set(loadedPrimaryRoles.map((role: RoleType) => role.slug)),
          );
          setSecondaryRoles(
            new Set(loadedSecondaryRoles.map((role: RoleType) => role.slug)),
          );
        } else {
          setUser(undefined);
        }

        const rolesResponse = await getTeamRoles();

        if (rolesResponse.status == 200) {
          setRoles(await readArray<RoleType>(rolesResponse));
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
              <Text size="xl">{uiText("AppStrings.Loading")}</Text>
            </Hstack>
            <Text color="textFaded">{uiText("AppStrings.LoadingSettings")}</Text>
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
  const userPrimaryRoles = Array.isArray(user.primaryRoles)
    ? user.primaryRoles
    : [];
  const userSecondaryRoles = Array.isArray(user.secondaryRoles)
    ? user.secondaryRoles
    : [];

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

  const setsEqual = (a: Set<string>, b: Set<string>) =>
    a.size === b.size && Array.from(a).every((value) => b.has(value));

  const resetSettingsForm = () => {
    setProfilePicture(user.profilePicture ?? null);
    setBannerPicture(user.bannerPicture ?? null);
    setBio(user.bio ?? "");
    setShort(user.short ?? "");
    setName(user.name ?? "");
    setHideRatings(Boolean(user.hideRatings));
    setAutoHideRatingsWhileStreaming(
      Boolean(user.autoHideRatingsWhileStreaming),
    );
    setMessageRequestPolicy(user.messageRequestPolicy ?? "EVERYONE");
    setPrimaryRoles(
      new Set(userPrimaryRoles.map((role) => role.slug)),
    );
    setSecondaryRoles(
      new Set(userSecondaryRoles.map((role) => role.slug)),
    );
    setEmotePrefixInput(user.emotePrefix || buildDefaultEmotePrefix(user.name));
  };

  const hasUnsavedChanges =
    profilePicture !== (user.profilePicture ?? null) ||
    bannerPicture !== (user.bannerPicture ?? null) ||
    bio !== (user.bio ?? "") ||
    short !== (user.short ?? "") ||
    name !== (user.name ?? "") ||
    hideRatings !== Boolean(user.hideRatings) ||
    autoHideRatingsWhileStreaming !==
      Boolean(user.autoHideRatingsWhileStreaming) ||
    messageRequestPolicy !== (user.messageRequestPolicy ?? "EVERYONE") ||
    cleanedPrefixInput !== (user.emotePrefix || buildDefaultEmotePrefix(user.name)) ||
    !setsEqual(
      primaryRoles,
      new Set(userPrimaryRoles.map((role) => role.slug)),
    ) ||
    !setsEqual(
      secondaryRoles,
      new Set(userSecondaryRoles.map((role) => role.slug)),
    );

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
          `${BASE_URL}/users/search?q=${encodeURIComponent(query)}`,
          {
            headers: { authorization: `Bearer ${getCookie("token")}` },
            credentials: "include",
          },
        );
        if (!response.ok) return;
        const matches = unwrapArray<any>(await response.json());
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
          `${BASE_URL}/users/search?q=${encodeURIComponent(query)}`,
          {
            headers: { authorization: `Bearer ${getCookie("token")}` },
            credentials: "include",
          },
        );
        if (!response.ok) return;
        const matches = unwrapArray<any>(await response.json());
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
      `${BASE_URL}/image`,
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
      {/* App fields use this separate form so they never submit or validate the profile form. */}
      <form id={DEVELOPER_APP_FORM_ID} onSubmit={event => event.preventDefault()} />
      <Form
        className={`w-full max-w-6xl flex flex-col gap-4 ${
          hasUnsavedChanges ? "pb-48 sm:pb-32" : ""
        }`}
        style={{ "--editor-surface": colors.mantle, "--editor-text": colors.text, "--editor-accent": colors.blue } as CSSProperties}
        validationErrors={errors}
        onReset={resetSettingsForm}
        onSubmit={async (e) => {
          e.preventDefault();

          if (!name) {
            addToast({
              title: uiText("AppStrings.YouNeedToEnterAName"),
            });
            return;
          }

          if (
            cleanedPrefixInput &&
            (cleanedPrefixInput.length < MIN_EMOTE_PREFIX_LENGTH ||
              cleanedPrefixInput.length > MAX_EMOTE_PREFIX_LENGTH)
          ) {
            addToast({ title: uiText("AppStrings.EmotePrefixMustBe4To8Characters") });
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
            undefined,
            undefined,
            hideRatings,
            autoHideRatingsWhileStreaming,
            messageRequestPolicy,
          );

          if (response.ok) {
            addToast({ title: uiText("AppStrings.ChangedSettings") });
            const updatedUser = await readItem<UserType>(response);
            if (updatedUser) {
              setUser(updatedUser);
              setEmotePrefixInput(
                updatedUser.emotePrefix || buildDefaultEmotePrefix(updatedUser.name),
              );
            }
            setWaitingSave(false);
          } else {
            addToast({ title: uiText("AppStrings.FailedToUpdateSettings") });
            setWaitingSave(false);
          }
        }}
      >
        <header className="py-2 text-center">
          <h1
            className="text-3xl font-semibold"
            style={{
              color: colors["text"],
              textShadow:
                siteTheme.type === "Light"
                  ? "none"
                  : "0 1px 5px rgba(0, 0, 0, 0.75)",
            }}
          >
             {uiText("Navbar.Settings.Title")} </h1>
          <p
            className="mt-1 text-sm"
            style={{
              color: colors["text"],
              opacity: 0.82,
              textShadow:
                siteTheme.type === "Light"
                  ? "none"
                  : "0 1px 4px rgba(0, 0, 0, 0.8)",
            }}
          >
             {uiText("Navbar.Settings.Description")} </p>
        </header>

        <Tabs defaultIndex={Math.max(0, ["general", "notifications", "streams", "emotes", "tokens", "apps"].indexOf(new URLSearchParams(window.location.search).get("tab") ?? "general"))} className="[&>[role=tablist]]:justify-center">
          <Tab title={uiText("AppStrings.General")} icon="cog">
            <div className="form-editor-panel settings-editor-panel">
              <div className="game-editor-panel-heading">
                <Vstack align="start">
                  <Hstack>
                    <Icon name="cog" color="text" size={28} />
                    <Text size="2xl" color="text" weight="bold">
                      {uiText("AppStrings.General")}
                    </Text>
                  </Hstack>
                  <Text size="sm" color="textFaded">
                    {uiText("Settings.TabDescriptions.General")}
                  </Text>
                </Vstack>
              </div>

        <>
          <div className="game-editor-row">
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
                placeholder={uiText("CreateLeaderboard.Name.Placeholder")}
                type="text"
              />
            </Vstack>
          </div>

          <div className="game-editor-row">
            <Vstack align="start">
              <div>
                <Text color="text">Settings.Email.Title</Text>
                <Text color="textFaded" size="xs">
                  Settings.Email.Description
                </Text>
              </div>
              <Hstack gap={3} className="w-full min-w-0">
                <Button size="sm" className="shrink-0" onClick={() => setShowEmail(!showEmail)}>
                  {showEmail ? "Settings.Email.Hide" : "Settings.Email.Show"}
                </Button>
                {showEmail && (
                  <div className="min-w-0 flex-1">
                    <Input
                      value={email}
                      onValueChange={setEmail}
                      name="email"
                      placeholder={uiText("AppStrings.EnterAnEmail")}
                      type="text"
                      fullWidth
                    />
                  </div>
                )}
              </Hstack>
            </Vstack>
          </div>
        </>
        <div className="game-editor-row">
          <Vstack align="start" className="gap-3">
            <div>
              <Text color="text">{uiText("AppStrings.DirectMessageRequests")}</Text>
              <Text color="textFaded" size="xs">
                 {uiText("AppStrings.ChooseWhoCanSendYouTheOpeningMessageOfANewConversation")} </Text>
            </div>
            <Dropdown
              selectedValue={messageRequestPolicy}
              onSelect={(value) => setMessageRequestPolicy(value as typeof messageRequestPolicy)}
              triggerSize="sm"
            >
              <Dropdown.Item value="EVERYONE">{uiText("AppStrings.Everyone")}</Dropdown.Item>
              <Dropdown.Item value="FOLLOWING">{uiText("AppStrings.PeopleIFollow")}</Dropdown.Item>
              <Dropdown.Item value="NOBODY">{uiText("AppStrings.Nobody")}</Dropdown.Item>
            </Dropdown>
          </Vstack>
        </div>

        <div className="game-editor-row">
          <Vstack align="start">
            <div>
              <Text color="text">Settings.Bio.Title</Text>
              <Text color="textFaded" size="xs">
                Settings.Bio.Description
              </Text>
            </div>
            <Editor content={bio} setContent={setBio} format="markdown" />
          </Vstack>
        </div>

        <div className="game-editor-row">
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
              placeholder={uiText("AppStrings.EnterAShortBio")}
              maxLength={155}
            />
          </Vstack>
        </div>

        <div className="game-editor-block">
          <Hstack className="flex-wrap md:flex-nowrap">
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
                placeholder={uiText("AppStrings.Upload")}
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
                      title: uiText("AppStrings.ErrorUploadingImage"),
                    });
                  }
                }}
              />
              <Text size="sm" color="textFaded">
                 {uiText("AppStrings.OrChooseADefaultProfilePicture")} </Text>
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
                      alt={uiText("AppStrings.DefaultPfpValue0", { value0: index + 1 })}
                      className="h-full w-full rounded-full object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                  </button>
                ))}
              </div>
            </Vstack>
          </Hstack>
        </div>

        <div className="game-editor-block">
          <Hstack className="flex-wrap md:flex-nowrap">
            <Vstack align="start">
              <div>
                <Text color="text">Settings.BannerPicture.Title</Text>
                <Text color="textFaded" size="xs">
                  Settings.BannerPicture.Description
                </Text>
              </div>
              <ImageInput
                value={bannerPicture}
                width={880}
                height={80}
                className="settings-banner-input"
                placeholder={uiText("AppStrings.Upload")}
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
                      title: uiText("AppStrings.ErrorUploadingImage"),
                    });
                  }
                }}
              />
            </Vstack>

          </Hstack>
        </div>
        <>
          <div className="game-editor-row">
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
                      : uiText("AppStrings.NoRoles")}
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
          </div>

          <div className="game-editor-row">
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
                      : uiText("AppStrings.NoRoles")}
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
          </div>
        </>

            </div>
          </Tab>
          <Tab title={uiText("Settings.Notifications.Title")} icon="bell">
            <div className="form-editor-panel settings-editor-panel">
              <div className="game-editor-panel-heading">
                <Vstack align="start">
                  <Hstack>
                    <Icon name="bell" color="text" size={28} />
                    <Text size="2xl" color="text" weight="bold">
                      {uiText("Settings.Notifications.Title")}
                    </Text>
                  </Hstack>
                  <Text size="sm" color="textFaded">
                    {uiText("Settings.TabDescriptions.Notifications")}
                  </Text>
                </Vstack>
              </div>
              <NotificationSettingsSection />
            </div>
          </Tab>
          <Tab title={uiText("AppStrings.Streams")} icon="sitwitch">
            <div className="form-editor-panel settings-editor-panel">
              <div className="game-editor-panel-heading">
                <Vstack align="start">
                  <Hstack>
                    <Icon name="sitwitch" color="text" size={28} />
                    <Text size="2xl" color="text" weight="bold">
                      {uiText("AppStrings.Streams")}
                    </Text>
                  </Hstack>
                  <Text size="sm" color="textFaded">
                    {uiText("Settings.TabDescriptions.Streams")}
                  </Text>
                </Vstack>
              </div>

        <>
          <div className="game-editor-row">
            <TwitchConnection username={user.twitch} onDisconnected={() => {
              setUser((current) => current ? { ...current, twitch: "" } : current);
              setAutoHideRatingsWhileStreaming(false);
            }} />
          </div>

          <div className="game-editor-block">
            <Vstack align="start" className="gap-4">
              <Hstack align="start" className="w-full gap-3">
                <Switch
                  checked={hideRatings}
                  onChange={setHideRatings}
                  className="shrink-0 mt-1"
                />
                <Vstack align="start" gap={0} className="min-w-0 flex-1">
                  <Text color="text">{uiText("AppStrings.HideRatingsBehindButtons")}</Text>
                  <Text color="textFaded" size="xs">
                     {uiText("AppStrings.KeepRatingsHiddenUntilYouPressAButton")} </Text>
                </Vstack>
              </Hstack>

              <Hstack align="start" className="w-full gap-3">
                <Switch
                  checked={autoHideRatingsWhileStreaming}
                  onChange={setAutoHideRatingsWhileStreaming}
                  disabled={!user.twitch}
                  className="shrink-0 mt-1"
                />
                <Vstack align="start" gap={0} className="min-w-0 flex-1">
                  <Text color="text">{uiText("AppStrings.AutoHideWhileStreaming")}</Text>
                  <Text color="textFaded" size="xs">
                    {uiText("AppStrings.IfYourConnectedTwitchChannelIsLiveWith")
                      .split(/(`d2jam`)/g)
                      .map((part, index) => part === "`d2jam`" ? (
                        <Chip key={index} className="post-tag-chip">d2jam</Chip>
                      ) : part)}
                  </Text>
                </Vstack>
              </Hstack>
            </Vstack>
          </div>
        </>

            </div>
          </Tab>
          <Tab title={uiText("AppStrings.Emotes")} icon="smileplus">
            <div className="form-editor-panel settings-editor-panel">
              <div className="game-editor-panel-heading">
                <Vstack align="start">
                  <Hstack>
                    <Icon name="smileplus" color="text" size={28} />
                    <Text size="2xl" color="text" weight="bold">
                      {uiText("AppStrings.Emotes")}
                    </Text>
                  </Hstack>
                  <Text size="sm" color="textFaded">
                    {uiText("Settings.TabDescriptions.Emotes")}
                  </Text>
                </Vstack>
              </div>
        <div className="game-editor-row">
            <Vstack align="start">
              <div><Text color="text">{uiText("AppStrings.EmotePrefix")}</Text></div>
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
                placeholder={uiText("AppStrings.EGAbc123")}
                maxLength={MAX_EMOTE_PREFIX_LENGTH}
              />
            </Vstack>
        </div>
        <div className="game-editor-block">
          <Vstack align="start" className="gap-3">
            <div>
              <Text color="text">{uiText("AppStrings.UserEmotes")}</Text>
              <Text color="textFaded" size="xs">
                 {uiText("AppStrings.YourEmotesUseThePrefix")}{" "}
                <span className="font-semibold">{emotePrefix}</span>.
              </Text>
              <Text color="textFaded" size="sm">
                 {uiText("AppStrings.OnlyUploadEmotesYouHaveTheLicenseTo")} </Text>
            </div>

            <Button icon="plus" onClick={() => setAddingEmote(true)}>{uiText("AppStrings.AddEmote")}</Button>
            <Modal isOpen={addingEmote} onOpenChange={open => { if (!open && !savingEmote) { setAddingEmote(false); setEmoteArtistOpen(false); } }} size="2xl">
              <ModalContent>
                <ModalHeader className="pr-14 text-lg font-semibold">{uiText("AppStrings.AddEmote")}</ModalHeader>
                <ModalBody className="max-h-[65dvh] overflow-y-auto">
                  <div className="mb-5 flex items-center gap-3 rounded-lg border p-4" style={{ borderColor: `color-mix(in srgb, ${colors.text} 5%, ${colors.mantle})` }}>
                    {emoteImage ? <img src={emoteImage} alt={uiText("AppStrings.EmotePreview")} className="h-12 w-12 object-contain" /> : <Icon name="smileplus" size={32} />}
                    <div><Text size="xs" color="textFaded">{uiText("AppStrings.Preview")}</Text><Text size="sm">:{emotePrefix}{cleanedEmoteSlug || uiText("AppStrings.Emote")}:</Text></div>
                  </div>
            <Hstack className="items-end flex-wrap">
              <Input
                label={uiText("AppStrings.EmoteSlug")}
                labelPlacement="outside"
                placeholder={uiText("AppStrings.Smile")}
                value={emoteSlug}
                onValueChange={setEmoteSlug}
              />
              <div className="relative">
                <Input
                  label={uiText("AppStrings.ArtistUserSlug")}
                  labelPlacement="outside"
                  placeholder={uiText("AppStrings.Username2")}
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
                   {uiText("AppStrings.UploadImage")} </Text>
                <ImageInput
                  value={emoteImage}
                  width={80}
                  height={80}
                  placeholder={uiText("AppStrings.Upload")}
                  onSelect={async (file, crop) => {
                    try {
                      const data = await uploadImage(file, crop);
                      setEmoteImage(data.data);
                      addToast({ title: data.message });
                    } catch (error) {
                      console.error(error);
                      addToast({ title: uiText("AppStrings.ErrorUploadingImage") });
                    }
                  }}
                />
              </Vstack>
            </Hstack>
                </ModalBody>
                <ModalFooter>
                  <Button variant="ghost" disabled={savingEmote} onClick={() => { setAddingEmote(false); setEmoteArtistOpen(false); }}>{uiText("AppStrings.Cancel")}</Button>
              <Button
                color="blue"
                loading={savingEmote}
                onClick={async () => {
                  if (!cleanedEmoteSlug || !emoteImage) {
                    addToast({ title: uiText("AppStrings.SlugAndImageAreRequired") });
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
                        title: data?.message ?? uiText("AppStrings.FailedToAddEmote"),
                      });
                      return;
                    }
                    addToast({ title: uiText("AppStrings.EmoteAdded") });
                    setEmoteSlug("");
                    setEmoteImage(null);
                    setEmoteArtistSlug("");
                    setAddingEmote(false);
                    setEmoteArtistOpen(false);
                    await refreshEmojis();
                  } catch (error) {
                    console.error(error);
                    addToast({ title: uiText("AppStrings.FailedToAddEmote") });
                  } finally {
                    setSavingEmote(false);
                  }
                }}
              >
                 {uiText("AppStrings.AddEmote")} </Button>
                </ModalFooter>
              </ModalContent>
            </Modal>

            {userEmotes.length === 0 ? (
              <Text size="sm" color="textFaded">
                 {uiText("AppStrings.NoUserEmotesYet")} </Text>
            ) : (
              <div className="w-full">
                {userEmotes.map((emoji) => (
                  <div
                    key={emoji.id}
                    className="flex flex-wrap items-center gap-3 border-b py-4 last:border-b-0"
                    style={{ borderColor: `color-mix(in srgb, ${colors.text} 5%, ${colors.mantle})` }}
                  >
                    <img
                      src={emoji.image}
                      alt={uiText("AppStrings.Value03", { value0: emoji.slug })}
                      className="h-6 w-6"
                      loading="lazy"
                      decoding="async"
                    />
                    <div className="min-w-0 flex-1"><Text size="sm">:{emoji.slug}:</Text>{emoji.artistUser && <Text size="xs" color="textFaded">{emoji.artistUser.name || emoji.artistUser.slug}</Text>}</div>
                    <Button
                      size="sm"
                      variant="ghost"
                      icon="pencil"
                      onClick={() => {
                        setEditingEmoteId(emoji.id);
                        setEditingEmoteSlug(
                          emoji.slug.replace(emotePrefix, ""),
                        );
                        setEditingEmoteImage(emoji.image);
                        setEditingEmoteArtistSlug(emoji.artistUser?.slug ?? "");
                      }}
                    >
                       {uiText("AppStrings.PreviewEdit")} </Button>
                    <Button
                      size="sm"
                      color="red"
                      variant="ghost"
                      onClick={async () => {
                        const response = await deleteEmoji(emoji.id);
                        const data = await response.json().catch(() => null);
                        if (!response.ok) {
                          addToast({
                            title: data?.message ?? uiText("AppStrings.FailedToDeleteEmote"),
                          });
                          return;
                        }
                        addToast({ title: data?.message ?? uiText("AppStrings.EmoteDeleted") });
                        await refreshEmojis();
                      }}
                    >
                       {uiText("PostCard.Remove.Title")} </Button>
                  </div>
                ))}
              </div>
            )}
            {editingEmoteId && (
              <Modal isOpen onOpenChange={open => { if (!open && !savingEditEmote) { setEditingEmoteId(null); setEditEmoteArtistOpen(false); } }} size="2xl">
                <ModalContent>
                  <ModalHeader className="pr-14 text-lg font-semibold">{uiText("AppStrings.EditEmote")}</ModalHeader>
                  <ModalBody className="max-h-[65dvh] overflow-y-auto">
                  <div className="mb-5 flex items-center gap-3 rounded-lg border p-4" style={{ borderColor: `color-mix(in srgb, ${colors.text} 5%, ${colors.mantle})` }}>
                    {editingEmoteImage ? <img src={editingEmoteImage} alt={uiText("AppStrings.EmotePreview")} className="h-12 w-12 object-contain" /> : <Icon name="smileplus" size={32} />}
                    <div><Text size="xs" color="textFaded">{uiText("AppStrings.Preview")}</Text><Text size="sm">:{emotePrefix}{cleanedEditingEmoteSlug || uiText("AppStrings.Emote")}:</Text></div>
                  </div>

                  <Hstack className="items-end flex-wrap">
                    <Input
                      label={uiText("AppStrings.EmoteSlug")}
                      labelPlacement="outside"
                      placeholder={uiText("AppStrings.Smile")}
                      value={editingEmoteSlug}
                      onValueChange={setEditingEmoteSlug}
                    />
                    <div className="relative">
                      <Input
                        label={uiText("AppStrings.ArtistUserSlug")}
                        labelPlacement="outside"
                        placeholder={uiText("AppStrings.Username2")}
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
                         {uiText("AppStrings.UploadImage")} </Text>
                      <ImageInput
                        value={editingEmoteImage}
                        width={80}
                        height={80}
                        placeholder={uiText("AppStrings.Upload")}
                        onSelect={async (file, crop) => {
                          try {
                            const data = await uploadImage(file, crop);
                            setEditingEmoteImage(data.data);
                            addToast({ title: data.message });
                          } catch (error) {
                            console.error(error);
                            addToast({ title: uiText("AppStrings.ErrorUploadingImage") });
                          }
                        }}
                      />
                    </Vstack>
                  </Hstack>
                  </ModalBody>
                  <ModalFooter>
                      <Button
                        variant="ghost"
                        disabled={savingEditEmote}
                        onClick={() => {
                          setEditingEmoteId(null);
                          setEditingEmoteSlug("");
                          setEditingEmoteImage(null);
                          setEditingEmoteArtistSlug("");
                        }}
                      >
                         {uiText("AppStrings.Cancel")} </Button>
                      <Button
                        color="blue"
                        loading={savingEditEmote}
                        onClick={async () => {
                          if (!editingEmoteId) return;
                          if (!cleanedEditingEmoteSlug || !editingEmoteImage) {
                            addToast({ title: uiText("AppStrings.SlugAndImageAreRequired") });
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
                                  data?.message ?? uiText("AppStrings.FailedToUpdateEmote"),
                              });
                              return;
                            }
                            addToast({ title: uiText("AppStrings.EmoteUpdated") });
                            setEditingEmoteId(null);
                            setEditingEmoteSlug("");
                            setEditingEmoteImage(null);
                            setEditingEmoteArtistSlug("");
                            await refreshEmojis();
                          } catch (error) {
                            console.error(error);
                            addToast({ title: uiText("AppStrings.FailedToUpdateEmote") });
                          } finally {
                            setSavingEditEmote(false);
                          }
                        }}
                      >
                         {uiText("Settings.Save.Title")} </Button>
                  </ModalFooter>
                </ModalContent>
              </Modal>
            )}
          </Vstack>
        </div>

        <div className="game-editor-block">
          <StickerManager
            scope="USER"
            scopeId={user.id}
            prefix={emotePrefix}
          />
        </div>

            </div>
          </Tab>
          <Tab title={uiText("AppStrings.Tokens")} icon="monitor">
            <div className="form-editor-panel settings-editor-panel">
              <div className="game-editor-panel-heading">
                <Vstack align="start">
                  <Hstack>
                    <Icon name="monitor" color="text" size={28} />
                    <Text size="2xl" color="text" weight="bold">
                      {uiText("AppStrings.Tokens")}
                    </Text>
                  </Hstack>
                  <Text size="sm" color="textFaded">
                    {uiText("Settings.TabDescriptions.Tokens")}
                  </Text>
                </Vstack>
              </div>
              <GameTokensSection flat />
              <ConnectedAppsSection />
            </div>
          </Tab>
          <Tab title="Your apps" icon="code">
            <DeveloperAppsSection />
          </Tab>
        </Tabs>

        {hasUnsavedChanges && (
          <EditorFooter
            floating={hasUnsavedChanges}
            status={uiText("AppStrings.UnsavedChanges")}
            description={waitingSave ? uiText("AppStrings.Saving") : uiText("AppStrings.SaveYourChangesBeforeLeavingThisPage")}
          >
            {waitingSave ? (
              <Spinner />
            ) : (
              <>
                <Button type="submit" variant="ghost" size="sm" icon="save" style={{ color: colors.blue }} disabled={!hasUnsavedChanges}>
                  {uiText("Settings.Save.Title")}
                </Button>
                <Button type="reset" variant="ghost" size="sm" icon="rotateccw" disabled={!hasUnsavedChanges}>
                  {uiText("AppStrings.Cancel")}
                </Button>
              </>
            )}
          </EditorFooter>
        )}
      </Form>
    </div>
  );
}
