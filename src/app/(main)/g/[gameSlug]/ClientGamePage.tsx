"use client";

import { use } from "react";
import { useState, useEffect } from "react";
import { getCookie } from "@/helpers/cookie";
import {
  addToast,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  useDisclosure,
  User,
} from "@heroui/react";
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
  LandPlot,
  MessageCircleMore,
  Rabbit,
  Star,
  Trophy,
  Turtle,
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
import { Input } from "@/framework/Input";
import { Link } from "@/framework/Link";
import { useTranslations } from "next-intl";
import Text from "@/framework/Text";
import Tooltip from "@/framework/Tooltip";
import SidebarSong from "@/components/sidebar/SidebarSong";
import { BASE_URL } from "@/requests/config";

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
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const {
    isOpen: isOpen2,
    onOpen: onOpen2,
    onOpenChange: onOpenChange2,
  } = useDisclosure();
  const [evidenceUrl, setEvidenceUrl] = useState<string>();
  const [score, setScore] = useState<number>(0);
  const [milliseconds, setMilliseconds] = useState<number>(0);
  const [seconds, setSeconds] = useState<number>(0);
  const [minutes, setMinutes] = useState<number>(0);
  const [hours, setHours] = useState<number>(0);
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

  useEffect(() => {
    const fetchGameAndUser = async () => {
      // Fetch the game data
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
          background: siteTheme.colors["mantle"],
          borderColor: siteTheme.colors["base"],
          color: siteTheme.colors["text"],
        }}
        className="border-2 relative rounded-xl overflow-hidden"
      >
        <div
          className="h-60 relative"
          style={{
            background: colors["base"],
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
              <p
                style={{
                  color: colors["textFaded"],
                }}
              >
                By{" "}
                {game.team.name ||
                  (game.team.users.length == 1
                    ? game.team.owner.name
                    : `${game.team.owner.name}'s team`)}
              </p>
            </div>
            <ThemedProse>
              <div
                dangerouslySetInnerHTML={{
                  __html: game.description || t("General.NoDescription"),
                }}
              />
            </ThemedProse>
          </div>
          <div className="flex flex-col w-1/3 gap-4 p-4">
            {isEditable && (
              <div>
                <Button icon="squarepen" href={`/g/${game.slug}/edit`}>
                  Edit
                </Button>
              </div>
            )}
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
                    <Chip key={tag.id} avatarSrc={tag.icon}>
                      {tag.name}
                    </Chip>
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
                      {link.platform}
                    </Link>
                  ))}
                </div>
              </>
            )}
            {/* <div className="flex flex-col gap-2">
              <p className="text-[#666] dark:text-[#ccc] text-xs">
                ACHIEVEMENTS
              </p>
              <Card>
                <CardBody className="text-[#333] dark:text-white">N/A</CardBody>
              </Card>
            </div> */}
            <div className="flex flex-col gap-3">
              <p
                className="text-xs"
                style={{
                  color: colors["textFaded"],
                }}
              >
                RATINGS
              </p>
              {((activeJamResponse &&
                activeJamResponse?.jam?.id != game.jamId) ||
                user?.id == 3) && (
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
                            ({ordinal_suffix_of(game.scores[score].placement)})
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
                        data={Object.keys(game?.scores || {}).map((score) => ({
                          subject: t(score),
                          A: game.scores[score].averageScore / 2,
                          B: game.scores[score].averageUnrankedScore / 2,
                          fullMark: 5,
                        }))}
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
                    Your ratings will not count towards the rankings as you did
                    not submit a game
                  </Text>
                )}
              <div>
                {user &&
                  !isEditable &&
                  activeJamResponse?.jam?.id == game.jamId &&
                  (activeJamResponse?.phase == "Rating" ||
                    activeJamResponse?.phase == "Submission") &&
                  [...game.ratingCategories, ...ratingCategories]
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
              </div>
            </div>
            {game.leaderboards && game.leaderboards.length > 0 && (
              <div className="flex flex-col gap-2">
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
                          <div className="p-1" />
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
                                        leaderboard.maxUsersShown * (page - 1)}
                                    </TableCell>
                                    <TableCell>
                                      <User
                                        className="flex justify-start"
                                        name={score.user.name}
                                        avatarProps={{
                                          src: score.user.profilePicture,
                                          className: "w-6 h-6",
                                          size: "sm",
                                        }}
                                      />
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
                                              (totalMilliseconds % 60000) / 1000
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
                                          onOpen();
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
                      <div className="mt-4">
                        <Button
                          icon="plus"
                          onClick={() => {
                            setSelectedLeaderboard(leaderboard);
                            setScore(0);
                            setEvidenceUrl(undefined);
                            onOpen2();
                          }}
                        >
                          Submit Score
                        </Button>
                      </div>
                    </Tab>
                  ))}
                </Tabs>
              </div>
            )}
            {game.achievements && game.achievements.length > 0 && (
              <div className="flex flex-col gap-2">
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

                {game.achievements.map((achievement) => (
                  <div
                    key={achievement.id}
                    style={{
                      backgroundColor: colors["base"],
                    }}
                    className="w-fit h-fit"
                  >
                    <Tooltip
                      content={
                        <Hstack>
                          <Image
                            src={achievement.image || "/images/D2J_Icon.png"}
                            width={48}
                            height={48}
                            alt="Achievement"
                            className="rounded-xl"
                          />
                          <Vstack align="start" gap={0}>
                            <Text color="text">{achievement.name}</Text>
                            <Text color="textFaded" size="xs">
                              {achievement.description}
                            </Text>
                            <Text
                              color={
                                achievement.users.filter(
                                  (user2) => user?.id === user2.id
                                ).length > 0
                                  ? "red"
                                  : "green"
                              }
                              size="xs"
                            >
                              {achievement.users.filter(
                                (user2) => user?.id === user2.id
                              ).length > 0
                                ? "Click to mark as unachieved"
                                : "Click to mark as achieved"}
                            </Text>
                          </Vstack>
                        </Hstack>
                      }
                    >
                      <button
                        onClick={async () => {
                          if (user) {
                            if (
                              achievement.users.filter(
                                (user2) => user?.id === user2.id
                              ).length > 0
                            ) {
                              const res = fetch(`${BASE_URL}/achievement`, {
                                body: JSON.stringify({
                                  achievementId: achievement.id,
                                }),
                                method: "DELETE",
                                headers: {
                                  "Content-Type": "application/json",
                                  authorization: `Bearer ${getCookie("token")}`,
                                },
                                credentials: "include",
                              });

                              if ((await res).ok) {
                                achievement.users = achievement.users.filter(
                                  (user2) => user?.id !== user2.id
                                );
                                setGame({
                                  ...game,
                                  achievements: game.achievements,
                                });
                              }
                            } else {
                              const res = fetch(`${BASE_URL}/achievement`, {
                                body: JSON.stringify({
                                  achievementId: achievement.id,
                                }),
                                method: "POST",
                                headers: {
                                  "Content-Type": "application/json",
                                  authorization: `Bearer ${getCookie("token")}`,
                                },
                                credentials: "include",
                              });

                              if ((await res).ok) {
                                achievement.users = [
                                  ...achievement.users,
                                  user,
                                ];
                                setGame({
                                  ...game,
                                  achievements: game.achievements,
                                });
                              }
                            }
                          }
                        }}
                      >
                        <Image
                          src={achievement.image || "/images/D2J_Icon.png"}
                          width={48}
                          height={48}
                          alt="Achievement"
                          style={{
                            opacity:
                              achievement.users.filter(
                                (user2) => user?.id === user2.id
                              ).length > 0
                                ? 1
                                : 0.5,
                            filter:
                              achievement.users.filter(
                                (user2) => user?.id === user2.id
                              ).length > 0
                                ? ""
                                : "grayscale(1)",
                          }}
                        />
                      </button>
                    </Tooltip>
                  </div>
                ))}
              </div>
            )}
            {game.tracks && game.tracks.length > 0 && (
              <div className="flex flex-col gap-2">
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
                    thumbnail={track.image ?? "/images/D2J_Icon.png"}
                    game={track.game.name}
                    song={track.url}
                  />
                ))}
              </div>
            )}
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
              <Hstack>
                <Chip>
                  Ranked Ratings Received:{" "}
                  {Math.round(
                    game.ratings.filter(
                      (rating) =>
                        rating.user.teams.filter(
                          (team) => team.game && team.game.published
                        ).length > 0
                    ).length /
                      (game.ratingCategories.length + ratingCategories.length)
                  )}
                </Chip>
                {Math.round(
                  game.ratings.filter(
                    (rating) =>
                      rating.user.teams.filter(
                        (team) => team.game && team.game.published
                      ).length > 0
                  ).length /
                    (game.ratingCategories.length + ratingCategories.length)
                ) < 5 && (
                  <Tooltip content="This game needs 5 ratings received in order to be ranked after the rating period">
                    <AlertTriangle size={16} className="text-red-500" />
                  </Tooltip>
                )}
              </Hstack>
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
                            1 /
                              (cur2.game.ratingCategories.length +
                                ratingCategories.length),
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
                          1 /
                            (cur2.game.ratingCategories.length +
                              ratingCategories.length),
                        0
                      ),
                    0
                  )
                ) < 5 && (
                  <Tooltip content="This game needs 5 ratings given in order to be ranked after the rating period">
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
            <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
              <ModalContent>
                {(onClose) => (
                  <>
                    <ModalBody className="min-h-60">
                      <Image
                        src={selectedScore}
                        alt="Evidence image"
                        fill
                        objectFit="contain"
                      />
                    </ModalBody>
                    <ModalFooter>
                      <Button color="red" onClick={onClose}>
                        Close
                      </Button>
                    </ModalFooter>
                  </>
                )}
              </ModalContent>
            </Modal>
            <Modal isOpen={isOpen2} onOpenChange={onOpenChange2}>
              <ModalContent>
                {(onClose) => (
                  <>
                    <ModalHeader className="flex items-center gap-2">
                      {selectedLeaderboard?.type == "SCORE" ? (
                        <Trophy />
                      ) : selectedLeaderboard?.type == "GOLF" ? (
                        <LandPlot />
                      ) : selectedLeaderboard?.type == "SPEEDRUN" ? (
                        <Rabbit />
                      ) : (
                        <Turtle />
                      )}
                      <p>{selectedLeaderboard?.name}</p>
                    </ModalHeader>
                    <ModalBody>
                      {(selectedLeaderboard?.type == "SPEEDRUN" ||
                        selectedLeaderboard?.type == "ENDURANCE") && (
                        <>
                          <Input
                            label="Hours"
                            placeholder="Enter hours"
                            value={hours}
                            min={0}
                            max={24}
                            onValueChange={(e) => setHours(parseInt(e))}
                          />
                          <Input
                            label="Minutes"
                            placeholder="Enter minutes"
                            value={minutes}
                            min={0}
                            max={59}
                            onValueChange={(e) => setMinutes(parseInt(e))}
                          />
                          <Input
                            label="Seconds"
                            placeholder="Enter seconds"
                            value={seconds}
                            min={0}
                            max={59}
                            onValueChange={(e) => setSeconds(parseInt(e))}
                          />
                          <Input
                            label="Milliseconds"
                            // description="Milliseconds are out of 1000. e.g. if its 0.23 seconds enter 230"
                            placeholder="Enter milliseconds"
                            value={milliseconds}
                            min={0}
                            max={999}
                            onValueChange={(e) => setMilliseconds(parseInt(e))}
                          />
                        </>
                      )}
                      {(selectedLeaderboard?.type == "SCORE" ||
                        selectedLeaderboard?.type == "GOLF") && (
                        <Input
                          type="number"
                          label="Score"
                          placeholder="Enter your score"
                          value={score}
                          onValueChange={(e) => setScore(parseInt(e))}
                        />
                      )}
                      <p>Evidence Picture</p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;

                          const formData = new FormData();
                          formData.append("upload", file);

                          try {
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
                              }
                            );

                            if (response.ok) {
                              const data = await response.json();
                              setEvidenceUrl(data.data);
                              addToast({ title: data.message });
                            } else {
                              addToast({ title: "Failed to upload image" });
                            }
                          } catch (error) {
                            console.error(error);
                            addToast({ title: "Error uploading image" });
                          }
                        }}
                      />

                      {evidenceUrl && (
                        <div className="w-full">
                          <div className="bg-[#222222] min-h-60 w-full relative">
                            <Image
                              src={evidenceUrl}
                              alt={`${selectedLeaderboard?.name}'s evidence`}
                              className="object-cover"
                              fill
                            />
                          </div>
                        </div>
                      )}
                    </ModalBody>
                    <ModalFooter>
                      <Button color="red" onClick={onClose}>
                        Close
                      </Button>
                      <Button
                        color="red"
                        onClick={async () => {
                          if (!evidenceUrl) {
                            addToast({ title: "No evidence image provided" });
                            return;
                          }

                          if (!selectedLeaderboard) {
                            addToast({ title: "No leaderboard selected" });
                            return;
                          }

                          let finalScore = score;

                          if (
                            selectedLeaderboard.type == "SPEEDRUN" ||
                            selectedLeaderboard.type == "ENDURANCE"
                          ) {
                            finalScore =
                              (milliseconds || 0) +
                              (seconds || 0) * 1000 +
                              (minutes || 0) * 1000 * 60 +
                              (hours || 0) * 1000 * 60 * 60;
                          }

                          const success = await postScore(
                            finalScore,
                            evidenceUrl,
                            selectedLeaderboard.id
                          );
                          if (success) {
                            onClose();
                            window.location.reload();
                          }
                        }}
                      >
                        Submit
                      </Button>
                    </ModalFooter>
                  </>
                )}
              </ModalContent>
            </Modal>
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
      <p className="text-[#666] dark:text-[#ccc]">{name}</p>
      <Tooltip content={description}>
        <CircleHelp size={16} className="text-[#ccc] dark:text-[#333]" />
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
        className={`absolute transition-all duration-300 ${
          hoverStars[id] > 0 &&
          hoverStars[id] >= value &&
          hoverCategoryId == id &&
          !newlyClicked
            ? "text-[#777]"
            : selectedStars[id] > 0 && selectedStars[id] >= value
            ? "text-yellow-400 dark:text-yellow-200"
            : "text-[#ccc] dark:text-[#333]"
        }`}
      />
      {/* Half Star (Overlapping Left Side) */}
      <Star
        fill="currentColor"
        className={`absolute transition-all duration-300 ${
          hoverStars[id] > 0 &&
          hoverStars[id] >= value - 1 &&
          hoverCategoryId == id &&
          !newlyClicked
            ? "text-[#777]"
            : selectedStars[id] > 0 && selectedStars[id] >= value - 1
            ? "text-yellow-400 dark:text-yellow-200"
            : "text-[#ccc] dark:text-[#333]"
        }`}
        style={{ clipPath: "inset(0 50% 0 0)" }} // Show only left half
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
