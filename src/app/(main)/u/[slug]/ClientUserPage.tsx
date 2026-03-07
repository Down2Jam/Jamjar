"use client";

import { GameCard } from "@/components/gamecard";
import PostCard from "@/components/posts/PostCard";
import CommentCard from "@/components/posts/CommentCard";
import SidebarSong from "@/components/sidebar/SidebarSong";
import ThemedProse from "@/components/themed-prose";
import {
  addToast,
  Avatar,
  Button,
  Card,
  Chip,
  Dropdown,
  Hstack,
  Icon,
  ImageInput,
  Input,
  Link,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Text,
  Tooltip,
  Vstack,
  useDisclosure,
} from "bioloom-ui";
import { useTheme } from "@/providers/SiteThemeProvider";
import { getSelf, getUser, updateUser } from "@/requests/user";
import { GameType } from "@/types/GameType";
import { UserType } from "@/types/UserType";
import MentionedContent from "@/components/mentions/MentionedContent";
import Image from "next/image";
import dynamic from "next/dynamic";
import { use, useEffect, useMemo, useState } from "react";
import { getCookie } from "@/helpers/cookie";
import { getTeamRoles } from "@/requests/team";
import { RoleType } from "@/types/RoleType";

type RarityTier =
  | "Abyssal"
  | "Diamond"
  | "Gold"
  | "Silver"
  | "Bronze"
  | "Default";

type ProfileSection =
  | "bio"
  | "games"
  | "music"
  | "posts"
  | "comments"
  | "recommendations"
  | "achievements"
  | "scores"
  | "emotes";

const Editor = dynamic(() => import("@/components/editor"), {
  ssr: false,
  loading: () => <div className="min-h-[160px]" />,
});

function getRarityTier(
  haveCount: number,
  totalEngaged: number,
): { tier: RarityTier; pct: number } {
  const pct = totalEngaged > 0 ? (haveCount / totalEngaged) * 100 : 0;
  if (totalEngaged >= 40 && pct <= 5) return { tier: "Abyssal", pct };
  if (totalEngaged >= 20 && pct <= 10) return { tier: "Diamond", pct };
  if (totalEngaged >= 10 && pct <= 25) return { tier: "Gold", pct };
  if (totalEngaged >= 5 && pct <= 50) return { tier: "Silver", pct };
  if (totalEngaged >= 5 && pct <= 100) return { tier: "Bronze", pct };
  return { tier: "Default", pct };
}

function engagedUserIdsForGame(game: GameType): Set<number> {
  const ids = new Set<number>();
  if (!game) return ids;

  for (const a of game.achievements ?? []) {
    for (const u of a.users ?? []) {
      if (u?.id != null) ids.add(u.id);
    }
  }

  for (const lb of game.leaderboards ?? []) {
    for (const s of lb.scores ?? []) {
      const uid = s?.userId;
      if (uid != null) ids.add(uid);
    }
  }

  for (const r of game.ratings ?? []) {
    const uid = r?.user?.id ?? r?.userId;
    if (uid != null) ids.add(uid);
  }

  return ids;
}

type LeaderboardScore = {
  id: number;
  data: number;
  evidence?: string;
  user: { id: number; name: string; profilePicture?: string };
  leaderboard: {
    id: number;
    name: string;
    type: "SCORE" | "GOLF" | "SPEEDRUN" | "ENDURANCE";
    decimalPlaces: number;
    onlyBest: boolean;
    maxUsersShown: number;
    scores: LeaderboardScore[];
    game: { id: number; name: string; thumbnail?: string | null; slug: string };
  };
};

function isLowerBetter(type: LeaderboardScore["leaderboard"]["type"]) {
  return type === "GOLF" || type === "SPEEDRUN";
}

function pickBestByType(
  a: LeaderboardScore | undefined,
  b: LeaderboardScore,
  type: LeaderboardScore["leaderboard"]["type"],
) {
  if (!a) return b;
  return isLowerBetter(type)
    ? b.data < a.data
      ? b
      : a
    : b.data > a.data
      ? b
      : a;
}

function bestPerLeaderboardForUser(userScores: LeaderboardScore[]) {
  const best = new Map<number, LeaderboardScore>();
  for (const s of userScores) {
    const lbId = s.leaderboard.id;
    const type = s.leaderboard.type;
    best.set(lbId, pickBestByType(best.get(lbId), s, type));
  }
  return Array.from(best.values());
}

function dedupToBestPerUser(
  scores: LeaderboardScore[],
  type: LeaderboardScore["leaderboard"]["type"],
) {
  const m = new Map<number, LeaderboardScore>();
  for (const s of scores) {
    const current = m.get(s.user.id);
    m.set(s.user.id, pickBestByType(current, s, type));
  }
  return Array.from(m.values());
}

function sortForRank(
  scores: LeaderboardScore[],
  type: LeaderboardScore["leaderboard"]["type"],
) {
  return [...scores].sort((a, b) => {
    if (isLowerBetter(type)) return a.data - b.data;
    return b.data - a.data;
  });
}

function computePlacement(target: LeaderboardScore): number | null {
  const lb = target.leaderboard;
  if (!lb || !Array.isArray(lb.scores) || lb.scores.length === 0) return null;

  const pool = lb.onlyBest ? dedupToBestPerUser(lb.scores, lb.type) : lb.scores;
  const ranked = sortForRank(pool, lb.type);

  const idx = ranked.findIndex(
    (s) =>
      s.id === target.id ||
      (lb.onlyBest && s.user.id === target.user.id && s.data === target.data),
  );
  return idx >= 0 ? idx + 1 : null;
}

function ordinal(n: number) {
  const j = n % 10,
    k = n % 100;
  if (j === 1 && k !== 11) return `${n}st`;
  if (j === 2 && k !== 12) return `${n}nd`;
  if (j === 3 && k !== 13) return `${n}rd`;
  return `${n}th`;
}

function formatScoreValue(s: LeaderboardScore) {
  const { type, decimalPlaces } = s.leaderboard;
  if (type === "SCORE" || type === "GOLF") {
    return (s.data / 10 ** decimalPlaces).toString();
  }
  const total = s.data;
  const h = Math.floor(total / 3_600_000);
  const m = Math.floor((total % 3_600_000) / 60_000);
  const sec = Math.floor((total % 60_000) / 1000);
  const ms = total % 1000;
  return `${h > 0 ? `${h}:` : ""}${m.toString().padStart(2, "0")}:${sec
    .toString()
    .padStart(2, "0")}${ms > 0 ? `.${ms.toString().padStart(3, "0")}` : ""}`;
}

function placementColor(p: number | null, colors: Record<string, string>) {
  if (p == null) return colors["textFaded"];
  if (p === 1) return colors["yellow"];
  if (p === 2) return colors["orange"];
  if (p === 3) return colors["red"];
  return colors["textFaded"];
}

function iconForRoleSlug(slug: string) {
  const value = slug.toLowerCase();
  if (value.includes("artist") || value.includes("art")) return "images";
  if (value.includes("composer") || value.includes("music")) return "music";
  if (value.includes("writer") || value.includes("narrative"))
    return "squarepen";
  if (
    value.includes("program") ||
    value.includes("engineer") ||
    value.includes("coder")
  )
    return "cog";
  if (value.includes("design") || value.includes("ui")) return "star";
  if (value.includes("community") || value.includes("moderator"))
    return "users";
  return "sparkles";
}

