"use client";

import { use, useMemo } from "react";
import { useState, useEffect } from "react";
import { getCookie } from "@/helpers/cookie";
import { addToast } from "@heroui/react";
import { Tabs, Tab } from "@/framework/Tabs";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@/framework/Table";
import { Pagination } from "@/framework/Pagination";
import { GameType } from "@/types/GameType";
import { UserType } from "@/types/UserType";
import { getGame, getRatingCategories } from "@/requests/game";
import { getSelf } from "@/requests/user";
import Image from "next/image";
import {
  AlertTriangle,
  Award,
  Badge as LucideBadge,
  CircleHelp,
  MessageCircleMore,
  Star,
} from "lucide-react";
import CommentCard from "@/components/posts/CommentCard";
import { LeaderboardType } from "@/types/LeaderboardType";
import { deleteScore } from "@/helpers/score";
import { postScore } from "@/requests/score";
import { postRating } from "@/requests/rating";
import { RatingType } from "@/types/RatingType";
import { RatingCategoryType } from "@/types/RatingCategoryType";
import { ActiveJamResponse, getCurrentJam } from "@/helpers/jam";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
} from "recharts";
import CreateComment from "@/components/create-comment";
import { useTheme } from "@/providers/SiteThemeProvider";
import { Chip } from "@/framework/Chip";
import { Hstack, Vstack } from "@/framework/Stack";
import ThemedProse from "@/components/themed-prose";
import { Button } from "@/framework/Button";
import { Link } from "@/framework/Link";
import { useTranslations } from "next-intl";
import Text from "@/framework/Text";
import Tooltip from "@/framework/Tooltip";
import SidebarSong from "@/components/sidebar/SidebarSong";
import { BASE_URL } from "@/requests/config";
import Popover from "@/framework/Popover";
import Modal from "@/framework/Modal";
import Icon, { IconName } from "@/framework/Icon";
import { Card } from "@/framework/Card";
import { Avatar } from "@/framework/Avatar";

const platformOrder: Record<string, number> = {
  Windows: 1,
  MacOS: 2,
  Linux: 3,
  Web: 4,
  Mobile: 5,
};

function getPlatformIcon(platform: string): IconName | undefined {
  switch (platform) {
    case "Linux":
      return "silinux";
    case "Mobile":
      return "smartphone";
    case "Windows":
      return "grid2x2";
    case "MacOS":
      return "custommacos";
    case "Web":
      return "sihtml5";
    default:
      return undefined;
  }
}

