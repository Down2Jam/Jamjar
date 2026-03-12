"use client";

import Editor from "@/components/editor";
import {
  licenseFlagsToLabel,
  licenseModeForFlags,
  LicenseFlags,
  LicenseMode,
  parseLicenseFlags,
  SINGLE_TRACK_TAG_CATEGORIES,
  TRACK_CREDIT_ROLE_OPTIONS,
  TRACK_TAG_CATEGORY_HELPERS,
} from "@/components/tracks/editingShared";
import { searchUsers } from "@/requests/user";
import { getTrackFlags, getTrackTags, updateTrack } from "@/requests/track";
import { useTheme } from "@/providers/SiteThemeProvider";
import { TrackFlagType } from "@/types/TrackFlagType";
import { TrackTagType } from "@/types/TrackTagType";
import { TrackType } from "@/types/TrackType";
import { UserType } from "@/types/UserType";
import {
  addToast,
  Avatar,
  Button,
  Card,
  Hstack,
  Input,
  Switch,
  Text,
  Vstack,
  Dropdown,
} from "bioloom-ui";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Select, { StylesConfig } from "react-select";

type CreditDraft = {
  id: string;
  role: string;
  userId: number;
  user: Pick<UserType, "id" | "slug" | "name" | "profilePicture" | "short">;
};

type LinkDraft = {
  id: string;
  label: string;
  url: string;
};

