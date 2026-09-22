import { translateSystemLabel } from "@/helpers/systemLabels";
"use client";

import { useTranslations as useUiTranslations } from "@/compat/next-intl";


import Editor from "@/components/editor";
import {
  backgroundUsageAttributionAllowedByDefault,
  backgroundUsageAttributionWithLicenseDefaults,
  backgroundUsageAllowedByDefault,
  backgroundUsageRequiredByLicense,
  backgroundUsageWithLicenseDefaults,
  licenseFlagsToCode,
  licenseModeForFlags,
  LicenseFlags,
  LicenseMode,
  parseLicenseFlags,
  SINGLE_TRACK_TAG_CATEGORIES,
  TRACK_CREDIT_ROLE_OPTIONS,
  TRACK_TAG_CATEGORY_HELPERS,
} from "@/components/tracks/editingShared";
import TrackLicenseLink from "@/components/tracks/TrackLicenseLink";
import { searchUsers } from "@/requests/user";
import { getTrackFlags, getTrackTags, updateTrack } from "@/requests/track";
import { useTheme } from "@/providers/useSiteTheme";
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
import { useRouter } from "@/compat/next-navigation";
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
  const uiText = useUiTranslations();
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
  const [allowDownload, setAllowDownload] = useState(
    Boolean(track.allowDownload),
  );
  const [licenseFlags, setLicenseFlags] = useState<LicenseFlags>(() =>
    parseLicenseFlags(track.license),
  );
  const [allowBackgroundUse, setAllowBackgroundUse] = useState(() => {
    const flags = parseLicenseFlags(track.license);
    return track.allowBackgroundUse ?? backgroundUsageAllowedByDefault(flags);
  });
  const [allowBackgroundUseAttribution, setAllowBackgroundUseAttribution] =
    useState(() => {
      const flags = parseLicenseFlags(track.license);
      return (
        track.allowBackgroundUseAttribution ??
        backgroundUsageAttributionAllowedByDefault(flags)
      );
    });
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
        const aPriority = tagsByCategory.get(a)?.[0]?.category?.priority ?? 0;
        const bPriority = tagsByCategory.get(b)?.[0]?.category?.priority ?? 0;
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
  const backgroundUsageRequired =
    backgroundUsageRequiredByLicense(licenseFlags);
  const backgroundUsageEnabled = backgroundUsageRequired
    ? true
    : allowBackgroundUse;
  const downloadRequired = licenseMode !== "ARR" || backgroundUsageEnabled;

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
             {uiText("AppStrings.EditTrack")} </Text>
          <Text size="sm" color="textFaded">
             {uiText("AppStrings.UpdateTheTrackPageMetadataCreditsAndDiscovery")} </Text>
        </Vstack>
      </Card>

      <Card>
        <Vstack align="start" className="gap-3">
          <div className="w-full">
            <Text color="text">{uiText("AppStrings.TrackName")}</Text>
            <Text color="textFaded" size="xs">
               {uiText("AppStrings.TheDisplayedNameForThisTrack")} </Text>
          </div>
          <Input value={name} onValueChange={setName} />

          <div className="w-full">
            <Text color="text">{uiText("AppStrings.Commentary")}</Text>
            <Text color="textFaded" size="xs">
               {uiText("AppStrings.NotesContextOrProductionDetailsForTheTrack")} </Text>
          </div>
          <Editor
            content={commentary}
            setContent={setCommentary}
            format="markdown"
          />

          <Hstack className="w-full items-start gap-3">
            <Vstack align="start" className="w-full gap-2">
              <div className="w-full">
                <Text color="text">{uiText("AppStrings.BPM2")}</Text>
                <Text color="textFaded" size="xs">
                   {uiText("AppStrings.OptionalTempoMetadata")} </Text>
              </div>
              <Input value={bpm} onValueChange={setBpm} type="number" />
            </Vstack>
            <Vstack align="start" className="w-full gap-2">
              <div className="w-full">
                <Text color="text">{uiText("AppStrings.Key")}</Text>
                <Text color="textFaded" size="xs">
                   {uiText("AppStrings.OptionalMusicalKey")} </Text>
              </div>
              <Input value={musicalKey} onValueChange={setMusicalKey} />
            </Vstack>
          </Hstack>

          <div className="w-full">
            <Text color="text">{uiText("AppStrings.SoftwareUsed")}</Text>
            <Text color="textFaded" size="xs">
               {uiText("AppStrings.CommaSeparatedListEGAbletonFamitracker")} </Text>
          </div>
          <Input value={softwareUsed} onValueChange={setSoftwareUsed} />

          <div className="w-full">
            <Text color="text">{uiText("AppStrings.Credits")}</Text>
            <Text color="textFaded" size="xs">
               {uiText("AppStrings.ThePeopleWhoMadeThisSongLinkedTo")} </Text>
          </div>
          <Input
            placeholder={uiText("AppStrings.SearchUsers")}
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
                        setCredits((prev) =>
                          prev.filter((cur) => cur.id !== credit.id),
                        )
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
                    placeholder={uiText("AppStrings.Role")}
                  >
                    {TRACK_CREDIT_ROLE_OPTIONS.map((role) => (
                      <Dropdown.Item key={role} value={role}>
                        {translateSystemLabel(role, uiText)}
                      </Dropdown.Item>
                    ))}
                  </Dropdown>
                </Vstack>
              </Card>
            ))}
          </Vstack>

          <div className="w-full">
            <Text color="text">{uiText("AppStrings.TrackTags")}</Text>
            <Text color="textFaded" size="xs">
               {uiText("AppStrings.HelpListenersFindThisTrackByGenreMood")} </Text>
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
                    {translateSystemLabel(categoryName, uiText)}
                  </Text>
                  <Text color="textFaded" size="xs">
                    {TRACK_TAG_CATEGORY_HELPERS[categoryName] ? uiText(TRACK_TAG_CATEGORY_HELPERS[categoryName]) :
                      (isSingleCategory ? uiText("AppStrings.ChooseOne") : uiText("AppStrings.ChooseAnyThatFit"))}
                  </Text>
                  {isSingleCategory ? (
                    <Select<
                      { value: string; id: number; label: string }
                    >
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
                        label: translateSystemLabel(tag.name, uiText),
                      }))}
                    />
                  ) : (
                    <Select<
                      { value: string; id: number; label: string },
                      true
                    >
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
                        label: translateSystemLabel(tag.name, uiText),
                      }))}
                      options={categoryTags.map((tag) => ({
                        value: tag.name,
                        id: tag.id,
                        label: translateSystemLabel(tag.name, uiText),
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
                <Text color="text">{uiText("AppStrings.Flags")}</Text>
                <Text color="textFaded" size="xs">
                   {uiText("AppStrings.AdditionalListenerWarningsOrNotes")} </Text>
              </div>
              <Select<
                { value: string; id: number; label: string },
                true
              >
                styles={selectStyles}
                menuPortalTarget={menuPortalTarget}
                menuPosition="fixed"
                isMulti
                isClearable
                onChange={(value) =>
                  setSelectedFlagIds(value.map((item) => item.id))
                }
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
            <Text color="text">{uiText("CreateGame.Links.Title")}</Text>
            <Text color="textFaded" size="xs">
               {uiText("AppStrings.ExternalLinksRelatedToThisTrack")} </Text>
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
                    placeholder={uiText("AppStrings.Label")}
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
                      setLinks((prev) =>
                        prev.filter((cur) => cur.id !== link.id),
                      )
                    }
                  >
                     {uiText("AppStrings.RemoveLink")} </Button>
                </Vstack>
              </Card>
            ))}
            <Button
              className="w-fit self-start"
              size="sm"
              icon="plus"
              onClick={() =>
                setLinks((prev) => [
                  ...prev,
                  { id: String(Date.now()), label: "", url: "" },
                ])
              }
            >
               {uiText("CreateGame.Links.Add")} </Button>
          </Vstack>

          <div className="w-full">
            <Text color="text">{uiText("AppStrings.License")}</Text>
            <Text color="textFaded" size="xs">
               {uiText("AppStrings.ChooseHowOthersCanUseThisTrack")} </Text>
          </div>
          <Dropdown
            selectedValue={licenseMode}
            onSelect={(value) => {
              const mode = value as LicenseMode;
              const previousFlags = licenseFlags;
              if (mode === "ARR") {
                const nextFlags = {
                  attribution: false,
                  commercial: false,
                  derivatives: false,
                  shareAlike: false,
                };
                const nextAllowBackgroundUse =
                  backgroundUsageWithLicenseDefaults(
                    allowBackgroundUse,
                    previousFlags,
                    nextFlags,
                  );
                setLicenseFlags(nextFlags);
                setAllowDownload(nextAllowBackgroundUse);
                setAllowBackgroundUse(nextAllowBackgroundUse);
                setAllowBackgroundUseAttribution(false);
                return;
              }
              if (mode === "CC0") {
                const nextFlags = {
                  attribution: false,
                  commercial: true,
                  derivatives: true,
                  shareAlike: false,
                };
                setLicenseFlags(nextFlags);
                setAllowDownload(true);
                setAllowBackgroundUse(
                  backgroundUsageWithLicenseDefaults(
                    allowBackgroundUse,
                    previousFlags,
                    nextFlags,
                  ),
                );
                setAllowBackgroundUseAttribution(
                  backgroundUsageAttributionWithLicenseDefaults(
                    allowBackgroundUseAttribution,
                    previousFlags,
                    nextFlags,
                  ),
                );
                return;
              }
              const nextFlags = {
                attribution: true,
                commercial: true,
                derivatives: true,
                shareAlike: false,
              };
              setLicenseFlags(nextFlags);
              setAllowDownload(true);
              setAllowBackgroundUse(
                backgroundUsageWithLicenseDefaults(
                  allowBackgroundUse,
                  previousFlags,
                  nextFlags,
                ),
              );
              setAllowBackgroundUseAttribution(
                true,
              );
            }}
          >
            <Dropdown.Item
              value="ARR"
              description={uiText("AppStrings.NoReusePermissionsGranted")}
            >
               {uiText("AppStrings.AllRightsReserved")} </Dropdown.Item>
            <Dropdown.Item
              value="CC0"
              description={uiText("AppStrings.PublicDomainStyleReleaseWithNoAttributionRequired")}
            >
               {uiText("AppStrings.CC0")} </Dropdown.Item>
            <Dropdown.Item
              value="CC_BY"
              description={uiText("AppStrings.CreativeCommonsWithAttributionAndConfigurableRestrictions")}
            >
               {uiText("AppStrings.CcByBased")} </Dropdown.Item>
          </Dropdown>
          {licenseMode === "CC_BY" && (
            <>
              <Hstack className="w-full items-center gap-3">
                <Switch checked disabled onChange={() => {}} />
                <Vstack align="start" gap={0}>
                  <Text color="text" size="sm">
                     {uiText("AppStrings.RequireAttribution")} </Text>
                  <Text color="textFaded" size="xs">
                     {uiText("AppStrings.CreditTheComposerWhenUsed")} </Text>
                </Vstack>
              </Hstack>
              <Hstack className="w-full items-center gap-3">
                <Switch
                  checked={licenseFlags.commercial}
                  onChange={(value) =>
                    setLicenseFlags((current) => ({
                      ...current,
                      attribution: true,
                      commercial: value,
                    }))
                  }
                />
                <Vstack align="start" gap={0}>
                  <Text color="text" size="sm">
                     {uiText("AppStrings.AllowCommercialUse")} </Text>
                  <Text color="textFaded" size="xs">
                     {uiText("AppStrings.LetOthersUseItCommercially")} </Text>
                </Vstack>
              </Hstack>
              <Hstack className="w-full items-center gap-3">
                <Switch
                  checked={licenseFlags.derivatives}
                  onChange={(value) =>
                    setLicenseFlags((current) => ({
                      ...current,
                      attribution: true,
                      derivatives: value,
                      shareAlike: value ? current.shareAlike : false,
                    }))
                  }
                />
                <Vstack align="start" gap={0}>
                  <Text color="text" size="sm">
                     {uiText("AppStrings.AllowDerivatives")} </Text>
                  <Text color="textFaded" size="xs">
                     {uiText("AppStrings.AllowRemixesOrAdaptations")} </Text>
                </Vstack>
              </Hstack>
              <Hstack className="w-full items-center gap-3">
                <Switch
                  checked={licenseFlags.shareAlike}
                  onChange={(value) =>
                    setLicenseFlags((current) => ({
                      ...current,
                      attribution: true,
                      shareAlike: value,
                    }))
                  }
                  disabled={!licenseFlags.derivatives}
                />
                <Vstack align="start" gap={0}>
                  <Text color="text" size="sm">
                     {uiText("AppStrings.ShareAlike")} </Text>
                  <Text color="textFaded" size="xs">
                     {uiText("AppStrings.DerivativesMustUseTheSameLicense")} </Text>
                </Vstack>
              </Hstack>
            </>
          )}
          <Text size="xs" color="textFaded">
             {uiText("AppStrings.LicenseApplied")} <TrackLicenseLink license={licenseFlagsToCode(licenseFlags)} />
          </Text>

          <Hstack className="w-full items-start gap-3">
            <Switch
              checked={backgroundUsageRequired ? true : allowBackgroundUse}
              onChange={(value) => {
                if (backgroundUsageRequired) return;
                if (value) {
                  setAllowDownload(true);
                  setAllowBackgroundUseAttribution((current) => current);
                } else {
                  setAllowBackgroundUseAttribution(false);
                }
                setAllowBackgroundUse(value);
              }}
              disabled={backgroundUsageRequired}
            />
            <Vstack align="start" gap={0} className="min-w-0 flex-1">
              <Text size="sm">{uiText("AppStrings.AllowBackgroundUseInStreamsAndVideos")}</Text>
              <Text size="xs" color="textFaded">
                 {uiText("AppStrings.LetPeopleUseThisTrackAsBackgroundMusic")} </Text>
            </Vstack>
          </Hstack>

          <Hstack className="w-full items-start gap-3">
            <Switch
              checked={
                licenseMode === "CC0" ? false : allowBackgroundUseAttribution
              }
              onChange={setAllowBackgroundUseAttribution}
              disabled={!backgroundUsageEnabled || licenseMode === "CC0"}
            />
            <Vstack align="start" gap={0} className="min-w-0 flex-1">
              <Text size="sm">
                 {uiText("AppStrings.RequireAttributionForStreamAndVideoBackgroundUse")} </Text>
              <Text size="xs" color="textFaded">
                 {uiText("AppStrings.WhenPeopleUseThisSongInTheBackground")} </Text>
            </Vstack>
          </Hstack>

          <Hstack className="w-full items-start gap-3">
            <Switch
              checked={downloadRequired ? true : allowDownload}
              onChange={setAllowDownload}
              disabled={downloadRequired}
            />
            <Vstack align="start" gap={0} className="min-w-0 flex-1">
              <Text size="sm">{uiText("AppStrings.AllowDownloads")}</Text>
              <Text size="xs" color="textFaded">
                 {uiText("AppStrings.LetListenersDownloadThisTrack")} </Text>
            </Vstack>
          </Hstack>

          <Hstack className="w-full justify-between">
            <Button
              href={`/m/${track.slug}${track.pageVersion ? `?pageVersion=${track.pageVersion}` : ""}`}
              variant="ghost"
            >
               {uiText("AppStrings.Cancel")} </Button>
            <Button
              color="green"
              loading={saving}
              onClick={async () => {
                if (!name.trim()) {
                  addToast({ title: uiText("AppStrings.TrackNameIsRequired") });
                  return;
                }
                if (credits.length === 0) {
                  addToast({ title: uiText("AppStrings.AddAtLeastOneCreditedPerson") });
                  return;
                }
                try {
                  setSaving(true);
                  const response = await updateTrack(
                    track.slug,
                    {
                      name: name.trim(),
                      commentary,
                      bpm: bpm.trim() ? Number(bpm) : null,
                      musicalKey: musicalKey.trim() || null,
                      softwareUsed: softwareUsed
                        .split(",")
                        .map((value) => value.trim())
                        .filter(Boolean),
                      allowDownload,
                      allowBackgroundUse,
                      allowBackgroundUseAttribution,
                      license: licenseFlagsToCode(licenseFlags),
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
                    },
                    track.pageVersion,
                  );
                  const payload = await response.json().catch(() => null);
                  if (!response.ok) {
                    addToast({
                      title: payload?.message ?? uiText("AppStrings.FailedToUpdateTrack"),
                    });
                    return;
                  }
                  router.push(
                    `/m/${track.slug}${track.pageVersion ? `?pageVersion=${track.pageVersion}` : ""}`,
                  );
                } finally {
                  setSaving(false);
                }
              }}
            >
               {uiText("AppStrings.SaveTrack")} </Button>
          </Hstack>
        </Vstack>
      </Card>
    </Vstack>
  );
}