export default function ClientGamePage({
  params,
}: {
  params: Promise<{ gameSlug: string }>;
}) {
  const resolvedParams = use(params);
  const gameSlug = resolvedParams.gameSlug;
  const [game, setGame] = useState<GameType | null>(null);
  const [user, setUser] = useState<UserType | null>(null);
  const [page, setPage] = useState(1);
  const [selectedScore, setSelectedScore] = useState<string>("");
  const [selectedLeaderboard, setSelectedLeaderboard] =
    useState<LeaderboardType>();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isOpen2, setIsOpen2] = useState<boolean>(false);
  const [hoverStars, setHoverStars] = useState<{ [key: number]: number }>({});
  const [hoverCategory, setHoverCategory] = useState<number | null>(null);
  const [selectedStars, setSelectedStars] = useState<{ [key: number]: number }>(
    {}
  );
  const [ratingCategories, setRatingCategories] = useState<
    RatingCategoryType[]
  >([]);
  const [activeJamResponse, setActiveJamResponse] =
    useState<ActiveJamResponse | null>(null);

  const { siteTheme, colors } = useTheme();
  const t = useTranslations();

  const engagedUserIds = useMemo(() => {
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
      const uid = r?.userId;
      if (uid != null) ids.add(uid);
    }

    return ids;
  }, [game]);

  type RarityTier =
    | "Abyssal"
    | "Diamond"
    | "Gold"
    | "Silver"
    | "Bronze"
    | "Default";
  function getRarityTier(
    haveCount: number,
    totalEngaged: number
  ): { tier: RarityTier; pct: number } {
    const pct = totalEngaged > 0 ? (haveCount / totalEngaged) * 100 : 0;

    if (totalEngaged >= 40 && pct <= 5) return { tier: "Abyssal", pct };
    if (totalEngaged >= 20 && pct <= 10) return { tier: "Diamond", pct };
    if (totalEngaged >= 10 && pct <= 25) return { tier: "Gold", pct };
    if (totalEngaged >= 5 && pct <= 50) return { tier: "Silver", pct };
    if (totalEngaged >= 5 && pct <= 100) return { tier: "Bronze", pct };
    return { tier: "Default", pct };
  }

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

  useEffect(() => {
    const fetchGameAndUser = async () => {
      const gameResponse = await getGame(gameSlug);

      let gameData;
      if (gameResponse.ok) {
        gameData = await gameResponse.json();

        setGame(gameData);
      }

      const ratingResponse = await getRatingCategories(true);
      const ratingCategories = await ratingResponse.json();
      setRatingCategories(ratingCategories.data);

      const jamData = await getCurrentJam();
      setActiveJamResponse(jamData);

      // Fetch the logged-in user data
      if (getCookie("token")) {
        try {
          const userResponse = await getSelf();

          if (userResponse.ok) {
            const userData = await userResponse.json();
            setUser(userData);

            if (gameData) {
              const ratings = userData.ratings
                .filter((rating: RatingType) => rating.gameId == gameData.id)
                .reduce(
                  (
                    acc: { [key: number]: number },
                    rating: { categoryId: number; value: number }
                  ) => {
                    acc[rating.categoryId] = rating.value;
                    return acc;
                  },
                  {}
                );

              setSelectedStars(ratings);
            }
          }
        } catch (error) {
          console.error(error);
        }
      }
    };

    fetchGameAndUser();
  }, [gameSlug]);

  function ordinal_suffix_of(i: number) {
    const j = i % 10,
      k = i % 100;
    if (j === 1 && k !== 11) {
      return i + "st";
    }
    if (j === 2 && k !== 12) {
      return i + "nd";
    }
    if (j === 3 && k !== 13) {
      return i + "rd";
    }
    return i + "th";
  }

  const uploadEvidence = async (file: File) => {
    const formData = new FormData();
    formData.append("upload", file);

    const endpoint =
      process.env.NEXT_PUBLIC_MODE === "PROD"
        ? "https://d2jam.com/api/v1/image"
        : "http://localhost:3005/api/v1/image";

    const res = await fetch(endpoint, {
      method: "POST",
      body: formData,
      headers: { authorization: `Bearer ${getCookie("token")}` },
      credentials: "include",
    });

    if (!res.ok) {
      addToast({ title: "Failed to upload image" });
      throw new Error("Upload failed");
    }
    const json = await res.json();
    addToast({ title: json.message });
    return json.data as string; // URL
  };

  if (!game) return <div>Loading...</div>;

  // Check if the logged-in user is the creator or a contributor
  const isEditable =
    user &&
    game.team.users.some((contributor: UserType) => contributor.id === user.id);

  if (!game.published && !isEditable) {
    return <p>This game has not been published</p>;
  }

  return (
    <>
      <div
        style={{
          backgroundColor: siteTheme.colors["mantle"],
          borderColor: siteTheme.colors["base"],
          color: siteTheme.colors["text"],
        }}
        className="border-2 relative rounded-xl overflow-hidden"
      >
        <div
          className="h-60 relative"
          style={{
            backgroundColor: colors["base"],
          }}
        >
          {(game.thumbnail || game.banner) && (
            <Image
              src={game.banner || game.thumbnail || ""}
              alt={`${game.name}'s banner`}
              className="object-cover"
              fill
            />
          )}
        </div>
        <div
          className="flex -mt-2 backdrop-blur-md border-t-1"
          style={{
            borderColor: colors["crust"],
          }}
        >
          <div className="w-2/3 p-4 flex flex-col gap-4">
            <div>
              <p className="text-4xl">{game.name}</p>
              <Hstack>
                <p
                  style={{
                    color: colors["textFaded"],
                  }}
                >
                  By{" "}
                  {game.team.name ||
                    (game.team.users.length == 1
                      ? game.team.owner.name
                      : `${game.team.owner.name}'s team`)}{" "}
                </p>
                <Chip
                  className="opacity-50"
                  color={
                    game.category == "REGULAR"
                      ? "blue"
                      : game.category == "ODA"
                      ? "purple"
                      : "pink"
                  }
                  key={game.category}
                >
                  {game.category}
                </Chip>
              </Hstack>
            </div>
            <ThemedProse>
              <div
                dangerouslySetInnerHTML={{
                  __html: game.description || t("General.NoDescription"),
                }}
              />
            </ThemedProse>
            <Hstack>
              {[
                ...new Set(
                  game.downloadLinks.sort(
                    (a, b) =>
                      (platformOrder[a.platform] ?? 99) -
                      (platformOrder[b.platform] ?? 99)
                  )
                ),
              ].map((downloadLink) => (
                <Button
                  icon={getPlatformIcon(downloadLink.platform)}
                  key={downloadLink.id}
                  href={downloadLink.url}
                >
                  {downloadLink.platform}
                </Button>
              ))}
            </Hstack>
          </div>
          <div className="flex flex-col w-1/3 gap-4 p-4">
            <Card>
              <Vstack align="stretch">
                <Hstack>
                  {isEditable && (
                    <div>
                      <Button icon="squarepen" href={`/g/${game.slug}/edit`}>
                        Edit
                      </Button>
                    </div>
                  )}
                  {isEditable && game.category != "ODA" && (
                    <div>
                      <Button icon="users" href={`/team`}>
                        Edit Team
                      </Button>
                    </div>
                  )}
                </Hstack>
                <>
                  <p
                    className="text-xs"
                    style={{
                      color: colors["textFaded"],
                    }}
                  >
                    AUTHORS
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {game.team.users.map((user) => (
                      <Chip
                        key={user.id}
                        avatarSrc={user.profilePicture}
                        href={`/u/${user.slug}`}
                      >
                        {user.name}
                      </Chip>
                    ))}
                  </div>
                </>

                {game.tags && game.tags.length > 0 && (
                  <>
                    <p
                      className="text-xs"
                      style={{
                        color: colors["textFaded"],
                      }}
                    >
                      TAGS
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {game.tags.map((tag) => (
                        <Chip key={tag.id}>{tag.name}</Chip>
                      ))}
                    </div>
                  </>
                )}
                {game.flags && game.flags.length > 0 && (
                  <>
                    <p
                      className="text-xs"
                      style={{
                        color: colors["textFaded"],
                      }}
                    >
                      FLAGS
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {game.flags.map((flag) => (
                        <Chip key={flag.id}>{flag.name}</Chip>
                      ))}
                    </div>
                  </>
                )}
                {game.downloadLinks && game.downloadLinks.length > 0 && (
                  <>
                    <p
                      className="text-xs"
                      style={{
                        color: colors["textFaded"],
                      }}
                    >
                      LINKS
                    </p>
                    <div className="flex flex-col gap-2 items-start">
                      {game.downloadLinks.map((link) => (
                        <Link key={link.id} href={link.url}>
                          {getPlatformIcon(link.platform) && (
                            <Icon
                              size={12}
                              name={getPlatformIcon(link.platform)}
                            />
                          )}
                          {link.platform}
                        </Link>
                      ))}
                    </div>
                  </>
                )}
              </Vstack>
            </Card>
            <Card>
              <Vstack align="start">
                <p
                  className="text-xs"
                  style={{
                    color: colors["textFaded"],
                  }}
                >
                  RATINGS
                </p>
                {activeJamResponse &&
                  activeJamResponse?.jam?.id != game.jamId && (
                    <>
                      {Object.keys(game?.scores || {})
                        .sort(
                          (a, b) =>
                            (game.scores[a].placement || 0) -
                            (game.scores[b].placement || 0)
                        )
                        .map((score) => (
                          <div
                            key={score}
                            className="grid grid-cols-[150px_100px_60px_30px] items-center gap-2"
                          >
                            <span
                              className="text-sm"
                              style={{
                                color: colors["textFaded"],
                              }}
                            >
                              {t(score)}:
                            </span>
                            <span
                              style={{
                                color:
                                  game.scores[score].placement == 1
                                    ? colors["yellow"]
                                    : game.scores[score].placement == 2
                                    ? colors["gray"]
                                    : game.scores[score].placement == 3
                                    ? colors["orange"]
                                    : game.scores[score].placement >= 4 &&
                                      game.scores[score].placement <= 5
                                    ? colors["blue"]
                                    : game.scores[score].placement >= 6 &&
                                      game.scores[score].placement <= 10
                                    ? colors["purple"]
                                    : colors["textFaded"],
                              }}
                            >
                              {(game.scores[score].averageScore / 2).toFixed(2)}{" "}
                              stars
                            </span>
                            {game.scores[score].placement && (
                              <span
                                style={{
                                  color: colors["textFaded"],
                                }}
                              >
                                (
                                {ordinal_suffix_of(
                                  game.scores[score].placement
                                )}
                                )
                              </span>
                            )}
                            <span className="flex items-center justify-center">
                              {game.scores[score].placement == 1 && (
                                <Award
                                  size={16}
                                  style={{
                                    color: colors["yellow"],
                                  }}
                                />
                              )}
                              {game.scores[score].placement == 2 && (
                                <Award
                                  size={16}
                                  style={{
                                    color: colors["gray"],
                                  }}
                                />
                              )}
                              {game.scores[score].placement == 3 && (
                                <Award
                                  size={16}
                                  style={{
                                    color: colors["orange"],
                                  }}
                                />
                              )}
                              {game.scores[score].placement >= 4 &&
                                game.scores[score].placement <= 5 && (
                                  <LucideBadge
                                    size={12}
                                    style={{
                                      color: colors["blue"],
                                    }}
                                  />
                                )}
                              {game.scores[score].placement >= 6 &&
                                game.scores[score].placement <= 10 && (
                                  <LucideBadge
                                    size={12}
                                    style={{
                                      color: colors["purple"],
                                    }}
                                  />
                                )}
                            </span>
                          </div>
                        ))}
                      <div className="w-96 h-60">
                        <ResponsiveContainer width="100%" height="100%">
                          <RadarChart
                            cx="50%"
                            cy="50%"
                            outerRadius="80%"
                            data={Object.keys(game?.scores || {}).map(
                              (score) => ({
                                subject: t(score),
                                A: game.scores[score].averageScore / 2,
                                B: game.scores[score].averageUnrankedScore / 2,
                                fullMark: 5,
                              })
                            )}
                          >
                            <PolarGrid stroke={colors["crust"]} />
                            <PolarAngleAxis
                              dataKey="subject"
                              tick={{ fill: colors["textFaded"], fontSize: 14 }}
                            />
                            <PolarRadiusAxis
                              domain={[0, 5]}
                              axisLine={false}
                              tick={false}
                            />
                            <Radar
                              name="All"
                              dataKey="B"
                              stroke={colors["magenta"]}
                              fill={colors["magentaDark"]}
                              fillOpacity={0.6}
                            />
                            <Radar
                              name="Ranked"
                              dataKey="A"
                              stroke={colors["blue"]}
                              fill={colors["blueDark"]}
                              fillOpacity={0.6}
                            />
                            <Legend />
                          </RadarChart>
                        </ResponsiveContainer>
                      </div>
                    </>
                  )}
                {isEditable && activeJamResponse?.jam?.id == game.jamId && (
                  <Text size="xs" color="textFaded">
                    You can&apos;t rate your own game
                  </Text>
                )}
                {!user && activeJamResponse?.jam?.id == game.jamId && (
                  <Text size="xs" color="textFaded">
                    You must be logged in to rate games
                  </Text>
                )}
                {!isEditable &&
                  user?.teams.filter((team) => team.game && team.game.published)
                    .length == 0 &&
                  activeJamResponse?.jam?.id == game.jamId &&
                  activeJamResponse?.phase != "Rating" &&
                  activeJamResponse?.phase != "Submission" && (
                    <Text size="xs" color="textFaded">
                      It is not the rating period
                    </Text>
                  )}
                {!isEditable &&
                  user?.teams.filter((team) => team.game && team.game.published)
                    .length == 0 &&
                  activeJamResponse?.jam?.id == game.jamId &&
                  (activeJamResponse?.phase == "Rating" ||
                    activeJamResponse?.phase == "Submission") && (
                    <Text size="xs" color="textFaded">
                      Your ratings will not count towards the rankings as you
                      did not submit a game
                    </Text>
                  )}
                <div>
                  {user &&
                    !isEditable &&
                    activeJamResponse?.jam?.id == game.jamId &&
                    (activeJamResponse?.phase == "Rating" ||
                      activeJamResponse?.phase == "Submission") && (
                      <Vstack align="start">
                        <Text size="xs" color="textFaded">
                          Ratings are automatically saved
                        </Text>
                        {[...game.ratingCategories, ...ratingCategories]
                          .sort((a, b) => b.order - a.order)
                          .map((ratingCategory) => (
                            <StarRow
                              key={ratingCategory.id}
                              id={ratingCategory.id}
                              name={t(ratingCategory.name)}
                              text={
                                ratingCategory.name == "Theme"
                                  ? game.themeJustification
                                  : ""
                              }
                              description={t(ratingCategory.description)}
                              hoverStars={hoverStars}
                              setHoverStars={setHoverStars}
                              hoverCategory={hoverCategory}
                              setHoverCategory={setHoverCategory}
                              selectedStars={selectedStars}
                              setSelectedStars={setSelectedStars}
                              gameId={game.id}
                            />
                          ))}
                        <Text size="sm" color="textFaded">
                          Leave some feedback for the creators - what did you
                          like, what could be improved? (shows below the game
                          page)
                        </Text>
                        <CreateComment gameId={game.id} size="xs" />
                      </Vstack>
                    )}
                </div>
              </Vstack>
            </Card>
            {game.leaderboards && game.leaderboards.length > 0 && (
              <Card>
                <Vstack align="start">
                  <p
                    className="text-xs"
                    style={{
                      color: colors["textFaded"],
                    }}
                  >
                    LEADERBOARD
                  </p>

                  <Tabs>
                    {game.leaderboards.map((leaderboard) => (
                      <Tab
                        key={leaderboard.id}
                        title={leaderboard.name}
                        icon={
                          leaderboard.type == "SCORE"
                            ? "trophy"
                            : leaderboard.type == "GOLF"
                            ? "landplot"
                            : leaderboard.type == "SPEEDRUN"
                            ? "rabbit"
                            : "turtle"
                        }
                      >
                        {leaderboard.scores && (
                          <>
                            <div />
                            <Table
                              bottomContent={
                                <div className="flex w-full justify-center">
                                  <Pagination
                                    showControls
                                    color="primary"
                                    variant="faded"
                                    page={page}
                                    total={Math.ceil(
                                      (leaderboard.onlyBest
                                        ? Array.from(
                                            leaderboard.scores
                                              .reduce((acc, score) => {
                                                if (
                                                  !acc.has(score.user.id) ||
                                                  acc.get(score.user.id).data <
                                                    score.data
                                                ) {
                                                  acc.set(score.user.id, score);
                                                }
                                                return acc;
                                              }, new Map())
                                              .values()
                                          )
                                        : leaderboard.scores
                                      ).length / leaderboard.maxUsersShown
                                    )}
                                    onChange={(page) => setPage(page)}
                                  />
                                </div>
                              }
                            >
                              <TableHeader>
                                <TableColumn>#</TableColumn>
                                <TableColumn>User</TableColumn>
                                <TableColumn>
                                  {leaderboard.type == "SCORE" ||
                                  leaderboard.type == "GOLF"
                                    ? "Score"
                                    : "Time"}
                                </TableColumn>
                                <TableColumn>Actions</TableColumn>
                              </TableHeader>
                              <TableBody>
                                {(leaderboard.onlyBest
                                  ? Array.from(
                                      leaderboard.scores
                                        .reduce((acc, score) => {
                                          if (
                                            !acc.has(score.user.id) ||
                                            (acc.get(score.user.id).data <
                                              score.data &&
                                              (leaderboard.type == "SCORE" ||
                                                leaderboard.type ==
                                                  "ENDURANCE")) ||
                                            (acc.get(score.user.id).data >
                                              score.data &&
                                              (leaderboard.type == "GOLF" ||
                                                leaderboard.type == "SPEEDRUN"))
                                          ) {
                                            acc.set(score.user.id, score);
                                          }
                                          return acc;
                                        }, new Map())
                                        .values()
                                    )
                                  : leaderboard.scores
                                )
                                  .sort((a, b) => {
                                    if (
                                      leaderboard.type == "GOLF" ||
                                      leaderboard.type == "SPEEDRUN"
                                    ) {
                                      return a.data - b.data;
                                    } else {
                                      return b.data - a.data;
                                    }
                                  })
                                  .slice(
                                    0 + leaderboard.maxUsersShown * (page - 1),
                                    leaderboard.maxUsersShown * page
                                  )
                                  .map((score, i) => (
                                    <TableRow key={score.id}>
                                      <TableCell
                                        style={{
                                          color: colors["textFaded"],
                                        }}
                                      >
                                        {i +
                                          1 +
                                          leaderboard.maxUsersShown *
                                            (page - 1)}
                                      </TableCell>
                                      <TableCell>
                                        <Link
                                          href={`/u/${score.user.slug}`}
                                          underline={false}
                                        >
                                          <Hstack>
                                            <Avatar
                                              src={score.user.profilePicture}
                                              size={24}
                                            />
                                            <Text color="text">
                                              {score.user.name}
                                            </Text>
                                          </Hstack>
                                        </Link>
                                      </TableCell>
                                      <TableCell
                                        style={{
                                          color: colors["blue"],
                                        }}
                                      >
                                        {leaderboard.type == "GOLF" ||
                                        leaderboard.type == "SCORE"
                                          ? score.data /
                                            10 ** leaderboard.decimalPlaces
                                          : (() => {
                                              const totalMilliseconds =
                                                score.data;
                                              const hours = Math.floor(
                                                totalMilliseconds / 3600000
                                              );
                                              const minutes = Math.floor(
                                                (totalMilliseconds % 3600000) /
                                                  60000
                                              );
                                              const seconds = Math.floor(
                                                (totalMilliseconds % 60000) /
                                                  1000
                                              );
                                              const milliseconds =
                                                totalMilliseconds % 1000;

                                              return `${
                                                hours > 0 ? `${hours}:` : ""
                                              }${minutes
                                                .toString()
                                                .padStart(2, "0")}:${seconds
                                                .toString()
                                                .padStart(2, "0")}${
                                                milliseconds > 0
                                                  ? `.${milliseconds
                                                      .toString()
                                                      .padStart(3, "0")}`
                                                  : ""
                                              }`;
                                            })()}
                                      </TableCell>
                                      <TableCell className="flex gap-2">
                                        <Button
                                          icon="eye"
                                          onClick={() => {
                                            setSelectedScore(score.evidence);
                                            setIsOpen(true);
                                          }}
                                          size="sm"
                                        />
                                        {(isEditable ||
                                          score.user.id == user?.id ||
                                          user?.mod) && (
                                          <Button
                                            color="red"
                                            icon="trash"
                                            onClick={async () => {
                                              const success = await deleteScore(
                                                score.id
                                              );
                                              if (success) {
                                                window.location.reload();
                                              }
                                            }}
                                            size="sm"
                                          />
                                        )}
                                      </TableCell>
                                    </TableRow>
                                  ))}
                              </TableBody>
                            </Table>
                          </>
                        )}
                        <div className="mt-2">
                          <Button
                            icon="plus"
                            onClick={() => {
                              setSelectedLeaderboard(leaderboard);
                              setIsOpen2(true);
                            }}
                          >
                            Submit Score
                          </Button>
                        </div>
                      </Tab>
                    ))}
                  </Tabs>
                </Vstack>
              </Card>
            )}
            {game.achievements && game.achievements.length > 0 && (
              <Card>
                <Vstack align="start">
                  <p
                    className="text-xs"
                    style={{
                      color: colors["textFaded"],
                    }}
                  >
                    ACHIEVEMENTS
                  </p>

                  <Text color="textFaded" size="xs">
                    You&apos;ve unlocked{" "}
                    {
                      game.achievements.filter(
                        (achievement) =>
                          achievement.users.filter(
                            (user2) => user?.id === user2.id
                          ).length > 0
                      ).length
                    }
                    /{game.achievements.length}
                  </Text>

                  <Hstack wrap>
                    {game.achievements
                      .sort((a, b) => {
                        const haveCount = a.users.length;
                        const haveCountB = b.users.length;
                        const users = engagedUserIds.size;
                        return haveCountB / users - haveCount / users;
                      })
                      .map((achievement) => {
                        const haveCount = achievement.users.length;
                        const { tier, pct } = getRarityTier(
                          haveCount,
                          engagedUserIds.size
                        );
                        const style = rarityStyles[tier];

                        return (
                          <div key={achievement.id} className="relative">
                            <Tooltip
                              position="top"
                              content={
                                <Vstack align="start" gap={0}>
                                  <Hstack gap={6}>
                                    <Image
                                      src={
                                        achievement.image ||
                                        "/images/D2J_Icon.png"
                                      }
                                      width={48}
                                      height={48}
                                      alt="Achievement"
                                      className="rounded-xl"
                                    />
                                    <Vstack align="start" gap={0}>
                                      <Text color="text">
                                        {achievement.name}
                                      </Text>
                                      <Text color="textFaded" size="xs">
                                        {achievement.description}
                                      </Text>
                                      <Text
                                        size="xs"
                                        style={{ color: style.text }}
                                      >
                                        {tier == "Default"
                                          ? undefined
                                          : `${tier} • `}
                                        {pct.toFixed(1)}% of users achieved
                                      </Text>
                                      <Text
                                        color={
                                          achievement.users.some(
                                            (u) => u.id === user?.id
                                          )
                                            ? "red"
                                            : "green"
                                        }
                                        size="xs"
                                      >
                                        {achievement.users.some(
                                          (u) => u.id === user?.id
                                        )
                                          ? "Click to mark as unachieved"
                                          : "Click to mark as achieved"}
                                      </Text>
                                    </Vstack>
                                  </Hstack>
                                </Vstack>
                              }
                            >
                              <button
                                onClick={async () => {
                                  if (!user) return;
                                  const hasIt = achievement.users.some(
                                    (u) => u.id === user.id
                                  );
                                  const method = hasIt ? "DELETE" : "POST";
                                  const res = await fetch(
                                    `${BASE_URL}/achievement`,
                                    {
                                      method,
                                      headers: {
                                        "Content-Type": "application/json",
                                        authorization: `Bearer ${getCookie(
                                          "token"
                                        )}`,
                                      },
                                      credentials: "include",
                                      body: JSON.stringify({
                                        achievementId: achievement.id,
                                      }),
                                    }
                                  );
                                  if (res.ok) {
                                    achievement.users = hasIt
                                      ? achievement.users.filter(
                                          (u) => u.id !== user.id
                                        )
                                      : [...achievement.users, user];
                                    setGame({
                                      ...game,
                                      achievements: [...game.achievements],
                                    });
                                  }
                                }}
                                className="rounded-xl p-1"
                                style={{
                                  backgroundColor: colors["base"],
                                  borderWidth: 2,
                                  borderStyle: "solid",
                                  borderColor: style.border,
                                  boxShadow: style.glow,
                                  opacity: achievement.users.some(
                                    (u) => u.id === user?.id
                                  )
                                    ? 1
                                    : 0.5,
                                  filter: achievement.users.some(
                                    (u) => u.id === user?.id
                                  )
                                    ? ""
                                    : "grayscale(1)",
                                }}
                              >
                                <Image
                                  src={
                                    achievement.image || "/images/D2J_Icon.png"
                                  }
                                  width={48}
                                  height={48}
                                  alt="Achievement"
                                  className="rounded-lg"
                                />
                              </button>
                            </Tooltip>

                            {tier != "Default" && (
                              <div
                                className="absolute -top-1 -right-1 px-1 py-0.5 rounded-md text-[10px]"
                                style={{
                                  backgroundColor: colors["mantle"],
                                  color: style.text,
                                  border: `1px solid ${style.border}`,
                                  filter: achievement.users.some(
                                    (u) => u.id === user?.id
                                  )
                                    ? ""
                                    : "grayscale(1)",
                                }}
                              >
                                {tier}
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </Hstack>
                </Vstack>
              </Card>
            )}
            {game.tracks && game.tracks.length > 0 && (
              <Card>
                <Vstack align="stretch">
                  <p
                    className="text-xs"
                    style={{
                      color: colors["textFaded"],
                    }}
                  >
                    MUSIC
                  </p>

                  {game.tracks.map((track) => (
                    <SidebarSong
                      key={track.id}
                      name={track.name}
                      artist={track.composer.name}
                      thumbnail={track.game.thumbnail ?? "/images/D2J_Icon.png"}
                      game={track.game.name}
                      song={track.url}
                    />
                  ))}
                </Vstack>
              </Card>
            )}
            <Card>
              <Vstack align="start">
                <p
                  className="text-xs"
                  style={{
                    color: colors["textFaded"],
                  }}
                >
                  STATS
                </p>
                <Chip>
                  Ratings Received:{" "}
                  {Math.round(
                    game.ratings.length /
                      (game.ratingCategories.length + ratingCategories.length)
                  )}
                </Chip>
                {game.category !== "EXTRA" && (
                  <Hstack>
                    <Chip>
                      Ranked Ratings Received:{" "}
                      {Math.round(
                        game.ratings.filter(
                          (rating) =>
                            rating.user.teams.filter(
                              (team) =>
                                team.game &&
                                team.game.jamId == game.jamId &&
                                team.game.published &&
                                team.game.category !== "EXTRA"
                            ).length > 0
                        ).length /
                          (game.ratingCategories.length +
                            ratingCategories.length)
                      )}
                    </Chip>

                    {Math.round(
                      game.ratings.filter(
                        (rating) =>
                          rating.user.teams.filter(
                            (team) =>
                              team.game &&
                              team.game.jamId == game.jamId &&
                              team.game.published &&
                              team.game.category !== "EXTRA"
                          ).length > 0
                      ).length /
                        (game.ratingCategories.length + ratingCategories.length)
                    ) < 5 && (
                      <Tooltip
                        content="This game needs 5 ratings received in order to be ranked after the rating period"
                        position="top"
                      >
                        <AlertTriangle size={16} className="text-red-500" />
                      </Tooltip>
                    )}
                  </Hstack>
                )}
                <Hstack>
                  <Chip>
                    Ratings Given:{" "}
                    {Math.round(
                      game.team.users.reduce(
                        (prev, cur) =>
                          prev +
                          cur.ratings.reduce(
                            (prev2, cur2) =>
                              prev2 +
                              (cur2.game.jamId === game.jamId
                                ? 1 /
                                  (cur2.game.ratingCategories.length +
                                    ratingCategories.length)
                                : 0),
                            0
                          ),
                        0
                      )
                    )}
                  </Chip>
                  {Math.round(
                    game.team.users.reduce(
                      (prev, cur) =>
                        prev +
                        cur.ratings.reduce(
                          (prev2, cur2) =>
                            prev2 +
                            (cur2.game.jamId === game.jamId
                              ? 1 /
                                (cur2.game.ratingCategories.length +
                                  ratingCategories.length)
                              : 0),
                          0
                        ),
                      0
                    )
                  ) < 5 && (
                    <Tooltip
                      content="This game needs 5 ratings given in order to be ranked after the rating period"
                      position="top"
                    >
                      <AlertTriangle
                        size={16}
                        style={{
                          color: colors["red"],
                        }}
                      />
                    </Tooltip>
                  )}
                </Hstack>
              </Vstack>
            </Card>
            <Popover
              showCloseButton
              position="center"
              shown={isOpen}
              onClose={() => {
                setIsOpen(false);
              }}
            >
              <div className="w-[300px] h-[300px]">
                <Image
                  src={selectedScore}
                  alt="Evidence image"
                  fill
                  objectFit="contain"
                />
              </div>
            </Popover>
            <Modal
              shown={isOpen2}
              onClose={() => {
                setIsOpen2(false);
              }}
              icon={
                selectedLeaderboard?.type == "SCORE"
                  ? "trophy"
                  : selectedLeaderboard?.type == "GOLF"
                  ? "landplot"
                  : selectedLeaderboard?.type == "SPEEDRUN"
                  ? "rabbit"
                  : "turtle"
              }
              title={selectedLeaderboard?.name || "Leaderboard"}
              onSubmit={async (form) => {
                // Validate evidence
                const evidenceUrl = form["evidence"];
                if (!evidenceUrl) {
                  addToast({ title: "No evidence image provided" });
                  return;
                }
                if (!selectedLeaderboard) {
                  addToast({ title: "No leaderboard selected" });
                  return;
                }

                let finalScore: number | undefined;

                if (
                  selectedLeaderboard?.type === "SPEEDRUN" ||
                  selectedLeaderboard?.type === "ENDURANCE"
                ) {
                  const hours = parseInt(form["hours"] || "0", 10) || 0;
                  const minutes = parseInt(form["minutes"] || "0", 10) || 0;
                  const seconds = parseInt(form["seconds"] || "0", 10) || 0;
                  const ms = parseInt(form["milliseconds"] || "0", 10) || 0;

                  finalScore =
                    ms + seconds * 1000 + minutes * 60_000 + hours * 3_600_000;
                } else if (
                  selectedLeaderboard?.type === "SCORE" ||
                  selectedLeaderboard?.type === "GOLF"
                ) {
                  finalScore = parseInt(form["score"] || "", 10);
                }

                if (finalScore == null || Number.isNaN(finalScore)) {
                  addToast({ title: "Please enter a valid score/time." });
                  return;
                }

                const ok = await postScore(
                  finalScore,
                  evidenceUrl,
                  selectedLeaderboard.id
                );
                if (ok) {
                  setIsOpen2(false);
                  window.location.reload();
                }
              }}
              fields={[
                ...(selectedLeaderboard?.type === "SPEEDRUN" ||
                selectedLeaderboard?.type === "ENDURANCE"
                  ? ([
                      {
                        type: "number",
                        name: "hours",
                        label: "Hours",
                        description: "Enter hours",
                        min: 0,
                        max: 24,
                        defaultValue: "0",
                      },
                      {
                        type: "number",
                        name: "minutes",
                        label: "Minutes",
                        description: "Enter minutes",
                        min: 0,
                        max: 59,
                        defaultValue: "0",
                      },
                      {
                        type: "number",
                        name: "seconds",
                        label: "Seconds",
                        description: "Enter seconds",
                        min: 0,
                        max: 59,
                        defaultValue: "0",
                      },
                      {
                        type: "number",
                        name: "milliseconds",
                        label: "Milliseconds",
                        description:
                          "Enter milliseconds (enter all 3 digits, .43 -> 430)",
                        min: 0,
                        max: 999,
                        defaultValue: "0",
                      },
                    ] as const)
                  : []),
                ...(selectedLeaderboard?.type === "SCORE" ||
                selectedLeaderboard?.type === "GOLF"
                  ? ([
                      {
                        type: "number",
                        name: "score",
                        label: "Score",
                        description: "Enter your score",
                        required: true,
                      },
                    ] as const)
                  : []),
                {
                  type: "imageUpload",
                  name: "evidence",
                  label: "Evidence Picture",
                  description:
                    "Upload a screenshot/photo to verify your result.",
                  upload: uploadEvidence,
                  accept: "image/*",
                  previewHeight: 240,
                },
              ]}
            />
          </div>
        </div>
      </div>
      <div className="my-10 w-fit">
        <CreateComment gameId={game.id} />
      </div>

      <div className="flex flex-col gap-3">
        {game?.comments
          ?.sort((a, b) => b.id - a.id)
          .map((comment) => (
            <div key={comment.id}>
              <CommentCard comment={comment} />
            </div>
          ))}
      </div>
    </>
  );
}

function StarRow({
  id,
  name,
  text,
  description,
  hoverStars,
  setHoverStars,
  selectedStars,
  setSelectedStars,
  hoverCategory,
  setHoverCategory,
  gameId,
}: {
  id: number;
  name: string;
  text?: string;
  description: string;
  hoverStars: { [key: number]: number };
  setHoverStars: (stars: { [key: number]: number }) => void;
  selectedStars: { [key: number]: number };
  setSelectedStars: (stars: { [key: number]: number }) => void;
  hoverCategory: number | null;
  setHoverCategory: (id: number | null) => void;
  gameId: number;
}) {
  const [newlyClicked, setNewlyClicked] = useState<boolean>(false);
  const { colors } = useTheme();

  return (
    <div className="flex items-center gap-4">
      <div className="flex">
        {[2, 4, 6, 8, 10].map((value) => (
          <StarElement
            key={value}
            id={id}
            value={value}
            hoverStars={hoverStars}
            setHoverStars={setHoverStars}
            hoverCategoryId={hoverCategory}
            setHoverCategoryId={setHoverCategory}
            selectedStars={selectedStars}
            setSelectedStars={setSelectedStars}
            newlyClicked={newlyClicked}
            setNewlyClicked={setNewlyClicked}
            gameId={gameId}
          />
        ))}
      </div>
      <Text color="textFaded">{name}</Text>
      <Tooltip content={description} position="top">
        <CircleHelp
          size={16}
          style={{
            color: colors["textFaded"],
          }}
        />
      </Tooltip>
      {text && (
        <Tooltip
          content={
            <div>
              <p className="text-lg font-bold">Theme Justification</p>
              <p>{text}</p>
            </div>
          }
        >
          <MessageCircleMore size={16} />
        </Tooltip>
      )}
    </div>
  );
}

function StarElement({
  id,
  value,
  hoverStars,
  setHoverStars,
  selectedStars,
  setSelectedStars,
  hoverCategoryId,
  setHoverCategoryId,
  newlyClicked,
  setNewlyClicked,
  gameId,
}: {
  id: number;
  value: number;
  hoverStars: { [key: number]: number };
  setHoverStars: (stars: { [key: number]: number }) => void;
  selectedStars: { [key: number]: number };
  setSelectedStars: (stars: { [key: number]: number }) => void;
  hoverCategoryId: number | null;
  setHoverCategoryId: (id: number | null) => void;
  newlyClicked: boolean;
  setNewlyClicked: (arg0: boolean) => void;
  gameId: number;
}) {
  const { colors } = useTheme();

  return (
    <div
      className="relative w-6 h-6 cursor-pointer"
      onMouseEnter={() => setHoverCategoryId(id)}
      onMouseLeave={() => {
        setHoverCategoryId(null);
        setHoverStars({});
        setNewlyClicked(false);
      }}
    >
      {/* Full Star */}
      <Star
        fill="currentColor"
        className={`absolute transition-all duration-300`}
        style={{
          color:
            hoverStars[id] > 0 &&
            hoverStars[id] >= value &&
            hoverCategoryId == id &&
            !newlyClicked
              ? colors["orangeDark"]
              : selectedStars[id] > 0 && selectedStars[id] >= value
              ? colors["yellow"]
              : colors["base"],
        }}
      />
      {/* Half Star (Overlapping Left Side) */}
      <Star
        fill="currentColor"
        className={`absolute transition-all duration-300`}
        style={{
          clipPath: "inset(0 50% 0 0)",
          color:
            hoverStars[id] > 0 &&
            hoverStars[id] >= value - 1 &&
            hoverCategoryId == id &&
            !newlyClicked
              ? colors["orangeDark"]
              : selectedStars[id] > 0 && selectedStars[id] >= value - 1
              ? colors["yellow"]
              : colors["base"],
        }} // Show only left half
      />
      {/* Left Half (Triggers value - 1) */}
      <div
        className="absolute left-0 top-0 w-3 h-6"
        onMouseEnter={() => {
          setHoverStars({ ...hoverStars, [id]: value - 1 });
          setNewlyClicked(false);
        }}
        onClick={() => {
          setSelectedStars({ ...selectedStars, [id]: value - 1 });
          setNewlyClicked(true);
          postRating(gameId, id, value - 1);
        }}
      />
      {/* Right Half (Triggers value) */}
      <div
        className="absolute right-0 top-0 w-3 h-6"
        onMouseEnter={() => {
          setHoverStars({ ...hoverStars, [id]: value });
          setNewlyClicked(false);
        }}
        onClick={() => {
          setSelectedStars({ ...selectedStars, [id]: value });
          setNewlyClicked(true);
          postRating(gameId, id, value);
        }}
      />
    </div>
  );
}