export default function TrackEditingForm({ track }: { track: TrackType }) {
  const router = useRouter();
  const { colors } = useTheme();
  const menuPortalTarget =
    typeof document === "undefined" ? undefined : document.body;
  const [name, setName] = useState(track.name);
  const [commentary, setCommentary] = useState(track.commentary ?? "");
  const [bpm, setBpm] = useState(track.bpm ? String(track.bpm) : "");
  const [musicalKey, setMusicalKey] = useState(track.musicalKey ?? "");
  const [softwareUsed, setSoftwareUsed] = useState(
    (track.softwareUsed ?? []).join(", "),
  );
  const [allowDownload, setAllowDownload] = useState(Boolean(track.allowDownload));
  const [licenseFlags, setLicenseFlags] = useState<LicenseFlags>(
    parseLicenseFlags(track.license),
  );
  const [links, setLinks] = useState<LinkDraft[]>(
    (track.links ?? []).map((link) => ({
      id: String(link.id),
      label: link.label,
      url: link.url,
    })),
  );
  const [credits, setCredits] = useState<CreditDraft[]>(
    (track.credits?.length
      ? track.credits
      : track.composer
        ? [
            {
              id: -1,
              role: "Composer",
              userId: track.composer.id,
              user: track.composer,
            },
          ]
        : []
    ).map((credit, index) => ({
      id: `${credit.id}-${index}`,
      role: credit.role,
      userId: credit.userId,
      user: credit.user,
    })),
  );
  const [trackTags, setTrackTags] = useState<TrackTagType[]>([]);
  const [trackFlags, setTrackFlags] = useState<TrackFlagType[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>(
    (track.tags ?? []).map((tag) => tag.id),
  );
  const [selectedFlagIds, setSelectedFlagIds] = useState<number[]>(
    (track.flags ?? []).map((flag) => flag.id),
  );
  const [creditQuery, setCreditQuery] = useState("");
  const [creditMatches, setCreditMatches] = useState<UserType[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void (async () => {
      const [tagsResponse, flagsResponse] = await Promise.all([
        getTrackTags(),
        getTrackFlags(),
      ]);
      const tagsData = await tagsResponse.json().catch(() => null);
      const flagsData = await flagsResponse.json().catch(() => null);
      setTrackTags(Array.isArray(tagsData?.data) ? tagsData.data : []);
      setTrackFlags(
        Array.isArray(flagsData?.data)
          ? flagsData.data.filter(
              (flag: TrackFlagType) => flag.name === "Explicit Lyrics",
            )
          : [],
      );
    })();
  }, []);

  const tagsByCategory = useMemo(() => {
    const grouped = new Map<string, TrackTagType[]>();
    trackTags.forEach((tag) => {
      const category = tag.category?.name;
      if (!category) return;
      if (!grouped.has(category)) grouped.set(category, []);
      grouped.get(category)!.push(tag);
    });
    return grouped;
  }, [trackTags]);
  const trackTagCategories = useMemo(
    () =>
      Array.from(tagsByCategory.keys()).sort((a, b) => {
        const aPriority =
          tagsByCategory.get(a)?.[0]?.category?.priority ?? 0;
        const bPriority =
          tagsByCategory.get(b)?.[0]?.category?.priority ?? 0;
        return bPriority - aPriority || a.localeCompare(b);
      }),
    [tagsByCategory],
  );
  const selectStyles: StylesConfig<
    {
      value: string;
      id: number;
      label: string;
    },
    boolean
  > = {
    multiValue: (base) => ({
      ...base,
      backgroundColor: "#444",
    }),
    multiValueLabel: (base) => ({
      ...base,
      color: "#fff",
      fontWeight: "bold",
      paddingRight: "2px",
    }),
    multiValueRemove: (base) => ({
      ...base,
      display: "flex",
      color: "#ddd",
    }),
    control: (base) => ({
      ...base,
      backgroundColor: "#181818",
      minWidth: "300px",
    }),
    menu: (base) => ({
      ...base,
      backgroundColor: "#181818",
      color: "#fff",
      zIndex: 100,
    }),
    menuPortal: (base) => ({
      ...base,
      zIndex: 120,
    }),
    option: (base, { isFocused }) => ({
      ...base,
      backgroundColor: isFocused ? "#333" : undefined,
    }),
  };
  const licenseMode = licenseModeForFlags(licenseFlags);

  const handleCreditSearch = async (value: string) => {
    setCreditQuery(value);
    if (!value.trim()) {
      setCreditMatches([]);
      return;
    }
    try {
      const response = await searchUsers(value);
      if (response.status === 200) {
        const data = await response.json();
        const matches = Array.isArray(data) ? data : (data?.data ?? []);
        setCreditMatches(matches.slice(0, 6));
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Vstack className="p-4" align="stretch">
      <Card>
        <Vstack align="start" className="gap-2">
          <Text size="xl" color="text" weight="semibold">
            Edit Track
          </Text>
          <Text size="sm" color="textFaded">
            Update the track page metadata, credits, and discovery info.
          </Text>
        </Vstack>
      </Card>

      <Card>
        <Vstack align="start" className="gap-3">
          <div className="w-full">
            <Text color="text">Track Name</Text>
            <Text color="textFaded" size="xs">
              The displayed name for this track.
            </Text>
          </div>
          <Input value={name} onValueChange={setName} />

          <div className="w-full">
            <Text color="text">Commentary</Text>
            <Text color="textFaded" size="xs">
              Notes, context, or production details for the track page.
            </Text>
          </div>
          <Editor content={commentary} setContent={setCommentary} format="markdown" />

          <Hstack className="w-full items-start gap-3">
            <Vstack align="start" className="w-full gap-2">
              <div className="w-full">
                <Text color="text">BPM</Text>
                <Text color="textFaded" size="xs">
                  Optional tempo metadata.
                </Text>
              </div>
              <Input value={bpm} onValueChange={setBpm} type="number" />
            </Vstack>
            <Vstack align="start" className="w-full gap-2">
              <div className="w-full">
                <Text color="text">Key</Text>
                <Text color="textFaded" size="xs">
                  Optional musical key.
                </Text>
              </div>
              <Input value={musicalKey} onValueChange={setMusicalKey} />
            </Vstack>
          </Hstack>

          <div className="w-full">
            <Text color="text">Software Used</Text>
            <Text color="textFaded" size="xs">
              Comma-separated list, e.g. Ableton, Famitracker.
            </Text>
          </div>
          <Input value={softwareUsed} onValueChange={setSoftwareUsed} />

          <div className="w-full">
            <Text color="text">Credits</Text>
            <Text color="textFaded" size="xs">
              The people who made this song (linked to accounts on the site)
            </Text>
          </div>
          <Input
            placeholder="Search users..."
            value={creditQuery}
            onValueChange={handleCreditSearch}
          />
          {creditMatches.length > 0 && (
            <Card className="w-full">
              <Vstack align="stretch">
                {creditMatches.map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    className="flex items-center justify-between rounded-lg p-3 text-left transition-colors"
                    style={{ backgroundColor: colors["mantle"] }}
                    onClick={() => {
                      if (credits.some((credit) => credit.userId === user.id)) {
                        setCreditQuery("");
                        setCreditMatches([]);
                        return;
                      }
                      setCredits((prev) => [
                        ...prev,
                        {
                          id: `${user.id}-${Date.now()}`,
                          role: prev.length === 0 ? "Composer" : "Arranger",
                          userId: user.id,
                          user,
                        },
                      ]);
                      setCreditQuery("");
                      setCreditMatches([]);
                    }}
                  >
                    <Hstack>
                      <Avatar src={user.profilePicture} />
                      <Vstack gap={0} align="start">
                        <Text>{user.name}</Text>
                        <Text color="textFaded" size="xs">
                          {user.short || "General.NoDescription"}
                        </Text>
                      </Vstack>
                    </Hstack>
                  </button>
                ))}
              </Vstack>
            </Card>
          )}
          <Vstack align="stretch" className="w-full gap-3">
            {credits.map((credit) => (
              <Card key={credit.id}>
                <Vstack align="start" className="gap-2">
                  <Hstack className="w-full justify-between">
                    <Hstack>
                      <Avatar src={credit.user.profilePicture} />
                      <Text>{credit.user.name}</Text>
                    </Hstack>
                    <Button
                      size="sm"
                      color="red"
                      icon="trash"
                      onClick={() =>
                        setCredits((prev) => prev.filter((cur) => cur.id !== credit.id))
                      }
                    />
                  </Hstack>
                  <Dropdown
                    selectedValue={credit.role}
                    onSelect={(value) =>
                      setCredits((prev) =>
                        prev.map((cur) =>
                          cur.id === credit.id
                            ? { ...cur, role: String(value ?? "") }
                            : cur,
                        ),
                      )
                    }
                    placeholder="Role"
                  >
                    {TRACK_CREDIT_ROLE_OPTIONS.map((role) => (
                      <Dropdown.Item key={role} value={role}>
                        {role}
                      </Dropdown.Item>
                    ))}
                  </Dropdown>
                </Vstack>
              </Card>
            ))}
          </Vstack>

          <div className="w-full">
            <Text color="text">Track Tags</Text>
            <Text color="textFaded" size="xs">
              Help listeners find this track by genre, mood, use case, and
              looping.
            </Text>
          </div>
          <Vstack align="stretch" className="w-full gap-3">
            {trackTagCategories.map((categoryName) => {
              const categoryTags = tagsByCategory.get(categoryName) ?? [];
              const selectedCategoryTags = categoryTags.filter((tag) =>
                selectedTagIds.includes(tag.id),
              );
              const isSingleCategory =
                SINGLE_TRACK_TAG_CATEGORIES.has(categoryName);

              return (
                <div key={categoryName} className="w-full">
                  <Text color="text" size="sm">
                    {categoryName}
                  </Text>
                  <Text color="textFaded" size="xs">
                    {TRACK_TAG_CATEGORY_HELPERS[categoryName] ??
                      (isSingleCategory ? "Choose one" : "Choose any that fit")}
                  </Text>
                  {isSingleCategory ? (
                    <Select
                      styles={selectStyles}
                      menuPortalTarget={menuPortalTarget}
                      menuPosition="fixed"
                      isClearable
                      onChange={(value) => {
                        const nextIds =
                          value && "id" in value ? [value.id] : [];
                        setSelectedTagIds((prev) => {
                          const preservedIds = prev.filter(
                            (id) =>
                              !categoryTags.some(
                                (categoryTag) => categoryTag.id === id,
                              ),
                          );

                          return [...preservedIds, ...nextIds];
                        });
                      }}
                      value={(() => {
                        const selected = selectedCategoryTags[0];
                        return selected
                          ? {
                              value: selected.name,
                              id: selected.id,
                              label: selected.name,
                            }
                          : null;
                      })()}
                      options={categoryTags.map((tag) => ({
                        value: tag.name,
                        id: tag.id,
                        label: tag.name,
                      }))}
                    />
                  ) : (
                    <Select
                      styles={selectStyles}
                      menuPortalTarget={menuPortalTarget}
                      menuPosition="fixed"
                      isMulti
                      isClearable
                      onChange={(value) => {
                        const nextIds = value.map((item) => item.id);
                        setSelectedTagIds((prev) => {
                          const preservedIds = prev.filter(
                            (id) =>
                              !categoryTags.some(
                                (categoryTag) => categoryTag.id === id,
                              ),
                          );

                          return [...preservedIds, ...nextIds];
                        });
                      }}
                      value={selectedCategoryTags.map((tag) => ({
                        value: tag.name,
                        id: tag.id,
                        label: tag.name,
                      }))}
                      options={categoryTags.map((tag) => ({
                        value: tag.name,
                        id: tag.id,
                        label: tag.name,
                      }))}
                    />
                  )}
                </div>
              );
            })}
          </Vstack>

          {trackFlags.length > 0 && (
            <>
              <div className="w-full">
                <Text color="text">Flags</Text>
                <Text color="textFaded" size="xs">
                  Additional listener warnings or notes.
                </Text>
              </div>
              <Select
                styles={selectStyles}
                menuPortalTarget={menuPortalTarget}
                menuPosition="fixed"
                isMulti
                isClearable
                onChange={(value) => setSelectedFlagIds(value.map((item) => item.id))}
                value={trackFlags
                  .filter((flag) => selectedFlagIds.includes(flag.id))
                  .map((flag) => ({
                    value: flag.name,
                    id: flag.id,
                    label: flag.name,
                  }))}
                options={trackFlags.map((flag) => ({
                  value: flag.name,
                  id: flag.id,
                  label: flag.name,
                }))}
              />
            </>
          )}

          <div className="w-full">
            <Text color="text">Links</Text>
            <Text color="textFaded" size="xs">
              External links related to this track.
            </Text>
          </div>
          <Vstack align="stretch" className="w-full gap-3">
            {links.map((link) => (
              <Card key={link.id}>
                <Vstack align="start" className="gap-2">
                  <Input
                    value={link.label}
                    onValueChange={(value) =>
                      setLinks((prev) =>
                        prev.map((cur) =>
                          cur.id === link.id ? { ...cur, label: value } : cur,
                        ),
                      )
                    }
                    placeholder="Label"
                  />
                  <Input
                    value={link.url}
                    onValueChange={(value) =>
                      setLinks((prev) =>
                        prev.map((cur) =>
                          cur.id === link.id ? { ...cur, url: value } : cur,
                        ),
                      )
                    }
                    placeholder="https://..."
                  />
                  <Button
                    size="sm"
                    color="red"
                    icon="trash"
                    onClick={() =>
                      setLinks((prev) => prev.filter((cur) => cur.id !== link.id))
                    }
                  >
                    Remove Link
                  </Button>
                </Vstack>
              </Card>
            ))}
            <Button
              size="sm"
              icon="plus"
              onClick={() =>
                setLinks((prev) => [
                  ...prev,
                  { id: String(Date.now()), label: "", url: "" },
                ])
              }
            >
              Add Link
            </Button>
          </Vstack>

          <Hstack className="w-full items-center gap-3">
            <Switch
              checked={licenseMode === "ARR" ? allowDownload : true}
              onChange={setAllowDownload}
              disabled={licenseMode !== "ARR"}
            />
            <Vstack align="start" gap={0}>
              <Text size="sm">Allow downloads</Text>
              <Text size="xs" color="textFaded">
                Let listeners download this track.
              </Text>
            </Vstack>
          </Hstack>

          <div className="w-full">
            <Text color="text">License</Text>
            <Text color="textFaded" size="xs">
              Choose how others can use this track.
            </Text>
          </div>
          <Dropdown
            selectedValue={licenseMode}
            onSelect={(value) => {
              const mode = value as LicenseMode;
              if (mode === "ARR") {
                setLicenseFlags({
                  attribution: false,
                  commercial: false,
                  derivatives: false,
                  shareAlike: false,
                });
                setAllowDownload(false);
                return;
              }
              if (mode === "CC0") {
                setLicenseFlags({
                  attribution: false,
                  commercial: true,
                  derivatives: true,
                  shareAlike: false,
                });
                setAllowDownload(true);
                return;
              }
              setLicenseFlags({
                attribution: true,
                commercial: true,
                derivatives: true,
                shareAlike: false,
              });
              setAllowDownload(true);
            }}
          >
            <Dropdown.Item
              value="ARR"
              description="No reuse permissions granted."
            >
              All rights reserved
            </Dropdown.Item>
            <Dropdown.Item
              value="CC0"
              description="Public domain style release with no attribution required."
            >
              CC0
            </Dropdown.Item>
            <Dropdown.Item
              value="CC_BY"
              description="Creative Commons with attribution and configurable restrictions."
            >
              CC BY-based
            </Dropdown.Item>
          </Dropdown>
          <Text size="xs" color="textFaded">
            License applied: {licenseFlagsToLabel(licenseFlags)}
          </Text>

          <Hstack className="w-full justify-between">
            <Button href={`/m/${track.slug}`} variant="ghost">
              Cancel
            </Button>
            <Button
              color="green"
              loading={saving}
              onClick={async () => {
                if (!name.trim()) {
                  addToast({ title: "Track name is required" });
                  return;
                }
                if (credits.length === 0) {
                  addToast({ title: "Add at least one credited person" });
                  return;
                }
                try {
                  setSaving(true);
                  const response = await updateTrack(track.slug, {
                    name: name.trim(),
                    commentary,
                    bpm: bpm.trim() ? Number(bpm) : null,
                    musicalKey: musicalKey.trim() || null,
                    softwareUsed: softwareUsed
                      .split(",")
                      .map((value) => value.trim())
                      .filter(Boolean),
                    allowDownload,
                    license: licenseFlagsToLabel(licenseFlags),
                    tagIds: selectedTagIds,
                    flagIds: selectedFlagIds,
                    links: links
                      .map((link) => ({
                        label: link.label.trim(),
                        url: link.url.trim(),
                      }))
                      .filter((link) => link.label && link.url),
                    credits: credits.map((credit) => ({
                      role: credit.role,
                      userId: credit.userId,
                    })),
                  });
                  const payload = await response.json().catch(() => null);
                  if (!response.ok) {
                    addToast({
                      title: payload?.message ?? "Failed to update track",
                    });
                    return;
                  }
                  router.push(`/m/${track.slug}`);
                } finally {
                  setSaving(false);
                }
              }}
            >
              Save Track
            </Button>
          </Hstack>
        </Vstack>
      </Card>
    </Vstack>
  );
}