const hexToRgba = (hex: string | undefined, alpha: number) => {
  const safeHex = hex ?? "#0b1220";
  const value = safeHex.replace("#", "");
  const normalized =
    value.length === 3
      ? value
          .split("")
          .map((char) => char + char)
          .join("")
      : value;
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export default function ClientUserPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = use(params);
  const slug = resolvedParams.slug;
  const [user, setUser] = useState<UserType>();
  const [self, setSelf] = useState<UserType>();
  const { colors } = useTheme();
  const [roles, setRoles] = useState<RoleType[]>([]);
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [bannerPicture, setBannerPicture] = useState<string | null>(null);
  const [profileBackground, setProfileBackground] = useState<string | null>(
    null,
  );
  const [pronounsDraft, setPronounsDraft] = useState("");
  const [linksDraft, setLinksDraft] = useState<
    Array<{ url: string; label: string }>
  >([]);
  const [bioDraft, setBioDraft] = useState("");
  const [nameDraft, setNameDraft] = useState("");
  const [avatarDraft, setAvatarDraft] = useState<string | null>(null);
  const [bannerDraft, setBannerDraft] = useState<string | null>(null);
  const [backgroundDraft, setBackgroundDraft] = useState<string | null>(null);
  const [recSearch, setRecSearch] = useState("");
  const [recLoading, setRecLoading] = useState(false);
  const [recResults, setRecResults] = useState<{
    games: Array<{
      id: number;
      name: string;
      slug: string;
      thumbnail?: string | null;
    }>;
    posts: Array<{ id: number; title: string; slug: string }>;
    tracks: Array<{
      id: number;
      name: string;
      url: string;
      composer?: { name: string };
      game?: { name: string; slug: string; thumbnail?: string | null };
    }>;
  }>({ games: [], posts: [], tracks: [] });
  const [recType, setRecType] = useState<"games" | "posts" | "tracks">("games");
  const [recSelected, setRecSelected] = useState<number[]>([]);
  const [profileSection, setProfileSection] = useState<
    ProfileSection
  >("bio");
  const [primaryRoles, setPrimaryRoles] = useState<Set<string>>(new Set());
  const [secondaryRoles, setSecondaryRoles] = useState<Set<string>>(new Set());
  const [defaultPfps, setDefaultPfps] = useState<string[]>([]);
  const [savingProfile, setSavingProfile] = useState(false);
  const {
    isOpen: isAvatarOpen,
    onOpen: openAvatar,
    onOpenChange: onAvatarOpenChange,
  } = useDisclosure();
  const {
    isOpen: isBannerOpen,
    onOpen: openBanner,
    onOpenChange: onBannerOpenChange,
  } = useDisclosure();
  const {
    isOpen: isBackgroundOpen,
    onOpen: openBackground,
    onOpenChange: onBackgroundOpenChange,
  } = useDisclosure();
  const {
    isOpen: isNameOpen,
    onOpen: openName,
    onOpenChange: onNameOpenChange,
  } = useDisclosure();
  const {
    isOpen: isBioOpen,
    onOpen: openBio,
    onOpenChange: onBioOpenChange,
  } = useDisclosure();
  const {
    isOpen: isPronounsOpen,
    onOpen: openPronouns,
    onOpenChange: onPronounsOpenChange,
  } = useDisclosure();
  const {
    isOpen: isLinksOpen,
    onOpen: openLinks,
    onOpenChange: onLinksOpenChange,
  } = useDisclosure();
  const {
    isOpen: isRolesOpen,
    onOpen: openRoles,
    onOpenChange: onRolesOpenChange,
  } = useDisclosure();
  const {
    isOpen: isRecOpen,
    onOpen: openRec,
    onOpenChange: onRecOpenChange,
  } = useDisclosure();

  const defaultBanners = ["/images/D2J_Banner.png"];
  const defaultBackgrounds = ["/images/sitebg.png"];

  const rarityStyles: Record<
    RarityTier,
    { border: string; glow?: string; text: string }
  > = {
    Abyssal: {
      border: colors["magenta"] + "99",
      glow: `0 0 12px ${colors["magentaDark"] + "99"}`,
      text: colors["magenta"],
    },
    Diamond: {
      border: colors["blue"] + "99",
      glow: `0 0 10px ${colors["blueDark"] + "99"}`,
      text: colors["blue"],
    },
    Gold: {
      border: colors["yellow"] + "99",
      glow: `0 0 10px ${colors["yellowDark"] + "99"}`,
      text: colors["yellow"],
    },
    Silver: {
      border: colors["gray"] + "99",
      glow: `0 0 8px ${colors["gray"] + "99"}`,
      text: colors["gray"],
    },
    Bronze: {
      border: colors["orange"] + "99",
      glow: `0 0 8px ${colors["orangeDark"] + "99"}`,
      text: colors["orange"],
    },
    Default: { border: colors["base"] + "99", text: colors["textFaded"] },
  };
  const isOwner = !!self && !!user && self.id === user.id;

  useEffect(() => {
    if (profileSection === "recommendations") {
      setProfileSection("bio");
    }
  }, [profileSection]);

  const refreshUser = async () => {
    const response = await getUser(`${slug}`);
    const json = await response.json();
    setUser(json.data);
  };

  const normalizeImage = (value?: string | null) => {
    if (!value) return null;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  };

  const uploadImage = async (file: File) => {
    const formData = new FormData();
    formData.append("upload", file);

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

    const data = await response.json();
    return data.data as string;
  };

  useEffect(() => {
    const fetchUser = async () => {
      await refreshUser();

      const selfRes = await getSelf();
      if (selfRes.ok) {
        setSelf(await selfRes.json());
      }
    };

    fetchUser();
  }, [slug]);

  useEffect(() => {
    if (!user) return;
    setProfilePicture(normalizeImage(user.profilePicture));
    setBannerPicture(normalizeImage(user.bannerPicture));
    setProfileBackground(normalizeImage(user.profileBackground));
    setNameDraft(user.name ?? "");
    setPronounsDraft(user.pronouns ?? "");
    const nextLinks = user.links ?? [];
    const nextLabels = user.linkLabels ?? [];
    setLinksDraft(
      nextLinks.map((url, index) => ({
        url,
        label: nextLabels[index] ?? "",
      })),
    );
    setBioDraft(user.bio ?? "");
    setPrimaryRoles(new Set(user.primaryRoles?.map((role) => role.slug) ?? []));
    setSecondaryRoles(
      new Set(user.secondaryRoles?.map((role) => role.slug) ?? []),
    );
  }, [user]);

  useEffect(() => {
    if (!isRecOpen || !recSearch.trim()) return;
    const controller = new AbortController();
    const fetchResults = async () => {
      setRecLoading(true);
      try {
        const response = await fetch(
          `${
            process.env.NEXT_PUBLIC_MODE === "PROD"
              ? "https://d2jam.com/api/v1"
              : "http://localhost:3005/api/v1"
          }/search?query=${encodeURIComponent(recSearch.trim())}`,
          { signal: controller.signal },
        );
        if (!response.ok) {
          setRecResults({ games: [], posts: [], tracks: [] });
          return;
        }
        const json = await response.json();
        setRecResults({
          games: json.data?.games ?? [],
          posts: json.data?.posts ?? [],
          tracks: json.data?.tracks ?? [],
        });
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          console.error(error);
        }
      } finally {
        setRecLoading(false);
      }
    };

    fetchResults();
    return () => controller.abort();
  }, [isRecOpen, recSearch]);

  const openRecommendations = (type: "games" | "posts" | "tracks") => {
    if (!user) return;
    setRecType(type);
    if (type === "games") {
      setRecSelected((user.recommendedGames ?? []).map((g) => g.id));
    } else if (type === "posts") {
      setRecSelected((user.recommendedPosts ?? []).map((p) => p.id));
    } else {
      setRecSelected((user.recommendedTracks ?? []).map((t) => t.id));
    }
    setRecSearch("");
    setRecResults({ games: [], posts: [], tracks: [] });
    openRec();
  };

  const saveRecommendations = async () => {
    if (!user) return;
    setSavingProfile(true);
    const payload = {
      recommendedGameIds:
        recType === "games"
          ? recSelected
          : (user.recommendedGames ?? []).map((g) => g.id),
      recommendedPostIds:
        recType === "posts"
          ? recSelected
          : (user.recommendedPosts ?? []).map((p) => p.id),
      recommendedTrackIds:
        recType === "tracks"
          ? recSelected
          : (user.recommendedTracks ?? []).map((t) => t.id),
    };

    const response = await updateUser(
      user.slug,
      user.name ?? user.slug,
      user.bio ?? "",
      user.short ?? "",
      profilePicture,
      bannerPicture,
      Array.from(primaryRoles),
      Array.from(secondaryRoles),
      user.emotePrefix ?? null,
      user.pronouns ?? null,
      user.links ?? [],
      user.linkLabels ?? [],
      profileBackground,
      payload.recommendedGameIds,
      payload.recommendedPostIds,
      payload.recommendedTrackIds,
    );

    if (response.ok) {
      addToast({ title: "Recommendations updated" });
      await refreshUser();
    } else {
      addToast({ title: "Failed to update recommendations" });
    }
    setSavingProfile(false);
  };

  useEffect(() => {
    if (!isOwner) return;
    fetch(
      process.env.NEXT_PUBLIC_MODE === "PROD"
        ? "https://d2jam.com/api/v1/pfps"
        : "http://localhost:3005/api/v1/pfps",
    )
      .then((res) => res.json())
      .then((data) => setDefaultPfps(data.data))
      .catch((err) => console.error("Failed to load pfps", err));
  }, [isOwner]);

  useEffect(() => {
    if (!isOwner) return;
    const loadRoles = async () => {
      const response = await getTeamRoles();
      if (!response.ok) {
        setRoles([]);
        return;
      }
      const data = await response.json();
      setRoles(data.data ?? []);
    };

    loadRoles();
  }, [isOwner]);

  const saveProfile = async (updates: {
    profilePicture?: string | null;
    bannerPicture?: string | null;
    profileBackground?: string | null;
    name?: string;
    bio?: string;
    pronouns?: string | null;
    links?: Array<{ url: string; label: string }>;
    primaryRoles?: Set<string>;
    secondaryRoles?: Set<string>;
  }) => {
    if (!user) return;
    setSavingProfile(true);

    const nextBio = updates.bio ?? bioDraft ?? "";
    const nextName = updates.name ?? nameDraft ?? user.name ?? user.slug;
    const nextPronouns =
      updates.pronouns !== undefined ? updates.pronouns : pronounsDraft;
    const nextLinks = updates.links ?? linksDraft ?? [];
    const normalizedLinks: string[] = [];
    const normalizedLabels: string[] = [];
    for (const link of nextLinks) {
      const trimmed = link.url.trim();
      if (!trimmed) continue;
      normalizedLinks.push(
        trimmed.match(/^https?:\/\//i) ? trimmed : `https://${trimmed}`,
      );
      normalizedLabels.push(link.label.trim());
    }
    const nextPrimaryRoles = updates.primaryRoles ?? primaryRoles;
    const nextSecondaryRoles = updates.secondaryRoles ?? secondaryRoles;

    const response = await updateUser(
      user.slug,
      nextName,
      nextBio,
      user.short ?? "",
      updates.profilePicture ?? profilePicture,
      updates.bannerPicture ?? bannerPicture,
      Array.from(nextPrimaryRoles),
      Array.from(nextSecondaryRoles),
      user.emotePrefix ?? null,
      nextPronouns?.trim() ? nextPronouns.trim() : null,
      normalizedLinks,
      normalizedLabels,
      updates.profileBackground ?? profileBackground,
      undefined,
      undefined,
      undefined,
    );

    if (response.ok) {
      addToast({ title: "Profile updated" });
      await refreshUser();
    } else {
      addToast({ title: "Failed to update profile" });
    }

    setSavingProfile(false);
  };

  const bannerSrc = normalizeImage(
    bannerPicture ?? user?.bannerPicture ?? null,
  );
  const avatarSrc = normalizeImage(
    profilePicture ?? user?.profilePicture ?? null,
  );
  const backgroundSrc = normalizeImage(
    profileBackground ?? user?.profileBackground ?? null,
  );
  const currentLinks = user?.links ?? [];
  const currentLabels = user?.linkLabels ?? [];
  const linksChanged =
    linksDraft.length !== currentLinks.length ||
    linksDraft.some((link, index) => {
      const url = link.url.trim();
      const label = link.label.trim();
      return (
        url !== (currentLinks[index] ?? "").trim() ||
        label !== (currentLabels[index] ?? "").trim()
      );
    });

  const recGames = user?.recommendedGames ?? [];
  const recPosts = user?.recommendedPosts ?? [];
  const recTracks = user?.recommendedTracks ?? [];
  const emotes = user?.userEmotes ?? [];
  const publishedGames = useMemo(() => {
    if (!user) return [];
    return (
      user.teams?.reduce<GameType[]>((prev, cur) => {
        if (cur.game && cur.game.published) {
          prev.push(cur.game);
        }
        return prev;
      }, []) ?? []
    );
  }, [user]);
  const bestScores = useMemo(() => {
    if (!user) return [];
    return bestPerLeaderboardForUser(user.scores);
  }, [user]);
  const canSeeModeratedContent = Boolean(self?.mod || self?.admin);
  const visiblePosts = useMemo(
    () =>
      (user?.posts ?? []).filter(
        (post) => canSeeModeratedContent || (!post.deletedAt && !post.removedAt),
      ),
    [canSeeModeratedContent, user?.posts],
  );
  const visibleComments = useMemo(
    () =>
      (user?.comments ?? []).filter(
        (comment) =>
          canSeeModeratedContent || (!comment.deletedAt && !comment.removedAt),
      ),
    [canSeeModeratedContent, user?.comments],
  );
  const postsCount = visiblePosts.length;
  const commentsCount = visibleComments.length;
  const recommendationsCount =
    recGames.length + recPosts.length + recTracks.length;
  const scoresCount = bestScores.length;
  const achievementsCount = user?.achievements.length ?? 0;

  const recSelectedItems = useMemo(() => {
    const source =
      recType === "games"
        ? [...recGames, ...recResults.games]
        : recType === "posts"
          ? [...recPosts, ...recResults.posts]
          : [...recTracks, ...recResults.tracks];

    return recSelected
      .map((id) => source.find((item) => item.id === id))
      .filter((item) => item !== undefined);
  }, [recType, recSelected, recGames, recPosts, recTracks, recResults]);

  if (!user) {
    return <></>;
  }

  return (
    <>
      <Vstack align="stretch" gap={4}>
        <Card padding={0} className="relative">
          <div
            className={`relative w-full aspect-11/1 ${
              isOwner ? "cursor-pointer group" : ""
            }`}
            style={{
              backgroundColor: colors["base"],
            }}
            onClick={() => {
              if (!isOwner) return;
              setBannerDraft(bannerSrc);
              openBanner();
            }}
          >
            {bannerSrc ? (
              <img
                src={bannerSrc}
                alt={`${user.name}'s profile banner`}
                className="absolute inset-0 h-full w-full object-cover"
                loading="lazy"
                decoding="async"
              />
            ) : (
              isOwner && (
                <div
                  className="absolute inset-4 rounded-xl border-2 border-dashed flex items-center justify-center"
                  style={{ borderColor: colors["grayDark"] }}
                >
                  <Hstack className="items-center gap-2">
                    <Icon name="images" color="textFaded" size={18} />
                    <Text color="textFaded" size="sm">
                      Click to upload banner
                    </Text>
                  </Hstack>
                </div>
              )
            )}
            {isOwner && bannerSrc && (
              <div
                className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ backgroundColor: hexToRgba(colors["crust"], 0.5) }}
              >
                <Vstack
                  align="center"
                  className="items-center justify-center text-center"
                >
                  <Icon name="images" color="text" />
                  <Text color="text">Change banner</Text>
                </Vstack>
              </div>
            )}
          </div>
          <button
            type="button"
            className={`absolute left-16 top-16 ${
              isOwner ? "cursor-pointer group" : "cursor-default"
            }`}
            onClick={() => {
              if (!isOwner) return;
              setAvatarDraft(avatarSrc);
              openAvatar();
            }}
          >
            <div
              className={`relative rounded-full transition-transform duration-300 group-hover:scale-[1.03] ${
                isOwner && !avatarSrc ? "border-2 border-dashed" : ""
              }`}
              style={{
                borderColor: colors["grayDark"],
                padding: avatarSrc ? 0 : 6,
              }}
            >
              <Avatar
                src={avatarSrc ?? undefined}
                className="rounded-full bg-transparent"
                size={96}
                style={
                  isOwner && avatarSrc
                    ? { boxShadow: `0 0 0 2px ${colors["blue"]}` }
                    : undefined
                }
              />
              {isOwner && (
                <div
                  className="absolute inset-0 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{
                    backgroundColor: hexToRgba(colors["crust"], 0.6),
                  }}
                >
                  <Vstack
                    align="center"
                    className="items-center justify-center text-center"
                  >
                    <Icon name="images" color="text" size={18} />
                    <Text color="text" size="xs">
                      Change
                    </Text>
                  </Vstack>
                </div>
              )}
            </div>
          </button>
          <Vstack align="start" className="mt-0 px-8 pt-3 pb-8 gap-4">
            <Hstack className="items-start gap-6 w-full">
              <Vstack align="start" className="gap-1 pl-44">
                <Hstack className="items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      if (!isOwner) return;
                      setNameDraft(user.name ?? "");
                      openName();
                    }}
                    className={`relative rounded-lg px-2 py-1 ${
                      isOwner ? "group cursor-pointer" : "cursor-default"
                    }`}
                  >
                    <Text size="3xl">{user.name}</Text>
                    {isOwner && (
                      <div
                        className="absolute inset-0 rounded-lg border border-dashed opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ borderColor: colors["grayDark"] }}
                      />
                    )}
                  </button>
                  {(user.primaryRoles || user.secondaryRoles) && (
                    <button
                      type="button"
                      onClick={() => {
                        if (!isOwner) return;
                        setPrimaryRoles(
                          new Set(user.primaryRoles.map((role) => role.slug)),
                        );
                        setSecondaryRoles(
                          new Set(user.secondaryRoles.map((role) => role.slug)),
                        );
                        openRoles();
                      }}
                      className={`relative rounded-lg px-2 py-1 ${
                        isOwner ? "group cursor-pointer" : "cursor-default"
                      }`}
                    >
                      <Hstack wrap className="items-center gap-2">
                        {user.primaryRoles.map((role) => (
                          <Tooltip
                            key={role.id}
                            content={
                              <Vstack align="start" gap={0}>
                                <Text size="sm" weight="semibold">
                                  {role.name}
                                </Text>
                                {role.description && (
                                  <Text size="xs" color="textFaded">
                                    {role.description}
                                  </Text>
                                )}
                              </Vstack>
                            }
                          >
                            <Icon
                              name={iconForRoleSlug(role.slug)}
                              size={18}
                              color="text"
                            />
                          </Tooltip>
                        ))}
                        {user.secondaryRoles
                          .filter(
                            (role) =>
                              !user.primaryRoles.some(
                                (primary) => primary.id === role.id,
                              ),
                          )
                          .map((role) => (
                            <Tooltip
                              key={role.id}
                              content={
                                <Vstack align="start" gap={0}>
                                  <Text size="sm" weight="semibold">
                                    {role.name}
                                  </Text>
                                  {role.description && (
                                    <Text size="xs" color="textFaded">
                                      {role.description}
                                    </Text>
                                  )}
                                </Vstack>
                              }
                            >
                              <Icon
                                name={iconForRoleSlug(role.slug)}
                                size={16}
                                color="textFaded"
                                className="opacity-70"
                              />
                            </Tooltip>
                          ))}
                        {isOwner &&
                          user.primaryRoles.length === 0 &&
                          user.secondaryRoles.length === 0 && (
                            <Text color="textFaded" size="sm">
                              Click to add roles
                            </Text>
                          )}
                      </Hstack>
                      {isOwner && (
                        <div
                          className="absolute inset-0 rounded-lg border border-dashed opacity-0 group-hover:opacity-100 transition-opacity"
                          style={{ borderColor: colors["grayDark"] }}
                        />
                      )}
                    </button>
                  )}
                </Hstack>
                <Hstack className="items-center gap-3">
                  <Text size="sm" color="textFaded">
                    @{user.slug}
                  </Text>
                  {(user.pronouns || isOwner) && (
                    <button
                      type="button"
                      onClick={() => {
                        if (!isOwner) return;
                        setPronounsDraft(user.pronouns ?? "");
                        openPronouns();
                      }}
                      className={`relative rounded-lg px-2 py-1 ${
                        isOwner ? "group cursor-pointer" : "cursor-default"
                      }`}
                    >
                      <Text color="textFaded" size="sm">
                        {user.pronouns || "Click to add pronouns"}
                      </Text>
                      {isOwner && (
                        <div
                          className="absolute inset-0 rounded-lg border border-dashed opacity-0 group-hover:opacity-100 transition-opacity"
                          style={{ borderColor: colors["grayDark"] }}
                        />
                      )}
                    </button>
                  )}
                </Hstack>
              </Vstack>
              <Hstack className="ml-auto flex-wrap items-center justify-end gap-2">
                {[
                  {
                    key: "games" as ProfileSection,
                    label: "Games",
                    count: publishedGames.length,
                  },
                  {
                    key: "music" as ProfileSection,
                    label: "Music",
                    count: user.tracks.length,
                  },
                  {
                    key: "posts" as ProfileSection,
                    label: "Posts",
                    count: postsCount,
                  },
                  {
                    key: "comments" as ProfileSection,
                    label: "Comments",
                    count: commentsCount,
                  },
                  {
                    key: "achievements" as ProfileSection,
                    label: "Achievements",
                    count: achievementsCount,
                  },
                  {
                    key: "scores" as ProfileSection,
                    label: "Scores",
                    count: scoresCount,
                  },
                  {
                    key: "emotes" as ProfileSection,
                    label: "Emotes",
                    count: user.userEmotes?.length,
                  },
                ].map((section) => (
                  <Button
                    key={section.key}
                    size="sm"
                    variant="ghost"
                    color={profileSection === section.key ? "blue" : "default"}
                    onClick={() =>
                      setProfileSection((prev) =>
                        prev === section.key ? "bio" : section.key,
                      )
                    }
                  >
                    {section.label}
                    <span className="ml-1 text-xs opacity-70">
                      {section.count}
                    </span>
                  </Button>
                ))}
              </Hstack>
            </Hstack>
          </Vstack>
        </Card>

        {profileSection === "bio" ? (
          <Hstack align="stretch">
            <Card>
              {(user.links?.length || isOwner) && (
                <div
                  role={isOwner ? "button" : undefined}
                  tabIndex={isOwner ? 0 : -1}
                  onClick={(event) => {
                    if (!isOwner) return;
                    const target = event.target as HTMLElement;
                    if (target.closest("a")) return;
                    setLinksDraft(
                      (user.links ?? []).map((url, index) => ({
                        url,
                        label: user.linkLabels?.[index] ?? "",
                      })),
                    );
                    openLinks();
                  }}
                  onKeyDown={(event) => {
                    if (!isOwner) return;
                    if (event.key !== "Enter" && event.key !== " ") return;
                    setLinksDraft(
                      (user.links ?? []).map((url, index) => ({
                        url,
                        label: user.linkLabels?.[index] ?? "",
                      })),
                    );
                    openLinks();
                  }}
                  className={`relative rounded-lg p-2 ${
                    isOwner ? "group cursor-pointer" : "cursor-default"
                  }`}
                >
                  <Vstack className="items-center gap-2" align="start">
                    {user.links?.length ? (
                      user.links.map((link, index) => {
                        const label = user.linkLabels?.[index]?.trim();
                        let host = "";
                        try {
                          host = new URL(link).hostname.replace(/^www\./, "");
                        } catch {
                          host = link.replace(/^https?:\/\//, "").split("/")[0];
                        }
                        const faviconUrl = `https://www.google.com/s2/favicons?sz=32&domain=${encodeURIComponent(
                          host,
                        )}`;
                        return (
                          <Chip
                            key={`${link}-${index}`}
                            href={link}
                            avatarSrc={faviconUrl}
                          >
                            {label || host}
                          </Chip>
                        );
                      })
                    ) : (
                      <Text color="textFaded" size="sm">
                        Click to add links
                      </Text>
                    )}
                  </Vstack>
                  {isOwner && (
                    <div
                      className="absolute inset-0 rounded-lg border border-dashed opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ borderColor: colors["grayDark"] }}
                    />
                  )}
                </div>
              )}
            </Card>
            <Card>
              <div
                role={isOwner ? "button" : undefined}
                tabIndex={isOwner ? 0 : -1}
                onClick={(event) => {
                  if (!isOwner) return;
                  const target = event.target as HTMLElement;
                  if (target.closest("a")) return;
                  setBioDraft(user.bio ?? "");
                  openBio();
                }}
                onKeyDown={(event) => {
                  if (!isOwner) return;
                  if (event.key !== "Enter" && event.key !== " ") return;
                  setBioDraft(user.bio ?? "");
                  openBio();
                }}
                className={`relative w-full rounded-lg p-2 text-left ${
                  isOwner ? "group cursor-pointer" : "cursor-default"
                }`}
              >
                <Vstack align="start" className="gap-2 w-full">
                  <Text weight="semibold">Bio</Text>
                  <ThemedProse>
                    <MentionedContent
                      html={
                        user.bio && user.bio != "<p></p>"
                          ? user.bio
                          : "Click to add a bio"
                      }
                      className="!duration-250 !ease-linear !transition-all max-w-full break-words"
                    />
                  </ThemedProse>
                </Vstack>
                {isOwner && (
                  <div
                    className="absolute inset-0 rounded-lg border border-dashed opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ borderColor: colors["grayDark"] }}
                  />
                )}
              </div>
            </Card>
          </Hstack>
        ) : (
          <Vstack align="stretch" gap={4} className="w-full">
            {profileSection === "recommendations" && (
              <>
                <Card>
                  <Vstack align="stretch" gap={3}>
                    <Hstack justify="between" className="flex-wrap gap-2">
                      <Vstack align="start" gap={1}>
                        <Text size="lg" weight="semibold">
                          Recommended Games
                        </Text>
                        <Text size="sm" color="textFaded">
                          Up to 5 games you want people to check out.
                        </Text>
                      </Vstack>
                      {isOwner && (
                        <Button
                          size="sm"
                          icon="pencil"
                          onClick={() => openRecommendations("games")}
                        >
                          Edit
                        </Button>
                      )}
                    </Hstack>
                    {recGames.length === 0 ? (
                      <Text size="sm" color="textFaded">
                        No recommended games yet.
                      </Text>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {recGames.map((game) => (
                          <Link key={game.id} href={`/g/${game.slug}`}>
                            <Card className="h-full">
                              <Hstack className="gap-3 items-center">
                                <img
                                  src={game.thumbnail ?? "/images/D2J_Icon.png"}
                                  alt={game.name}
                                  className="h-12 w-20 rounded-md object-cover"
                                  loading="lazy"
                                  decoding="async"
                                />
                                <Vstack align="start" gap={0}>
                                  <Text weight="semibold">{game.name}</Text>
                                  <Text size="xs" color="textFaded">
                                    /g/{game.slug}
                                  </Text>
                                </Vstack>
                              </Hstack>
                            </Card>
                          </Link>
                        ))}
                      </div>
                    )}
                  </Vstack>
                </Card>
                <Card>
                  <Vstack align="stretch" gap={3}>
                    <Hstack justify="between" className="flex-wrap gap-2">
                      <Vstack align="start" gap={1}>
                        <Text size="lg" weight="semibold">
                          Recommended Music
                        </Text>
                        <Text size="sm" color="textFaded">
                          Up to 5 tracks from across the site.
                        </Text>
                      </Vstack>
                      {isOwner && (
                        <Button
                          size="sm"
                          icon="pencil"
                          onClick={() => openRecommendations("tracks")}
                        >
                          Edit
                        </Button>
                      )}
                    </Hstack>
                    {recTracks.length === 0 ? (
                      <Text size="sm" color="textFaded">
                        No recommended tracks yet.
                      </Text>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {recTracks.map((track) => (
                          <Card key={track.id}>
                            <Hstack className="gap-3 items-center">
                              <img
                                src={
                                  track.game?.thumbnail ??
                                  "/images/D2J_Icon.png"
                                }
                                alt={track.name}
                                className="h-12 w-20 rounded-md object-cover"
                                loading="lazy"
                                decoding="async"
                              />
                              <Vstack align="start" gap={0}>
                                <Text weight="semibold">{track.name}</Text>
                                <Text size="xs" color="textFaded">
                                  {track.composer?.name ?? "Unknown"} -{" "}
                                  {track.game?.name ?? "Unknown game"}
                                </Text>
                              </Vstack>
                            </Hstack>
                          </Card>
                        ))}
                      </div>
                    )}
                  </Vstack>
                </Card>
                <Card>
                  <Vstack align="stretch" gap={3}>
                    <Hstack justify="between" className="flex-wrap gap-2">
                      <Vstack align="start" gap={1}>
                        <Text size="lg" weight="semibold">
                          Recommended Posts
                        </Text>
                        <Text size="sm" color="textFaded">
                          Up to 5 posts worth reading.
                        </Text>
                      </Vstack>
                      {isOwner && (
                        <Button
                          size="sm"
                          icon="pencil"
                          onClick={() => openRecommendations("posts")}
                        >
                          Edit
                        </Button>
                      )}
                    </Hstack>
                    {recPosts.length === 0 ? (
                      <Text size="sm" color="textFaded">
                        No recommended posts yet.
                      </Text>
                    ) : (
                      <Vstack align="stretch" gap={2}>
                        {recPosts.map((post) => (
                          <Link key={post.id} href={`/p/${post.slug}`}>
                            <Card>
                              <Text weight="semibold">{post.title}</Text>
                              <Text size="xs" color="textFaded">
                                /p/{post.slug}
                              </Text>
                            </Card>
                          </Link>
                        ))}
                      </Vstack>
                    )}
                  </Vstack>
                </Card>
              </>
            )}
            {profileSection === "emotes" && (
              <Hstack>
                {emotes.map((emote) => (
                  <Card key={emote.id}>
                    <Vstack align="center" gap={2}>
                      <img
                        src={emote.image}
                        alt={emote.slug}
                        className="h-12 w-12 rounded-md object-cover"
                        loading="lazy"
                        decoding="async"
                      />
                      <Text size="xs" color="textFaded">
                        {emote.slug}
                      </Text>
                    </Vstack>
                  </Card>
                ))}
              </Hstack>
            )}
            {profileSection === "games" && (
              <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {publishedGames
                  .sort((a, b) => b.id - a.id)
                  .map((game, index) => (
                    <GameCard key={game.name + index} game={game} />
                  ))}
              </section>
            )}
            {profileSection === "music" && (
              <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {user.tracks
                  .sort((a, b) => b.id - a.id)
                  .map((track) => (
                    <SidebarSong
                      key={track.id}
                      name={track.name}
                      artist={track.composer}
                      thumbnail={track.game.thumbnail || "/images/D2J_Icon.png"}
                      game={track.game}
                      song={track.url}
                      license={track.license}
                      allowDownload={track.allowDownload}
                    />
                  ))}
              </section>
            )}
            {profileSection === "posts" && (
              <Card>
                <Vstack align="stretch" gap={3}>
                  <Text size="lg" weight="semibold">
                    Posts
                  </Text>
                  {visiblePosts.length === 0 ? (
                    <Text size="sm" color="textFaded">
                      No posts yet.
                    </Text>
                  ) : (
                    <section className="grid md:grid-cols-1 lg:grid-cols-2 gap-4">
                      {visiblePosts
                        .sort((a, b) => b.id - a.id)
                        .map((post) => (
                          <PostCard
                            post={post}
                            style="Compact"
                            key={post.id}
                            user={self}
                          />
                        ))}
                    </section>
                  )}
                </Vstack>
              </Card>
            )}
            {profileSection === "comments" && (
              <Card>
                <Vstack align="stretch" gap={3}>
                  <Text size="lg" weight="semibold">
                    Comments
                  </Text>
                  {visibleComments.length === 0 ? (
                    <Text size="sm" color="textFaded">
                      No comments yet.
                    </Text>
                  ) : (
                    <section className="grid md:grid-cols-1 lg:grid-cols-2 gap-4">
                      {visibleComments
                        .sort((a, b) => b.id - a.id)
                        .map((comment) => (
                          <CommentCard
                            key={comment.id}
                            comment={comment}
                            user={self}
                          />
                        ))}
                    </section>
                  )}
                </Vstack>
              </Card>
            )}
            {profileSection === "scores" && (
              <Card>
                <Vstack align="stretch" gap={3}>
                  <Text size="lg" weight="semibold">
                    Scores
                  </Text>
                  {bestScores.length === 0 ? (
                    <Text size="sm" color="textFaded">
                      No scores yet.
                    </Text>
                  ) : (
                    <section className="grid md:grid-cols-1 lg:grid-cols-2 gap-4">
                      {bestScores
                        .sort((a, b) => b.id - a.id)
                        .map((score) => {
                          const placement = computePlacement(score);
                          const color = placementColor(placement, colors);
                          return (
                            <Card
                              key={score.id}
                              href={`/g/${score.leaderboard.game.slug}`}
                            >
                              <Hstack className="items-center gap-3">
                                <Image
                                  src={
                                    score.leaderboard.game.thumbnail ??
                                    "/images/D2J_Icon.png"
                                  }
                                  alt="Game thumbnail"
                                  width={27}
                                  height={15}
                                  className="rounded-lg"
                                />
                                <Text>{score.leaderboard.game.name}</Text>
                                <Text color="textFaded">
                                  {score.leaderboard.name || "Leaderboard"}
                                </Text>

                                <Text color="blue">
                                  {formatScoreValue(score)}
                                </Text>

                                <Text style={{ color }}>
                                  {placement ? ordinal(placement) : "Unranked"}
                                </Text>
                              </Hstack>
                            </Card>
                          );
                        })}
                    </section>
                  )}
                </Vstack>
              </Card>
            )}
            {profileSection === "achievements" && (
              <Card>
                <Vstack align="stretch" gap={3}>
                  <Text size="lg" weight="semibold">
                    Achievements
                  </Text>
                  {user.achievements.length === 0 ? (
                    <Text size="sm" color="textFaded">
                      No achievements yet.
                    </Text>
                  ) : (
                    <Hstack wrap>
                      {user.achievements
                        .sort((a, b) => b.id - a.id)
                        .map((achievement) => {
                          const fullAch =
                            achievement.game?.achievements?.find(
                              (x) => x.id === achievement.id,
                            ) ?? achievement;

                          const haveCount: number = fullAch?.users?.length ?? 0;
                          const engagedIds = engagedUserIdsForGame(
                            achievement.game,
                          );
                          const { tier, pct } = getRarityTier(
                            haveCount,
                            engagedIds.size,
                          );
                          const style = rarityStyles[tier];

                          return (
                            <div key={achievement.id} className="relative">
                              <Tooltip
                                content={
                                  <Vstack align="start">
                                    <Hstack>
                                      <Image
                                        src={
                                          achievement.image ||
                                          achievement.game.thumbnail ||
                                          "/images/D2J_Icon.png"
                                        }
                                        width={48}
                                        height={48}
                                        alt="Achievement"
                                        className="rounded-xl w-12 h-12 object-cover"
                                      />
                                      <Vstack align="start" gap={0}>
                                        <Text color="text">
                                          {achievement.name}
                                        </Text>
                                        <Text color="textFaded" size="xs">
                                          {achievement.description}
                                        </Text>
                                        <Hstack>
                                          <Image
                                            src={
                                              achievement.game.thumbnail ||
                                              "/images/D2J_Icon.png"
                                            }
                                            alt="Game thumbnail"
                                            width={18}
                                            height={10}
                                            className="rounded-lg w-[18px] h-[10px] object-cover"
                                          />
                                          <Text color="textFaded" size="xs">
                                            {achievement.game?.name}
                                          </Text>
                                        </Hstack>
                                        <Text
                                          size="xs"
                                          style={{ color: style.text }}
                                        >
                                          {tier === "Default"
                                            ? ""
                                            : `${tier} - `}
                                          {pct.toFixed(1)}% of users achieved
                                        </Text>
                                      </Vstack>
                                    </Hstack>
                                  </Vstack>
                                }
                              >
                                <Link href={`/g/${achievement.game.slug}`}>
                                  <div
                                    className="rounded-xl p-1"
                                    style={{
                                      backgroundColor: colors["base"],
                                      borderWidth: 2,
                                      borderStyle: "solid",
                                      borderColor: style.border,
                                      boxShadow: style.glow,
                                    }}
                                  >
                                    <Image
                                      src={
                                        achievement.image ||
                                        achievement.game.thumbnail ||
                                        "/images/D2J_Icon.png"
                                      }
                                      width={48}
                                      height={48}
                                      alt="Achievement"
                                      className="rounded-lg w-12 h-12 object-cover"
                                    />
                                  </div>
                                </Link>
                              </Tooltip>

                              {tier !== "Default" && (
                                <div
                                  className="absolute -top-1 -right-1 px-1 py-0.5 rounded-md text-[10px]"
                                  style={{
                                    backgroundColor: colors["mantle"],
                                    color: style.text,
                                    border: `1px solid ${style.border}`,
                                  }}
                                >
                                  {tier}
                                </div>
                              )}
                            </div>
                          );
                        })}
                    </Hstack>
                  )}
                </Vstack>
              </Card>
            )}
          </Vstack>
        )}
      </Vstack>

      <Modal
        isOpen={isAvatarOpen}
        onOpenChange={onAvatarOpenChange}
        backdrop="opaque"
      >
        <ModalContent
          style={{
            backgroundColor: colors["mantle"],
          }}
        >
          {(onClose) => (
            <>
              <ModalHeader>
                <Vstack align="start">
                  <Text size="xl" color="text">
                    Profile picture
                  </Text>
                  <Text size="sm" color="textFaded">
                    Upload a new avatar or pick a default one
                  </Text>
                </Vstack>
              </ModalHeader>
              <ModalBody>
                <Vstack align="start" gap={3}>
                  <ImageInput
                    value={avatarDraft}
                    width={120}
                    height={120}
                    placeholder="Upload"
                    onSelect={async (file) => {
                      try {
                        const url = await uploadImage(file);
                        setAvatarDraft(url);
                      } catch (error) {
                        console.error(error);
                        addToast({ title: "Failed to upload avatar" });
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
                        onClick={() => setAvatarDraft(src)}
                        className="relative w-16 h-16 rounded-full border-2 duration-300 cursor-pointer hover:scale-[1.03] hover:brightness-110"
                        style={{
                          borderColor:
                            avatarDraft === src
                              ? colors["blue"]
                              : "transparent",
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
              </ModalBody>
              <ModalFooter>
                <Button onClick={onClose} disabled={savingProfile}>
                  Cancel
                </Button>
                <Button
                  color={avatarDraft !== avatarSrc ? "blue" : "default"}
                  onClick={async () => {
                    await saveProfile({ profilePicture: avatarDraft });
                    onClose();
                  }}
                  disabled={savingProfile || avatarDraft === avatarSrc}
                >
                  Save
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      <Modal
        isOpen={isBannerOpen}
        onOpenChange={onBannerOpenChange}
        backdrop="opaque"
      >
        <ModalContent
          style={{
            backgroundColor: colors["mantle"],
          }}
        >
          {(onClose) => (
            <>
              <ModalHeader>
                <Vstack align="start">
                  <Text size="xl" color="text">
                    Banner
                  </Text>
                  <Text size="sm" color="textFaded">
                    Upload a 3:1 banner or pick a default
                  </Text>
                </Vstack>
              </ModalHeader>
              <ModalBody>
                <Vstack align="start" gap={3}>
                  <ImageInput
                    value={bannerDraft}
                    width={440}
                    height={40}
                    placeholder="Upload"
                    onSelect={async (file) => {
                      try {
                        const url = await uploadImage(file);
                        setBannerDraft(url);
                      } catch (error) {
                        console.error(error);
                        addToast({ title: "Failed to upload banner" });
                      }
                    }}
                  />
                  <Text size="sm" color="textFaded">
                    Or choose a default banner:
                  </Text>
                  <div className="flex flex-wrap gap-2">
                    {defaultBanners.map((src, index) => (
                      <button
                        key={`banner-${index}`}
                        type="button"
                        onClick={() => setBannerDraft(src)}
                        className="relative w-40 aspect-[11/1] rounded-lg border-2 duration-300 overflow-hidden cursor-pointer hover:scale-[1.02] hover:brightness-110"
                        style={{
                          borderColor:
                            bannerDraft === src
                              ? colors["blue"]
                              : "transparent",
                        }}
                      >
                        <img
                          src={src}
                          alt={`Default banner ${index + 1}`}
                          className="h-full w-full object-cover"
                          loading="lazy"
                          decoding="async"
                        />
                      </button>
                    ))}
                  </div>
                </Vstack>
              </ModalBody>
              <ModalFooter>
                <Button onClick={onClose} disabled={savingProfile}>
                  Cancel
                </Button>
                <Button
                  color={bannerDraft !== bannerSrc ? "blue" : "default"}
                  onClick={async () => {
                    await saveProfile({ bannerPicture: bannerDraft });
                    onClose();
                  }}
                  disabled={savingProfile || bannerDraft === bannerSrc}
                >
                  Save
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      <Modal
        isOpen={isBackgroundOpen}
        onOpenChange={onBackgroundOpenChange}
        backdrop="opaque"
      >
        <ModalContent
          style={{
            backgroundColor: colors["mantle"],
          }}
        >
          {(onClose) => (
            <>
              <ModalHeader>
                <Vstack align="start">
                  <Text size="xl" color="text">
                    Background
                  </Text>
                  <Text size="sm" color="textFaded">
                    Upload a 16:9 background or pick a default
                  </Text>
                </Vstack>
              </ModalHeader>
              <ModalBody>
                <Vstack align="start" gap={3}>
                  <ImageInput
                    value={backgroundDraft}
                    width={320}
                    height={180}
                    placeholder="Upload"
                    onSelect={async (file) => {
                      try {
                        const url = await uploadImage(file);
                        setBackgroundDraft(url);
                      } catch (error) {
                        console.error(error);
                        addToast({ title: "Failed to upload background" });
                      }
                    }}
                  />
                  <Text size="sm" color="textFaded">
                    Or choose a default background:
                  </Text>
                  <div className="flex flex-wrap gap-2">
                    {defaultBackgrounds.map((src, index) => (
                      <button
                        key={`background-${index}`}
                        type="button"
                        onClick={() => setBackgroundDraft(src)}
                        className="relative w-40 aspect-video rounded-lg border-2 duration-300 overflow-hidden cursor-pointer hover:scale-[1.02] hover:brightness-110"
                        style={{
                          borderColor:
                            backgroundDraft === src
                              ? colors["blue"]
                              : "transparent",
                        }}
                      >
                        <img
                          src={src}
                          alt={`Default background ${index + 1}`}
                          className="h-full w-full object-cover"
                          loading="lazy"
                          decoding="async"
                        />
                      </button>
                    ))}
                  </div>
                </Vstack>
              </ModalBody>
              <ModalFooter>
                <Button onClick={onClose} disabled={savingProfile}>
                  Cancel
                </Button>
                <Button
                  color={backgroundDraft !== backgroundSrc ? "blue" : "default"}
                  onClick={async () => {
                    await saveProfile({ profileBackground: backgroundDraft });
                    onClose();
                  }}
                  disabled={savingProfile || backgroundDraft === backgroundSrc}
                >
                  Save
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      <Modal
        isOpen={isNameOpen}
        onOpenChange={onNameOpenChange}
        backdrop="opaque"
      >
        <ModalContent
          style={{
            backgroundColor: colors["mantle"],
          }}
        >
          {(onClose) => (
            <>
              <ModalHeader>
                <Vstack align="start">
                  <Text size="xl" color="text">
                    Display name
                  </Text>
                  <Text size="sm" color="textFaded">
                    Update how your name appears on your profile
                  </Text>
                </Vstack>
              </ModalHeader>
              <ModalBody>
                <Input
                  value={nameDraft}
                  onValueChange={setNameDraft}
                  placeholder="Display name"
                />
              </ModalBody>
              <ModalFooter>
                <Button onClick={onClose} disabled={savingProfile}>
                  Cancel
                </Button>
                <Button
                  color={
                    nameDraft.trim() !== (user.name ?? "").trim()
                      ? "blue"
                      : "default"
                  }
                  onClick={async () => {
                    await saveProfile({ name: nameDraft });
                    onClose();
                  }}
                  disabled={
                    savingProfile ||
                    nameDraft.trim() === (user.name ?? "").trim()
                  }
                >
                  Save
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      <Modal
        isOpen={isBioOpen}
        onOpenChange={onBioOpenChange}
        backdrop="opaque"
      >
        <ModalContent
          style={{
            backgroundColor: colors["mantle"],
          }}
        >
          {(onClose) => (
            <>
              <ModalHeader>
                <Vstack align="start">
                  <Text size="xl" color="text">
                    Edit bio
                  </Text>
                  <Text size="sm" color="textFaded">
                    Update your profile bio
                  </Text>
                </Vstack>
              </ModalHeader>
              <ModalBody>
                {isBioOpen ? (
                  <Editor
                    content={bioDraft}
                    setContent={setBioDraft}
                    format="markdown"
                  />
                ) : (
                  <div className="min-h-[160px]" />
                )}
              </ModalBody>
              <ModalFooter>
                <Button onClick={onClose} disabled={savingProfile}>
                  Cancel
                </Button>
                <Button
                  color={bioDraft !== (user.bio ?? "") ? "blue" : "default"}
                  onClick={async () => {
                    await saveProfile({ bio: bioDraft });
                    onClose();
                  }}
                  disabled={savingProfile || bioDraft === (user.bio ?? "")}
                >
                  Save
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      <Modal
        isOpen={isPronounsOpen}
        onOpenChange={onPronounsOpenChange}
        backdrop="opaque"
      >
        <ModalContent
          style={{
            backgroundColor: colors["mantle"],
          }}
        >
          {(onClose) => (
            <>
              <ModalHeader>
                <Vstack align="start">
                  <Text size="xl" color="text">
                    Pronouns
                  </Text>
                  <Text size="sm" color="textFaded">
                    Add pronouns to your profile
                  </Text>
                </Vstack>
              </ModalHeader>
              <ModalBody>
                <Vstack align="start" gap={3}>
                  <Vstack align="start" gap={2}>
                    <Text color="textFaded" size="xs">
                      Presets
                    </Text>
                    <Hstack wrap className="gap-2">
                      {[
                        "she/her",
                        "he/him",
                        "they/them",
                        "she/they",
                        "he/they",
                        "any pronouns",
                        "ask for pronouns",
                      ].map((preset) => (
                        <Button
                          key={preset}
                          size="xs"
                          variant="ghost"
                          color={
                            pronounsDraft.toLowerCase() === preset
                              ? "blue"
                              : "default"
                          }
                          onClick={() => setPronounsDraft(preset)}
                        >
                          {preset}
                        </Button>
                      ))}
                    </Hstack>
                  </Vstack>
                  <Vstack align="start" gap={2}>
                    <Text color="textFaded" size="xs">
                      Custom
                    </Text>
                    <Input
                      placeholder="Type your pronouns"
                      value={pronounsDraft}
                      onValueChange={setPronounsDraft}
                    />
                  </Vstack>
                </Vstack>
              </ModalBody>
              <ModalFooter>
                <Button onClick={onClose} disabled={savingProfile}>
                  Cancel
                </Button>
                <Button
                  color={
                    (pronounsDraft.trim() || "") !==
                    ((user.pronouns ?? "").trim() || "")
                      ? "blue"
                      : "default"
                  }
                  onClick={async () => {
                    await saveProfile({ pronouns: pronounsDraft });
                    onClose();
                  }}
                  disabled={
                    savingProfile ||
                    (pronounsDraft.trim() || "") ===
                      ((user.pronouns ?? "").trim() || "")
                  }
                >
                  Save
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      <Modal
        isOpen={isLinksOpen}
        onOpenChange={onLinksOpenChange}
        backdrop="opaque"
      >
        <ModalContent
          style={{
            backgroundColor: colors["mantle"],
          }}
        >
          {(onClose) => (
            <>
              <ModalHeader>
                <Vstack align="start">
                  <Text size="xl" color="text">
                    Links
                  </Text>
                  <Text size="sm" color="textFaded">
                    Add links to your profile
                  </Text>
                </Vstack>
              </ModalHeader>
              <ModalBody>
                <Vstack align="stretch" gap={3}>
                  {linksDraft.map((link, index) => (
                    <Hstack key={`link-${index}`}>
                      <Input
                        value={link.label}
                        onValueChange={(value) => {
                          setLinksDraft((prev) => {
                            const next = [...prev];
                            next[index] = { ...next[index], label: value };
                            return next;
                          });
                        }}
                        placeholder="Label"
                        className="max-w-[160px]"
                      />
                      <Input
                        value={link.url}
                        onValueChange={(value) => {
                          setLinksDraft((prev) => {
                            const next = [...prev];
                            next[index] = { ...next[index], url: value };
                            return next;
                          });
                        }}
                        placeholder="https://example.com"
                      />
                      <Button
                        size="sm"
                        color="red"
                        icon="trash"
                        onClick={() => {
                          setLinksDraft((prev) =>
                            prev.filter((_item, idx) => idx !== index),
                          );
                        }}
                      />
                    </Hstack>
                  ))}
                  <Button
                    size="sm"
                    icon="plus"
                    onClick={() =>
                      setLinksDraft((prev) => [...prev, { url: "", label: "" }])
                    }
                  >
                    Add link
                  </Button>
                </Vstack>
              </ModalBody>
              <ModalFooter>
                <Button onClick={onClose} disabled={savingProfile}>
                  Cancel
                </Button>
                <Button
                  color={linksChanged ? "blue" : "default"}
                  onClick={async () => {
                    await saveProfile({ links: linksDraft });
                    onClose();
                  }}
                  disabled={savingProfile || !linksChanged}
                >
                  Save
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      <Modal
        isOpen={isRecOpen}
        onOpenChange={onRecOpenChange}
        backdrop="opaque"
      >
        <ModalContent
          style={{
            backgroundColor: colors["mantle"],
          }}
        >
          {(onClose) => (
            <>
              <ModalHeader>
                <Vstack align="start">
                  <Text size="xl" color="text">
                    Edit recommendations
                  </Text>
                  <Text size="sm" color="textFaded">
                    Choose up to 5 {recType}.
                  </Text>
                </Vstack>
              </ModalHeader>
              <ModalBody>
                <Vstack align="stretch" gap={3}>
                  <Input
                    value={recSearch}
                    onValueChange={setRecSearch}
                    placeholder={`Search ${recType}`}
                  />
                  {recLoading && <Text size="sm">Loading...</Text>}
                  <Vstack align="stretch" gap={2}>
                    {(recType === "games"
                      ? recResults.games
                      : recType === "posts"
                        ? recResults.posts
                        : recResults.tracks
                    )
                      .filter((item) => !recSelected.includes(item.id))
                      .slice(0, 8)
                      .map((item) => (
                        <Card key={item.id}>
                          <Hstack justify="between" className="gap-3">
                            <Vstack align="start" gap={0}>
                              <Text weight="semibold">
                                {"title" in item ? item.title : item.name}
                              </Text>
                              {"slug" in item && (
                                <Text size="xs" color="textFaded">
                                  {"title" in item
                                    ? `/p/${item.slug}`
                                    : `/g/${item.slug}`}
                                </Text>
                              )}
                            </Vstack>
                            <Button
                              size="sm"
                              icon="plus"
                              disabled={recSelected.length >= 5}
                              onClick={() =>
                                setRecSelected((prev) =>
                                  prev.includes(item.id)
                                    ? prev
                                    : [...prev, item.id].slice(0, 5),
                                )
                              }
                            >
                              Add
                            </Button>
                          </Hstack>
                        </Card>
                      ))}
                  </Vstack>

                  <Vstack align="stretch" gap={2}>
                    <Text size="sm" color="textFaded">
                      Selected ({recSelected.length}/5)
                    </Text>
                    {recSelectedItems.length === 0 ? (
                      <Text size="sm" color="textFaded">
                        No items selected.
                      </Text>
                    ) : (
                      recSelectedItems.map((item) => (
                        <Card key={`selected-${item.id}`}>
                          <Hstack justify="between">
                            <Vstack align="start" gap={0}>
                              <Text size="sm">
                                {"title" in item ? item.title : item.name}
                              </Text>
                              {"slug" in item && (
                                <Text size="xs" color="textFaded">
                                  {"title" in item
                                    ? `/p/${item.slug}`
                                    : `/g/${item.slug}`}
                                </Text>
                              )}
                            </Vstack>
                            <Button
                              size="sm"
                              icon="x"
                              onClick={() =>
                                setRecSelected((prev) =>
                                  prev.filter((itemId) => itemId !== item.id),
                                )
                              }
                            >
                              Remove
                            </Button>
                          </Hstack>
                        </Card>
                      ))
                    )}
                  </Vstack>
                </Vstack>
              </ModalBody>
              <ModalFooter>
                <Button onClick={onClose} disabled={savingProfile}>
                  Cancel
                </Button>
                <Button
                  color="blue"
                  onClick={async () => {
                    await saveRecommendations();
                    onClose();
                  }}
                  disabled={savingProfile}
                >
                  Save
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      <Modal
        isOpen={isRolesOpen}
        onOpenChange={onRolesOpenChange}
        backdrop="opaque"
      >
        <ModalContent
          style={{
            backgroundColor: colors["mantle"],
          }}
        >
          {(onClose) => (
            <>
              <ModalHeader>
                <Vstack align="start">
                  <Text size="xl" color="text">
                    Roles
                  </Text>
                  <Text size="sm" color="textFaded">
                    Update your profile roles
                  </Text>
                </Vstack>
              </ModalHeader>
              <ModalBody>
                <Vstack align="start" gap={4}>
                  <Vstack align="start">
                    <Text color="text">Primary roles</Text>
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
                                    roles.find(
                                      (findrole) => findrole.slug == role,
                                    )?.name || "Unknown",
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
                  <Vstack align="start">
                    <Text color="text">Secondary roles</Text>
                    <Dropdown
                      multiple
                      selectedValues={secondaryRoles}
                      onSelectionChange={(selection) => {
                        setSecondaryRoles(selection as Set<string>);
                      }}
                      position="top"
                      trigger={
                        <Button size="sm">
                          {secondaryRoles.size > 0
                            ? Array.from(secondaryRoles)
                                .map(
                                  (role) =>
                                    roles.find(
                                      (findrole) => findrole.slug == role,
                                    )?.name || "Unknown",
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
                </Vstack>
              </ModalBody>
              <ModalFooter>
                <Button onClick={onClose} disabled={savingProfile}>
                  Cancel
                </Button>
                <Button
                  color={
                    primaryRoles.size !== user.primaryRoles.length ||
                    secondaryRoles.size !== user.secondaryRoles.length ||
                    Array.from(primaryRoles).some(
                      (role) => !user.primaryRoles.some((r) => r.slug === role),
                    ) ||
                    Array.from(secondaryRoles).some(
                      (role) =>
                        !user.secondaryRoles.some((r) => r.slug === role),
                    )
                      ? "blue"
                      : "default"
                  }
                  onClick={async () => {
                    await saveProfile({
                      primaryRoles,
                      secondaryRoles,
                    });
                    onClose();
                  }}
                  disabled={
                    savingProfile ||
                    (primaryRoles.size === user.primaryRoles.length &&
                      secondaryRoles.size === user.secondaryRoles.length &&
                      Array.from(primaryRoles).every((role) =>
                        user.primaryRoles.some((r) => r.slug === role),
                      ) &&
                      Array.from(secondaryRoles).every((role) =>
                        user.secondaryRoles.some((r) => r.slug === role),
                      ))
                  }
                >
                  Save
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
