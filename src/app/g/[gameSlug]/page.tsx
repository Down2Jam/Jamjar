"use client";

import { use } from "react";
import { useState, useEffect } from "react";
import { getCookie, hasCookie } from "@/helpers/cookie";
import {
  Avatar,
  Button,
  Chip,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  NumberInput,
  Pagination,
  Spacer,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  Tabs,
  Tooltip,
  useDisclosure,
  User,
} from "@heroui/react";
import { GameType } from "@/types/GameType";
import { UserType } from "@/types/UserType";
import { getGame, getRatingCategories } from "@/requests/game";
import { getSelf } from "@/requests/user";
import Image from "next/image";
import { getIcon } from "@/helpers/icon";
import Link from "@/components/link-components/Link";
import ButtonLink from "@/components/link-components/ButtonLink";
import {
  AlertTriangle,
  CircleHelp,
  Edit,
  Eye,
  LandPlot,
  MessageCircleMore,
  Plus,
  Rabbit,
  Star,
  Trash,
  Trophy,
  Turtle,
} from "lucide-react";
import Editor from "@/components/editor";
import ButtonAction from "@/components/link-components/ButtonAction";
import { toast } from "react-toastify";
import { sanitize } from "@/helpers/sanitize";
import { postComment } from "@/requests/comment";
import CommentCard from "@/components/posts/CommentCard";
import { LeaderboardType } from "@/types/LeaderboardType";
import { deleteScore } from "@/helpers/score";
import { postScore } from "@/requests/score";
import { postRating } from "@/requests/rating";
import { RatingType } from "@/types/RatingType";
import { RatingCategoryType } from "@/types/RatingCategoryType";
import { ActiveJamResponse, getCurrentJam } from "@/helpers/jam";

export default function GamePage({
  params,
}: {
  params: Promise<{ gameSlug: string }>;
}) {
  const resolvedParams = use(params);
  const gameSlug = resolvedParams.gameSlug;
  const [game, setGame] = useState<GameType | null>(null);
  const [user, setUser] = useState<UserType | null>(null);
  const [content, setContent] = useState("");
  const [waitingPost, setWaitingPost] = useState(false);
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
              const ratings = gameData.ratings
                .filter((rating: RatingType) => rating.userId == userData.id)
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
      <div className="border-2 border-[#dddddd] dark:border-[#222224] relative rounded-xl overflow-hidden bg-white dark:bg-[#18181a] text-[#333] dark:text-white">
        <div className="bg-[#e4e4e4] dark:bg-[#222222] h-60 relative">
          {(game.thumbnail || game.banner) && (
            <Image
              src={game.banner || game.thumbnail || ""}
              alt={`${game.name}'s banner`}
              className="object-cover"
              fill
            />
          )}
        </div>
        <div className="flex -mt-2 backdrop-blur-md border-t-1 border-white/50 dark:border-[#333]/50">
          <div className="w-2/3 p-4 flex flex-col gap-4">
            <div>
              <p className="text-4xl">{game.name}</p>
              <p className="text-[#666] dark:text-[#ccc]">
                By{" "}
                {game.team.name ||
                  (game.team.users.length == 1
                    ? game.team.owner.name
                    : `${game.team.owner.name}'s team`)}
              </p>
            </div>
            <div
              className="prose-neutral prose-lg"
              dangerouslySetInnerHTML={{
                __html: game.description || "No Description",
              }}
            />
          </div>
          <div className="flex flex-col w-1/3 gap-4 p-4">
            {isEditable && (
              <div>
                <ButtonLink
                  icon={<Edit />}
                  important
                  href="/create-game"
                  name="Edit"
                />
              </div>
            )}
            <>
              <p className="text-[#666] dark:text-[#ccc] text-xs">AUTHORS</p>
              <div className="flex flex-wrap gap-2">
                {game.team.users.map((user) => (
                  <Chip
                    radius="sm"
                    size="sm"
                    className="!duration-250 !ease-linear !transition-all"
                    variant="faded"
                    avatar={
                      <Avatar
                        src={user.profilePicture}
                        classNames={{ base: "bg-transparent" }}
                      />
                    }
                    key={user.id}
                  >
                    {user.name}
                  </Chip>
                ))}
              </div>
            </>

            {game.tags && game.tags.length > 0 && (
              <>
                <p className="text-[#666] dark:text-[#ccc] text-xs">TAGS</p>
                <div className="flex flex-wrap gap-2">
                  {game.tags.map((tag) => (
                    <Chip
                      radius="sm"
                      size="sm"
                      className="!duration-250 !ease-linear !transition-all"
                      variant="faded"
                      avatar={
                        tag.icon && (
                          <Avatar
                            src={tag.icon}
                            classNames={{ base: "bg-transparent" }}
                          />
                        )
                      }
                      key={tag.id}
                    >
                      {tag.name}
                    </Chip>
                  ))}
                </div>
              </>
            )}
            {game.flags && game.flags.length > 0 && (
              <>
                <p className="text-[#666] dark:text-[#ccc] text-xs">FLAGS</p>
                <div className="flex flex-wrap gap-2">
                  {game.flags.map((flag) => (
                    <Chip
                      radius="sm"
                      size="sm"
                      className="!duration-250 !ease-linear !transition-all"
                      variant="faded"
                      avatar={flag.icon && getIcon(flag.icon)}
                      key={flag.id}
                    >
                      {flag.name}
                    </Chip>
                  ))}
                </div>
              </>
            )}
            {game.downloadLinks && game.downloadLinks.length > 0 && (
              <>
                <p className="text-[#666] dark:text-[#ccc] text-xs">LINKS</p>
                <div className="flex flex-col gap-2 items-start">
                  {game.downloadLinks.map((link) => (
                    <Link
                      key={link.id}
                      name={link.platform}
                      href={link.url}
                      color="blue"
                    />
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
              <p className="text-[#666] dark:text-[#ccc] text-xs">RATINGS</p>
              {isEditable && (
                <p className="text-[#666] dark:text-[#ccc] text-xs">
                  You can&apos;t rate your own game
                </p>
              )}
              {!user && (
                <p className="text-[#666] dark:text-[#ccc] text-xs">
                  You must be logged in to rate games
                </p>
              )}
              {!isEditable &&
                user?.teams.filter((team) => team.game && team.game.published)
                  .length == 0 &&
                (activeJamResponse?.jam?.id != game.jamId ||
                  (activeJamResponse?.phase != "Rating" &&
                    activeJamResponse?.phase != "Submission")) && (
                  <p className="text-[#666] dark:text-[#ccc] text-xs">
                    It is not the rating period
                  </p>
                )}
              {!isEditable &&
                user?.teams.filter((team) => team.game && team.game.published)
                  .length == 0 &&
                activeJamResponse?.jam?.id == game.jamId &&
                (activeJamResponse?.phase == "Rating" ||
                  activeJamResponse?.phase == "Submission") && (
                  <p className="text-[#666] dark:text-[#ccc] text-xs">
                    Your ratings will not count towards the rankings as you did
                    not submit a game
                  </p>
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
                        name={ratingCategory.name}
                        text={
                          ratingCategory.name == "Theme"
                            ? game.themeJustification
                            : ""
                        }
                        description={ratingCategory.description}
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
                <p className="text-default-500 text-xs">LEADERBOARD</p>

                <Tabs variant="bordered">
                  {game.leaderboards.map((leaderboard) => (
                    <Tab
                      key={leaderboard.id}
                      title={
                        <div className="flex items-center space-x-2">
                          {leaderboard.type == "SCORE" ? (
                            <Trophy size={12} />
                          ) : leaderboard.type == "GOLF" ? (
                            <LandPlot size={12} />
                          ) : leaderboard.type == "SPEEDRUN" ? (
                            <Rabbit size={12} />
                          ) : (
                            <Turtle size={12} />
                          )}
                          <p className="text-xs">{leaderboard.name}</p>
                        </div>
                      }
                    >
                      {leaderboard.scores && (
                        <Table
                          classNames={{ wrapper: "border-none" }}
                          className="w-full"
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
                                            leaderboard.type == "ENDURANCE")) ||
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
                                  <TableCell className="text-[#ccc] dark:text-[#666]">
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
                                  <TableCell className="text-[#94d4df] dark:text-[#4092b3]">
                                    {leaderboard.type == "GOLF" ||
                                    leaderboard.type == "SCORE"
                                      ? score.data /
                                        10 ** leaderboard.decimalPlaces
                                      : (() => {
                                          const totalMilliseconds = score.data;
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
                                    <ButtonAction
                                      name=""
                                      isIconOnly
                                      icon={<Eye size={16} />}
                                      onPress={() => {
                                        setSelectedScore(score.evidence);
                                        onOpen();
                                      }}
                                      size="sm"
                                    />
                                    {(isEditable ||
                                      score.user.id == user?.id ||
                                      user?.mod) && (
                                      <ButtonAction
                                        important
                                        color="red"
                                        name=""
                                        isIconOnly
                                        icon={<Trash size={16} />}
                                        onPress={async () => {
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
                      )}
                      <Spacer y={5} />
                      <div>
                        <ButtonAction
                          name="Submit Score"
                          icon={<Plus />}
                          onPress={() => {
                            setSelectedLeaderboard(leaderboard);
                            setScore(0);
                            setEvidenceUrl(undefined);
                            onOpen2();
                          }}
                        />
                      </div>
                    </Tab>
                  ))}
                </Tabs>
              </div>
            )}
            <div className="flex flex-col gap-2">
              <p className="text-default-500 text-xs">STATS</p>
              <Chip
                radius="sm"
                size="sm"
                className="!duration-250 !ease-linear !transition-all bg-opacity-20 border-opacity-20"
                variant="faded"
              >
                Ratings Received:{" "}
                {Math.round(
                  game.ratings.length /
                    (game.ratingCategories.length + ratingCategories.length)
                )}
              </Chip>
              <div className="flex items-center gap-2">
                <Chip
                  radius="sm"
                  size="sm"
                  className="!duration-250 !ease-linear !transition-all bg-opacity-20 border-opacity-20"
                  variant="faded"
                >
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
                  <Tooltip
                    className="text-red-500"
                    content="This game needs 5 ratings received in order to be ranked after the rating period"
                  >
                    <AlertTriangle size={16} className="text-red-500" />
                  </Tooltip>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Chip
                  radius="sm"
                  size="sm"
                  className="!duration-250 !ease-linear !transition-all bg-opacity-20 border-opacity-20"
                  variant="faded"
                >
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
                  <Tooltip
                    content="This game needs 5 ratings given in order to be ranked after the rating period"
                    className="text-red-500"
                  >
                    <AlertTriangle size={16} className="text-red-500" />
                  </Tooltip>
                )}
              </div>
            </div>
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
                      <Button color="danger" variant="light" onPress={onClose}>
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
                          <NumberInput
                            className="text-[#333] dark:text-white"
                            label="Hours"
                            placeholder="Enter hours"
                            value={hours}
                            minValue={0}
                            maxValue={24}
                            onValueChange={setHours}
                            variant="bordered"
                          />
                          <NumberInput
                            className="text-[#333] dark:text-white"
                            label="Minutes"
                            placeholder="Enter minutes"
                            value={minutes}
                            minValue={0}
                            maxValue={59}
                            onValueChange={setMinutes}
                            variant="bordered"
                          />
                          <NumberInput
                            className="text-[#333] dark:text-white"
                            label="Seconds"
                            placeholder="Enter seconds"
                            value={seconds}
                            minValue={0}
                            maxValue={59}
                            onValueChange={setSeconds}
                            variant="bordered"
                          />
                          <NumberInput
                            className="text-[#333] dark:text-white"
                            label="Milliseconds"
                            description="Milliseconds are out of 1000. e.g. if its 0.23 seconds enter 230"
                            placeholder="Enter milliseconds"
                            value={milliseconds}
                            minValue={0}
                            maxValue={999}
                            onValueChange={setMilliseconds}
                            variant="bordered"
                          />
                        </>
                      )}
                      {(selectedLeaderboard?.type == "SCORE" ||
                        selectedLeaderboard?.type == "GOLF") && (
                        <NumberInput
                          className="text-[#333] dark:text-white"
                          label="Score"
                          placeholder="Enter your score"
                          value={score}
                          onValueChange={setScore}
                          variant="bordered"
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
                              toast.success(data.message);
                            } else {
                              toast.error("Failed to upload image");
                            }
                          } catch (error) {
                            console.error(error);
                            toast.error("Error uploading image");
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
                      <Button color="danger" variant="light" onPress={onClose}>
                        Close
                      </Button>
                      <Button
                        color="primary"
                        onPress={async () => {
                          if (!evidenceUrl) {
                            toast.error("No evidence image provided");
                            return;
                          }

                          if (!selectedLeaderboard) {
                            toast.error("No leaderboard selected");
                            return;
                          }

                          let finalScore = score;

                          if (
                            selectedLeaderboard.type == "SPEEDRUN" ||
                            selectedLeaderboard.type == "ENDURANCE"
                          ) {
                            finalScore =
                              milliseconds +
                              seconds * 1000 +
                              minutes * 1000 * 60 +
                              hours * 1000 * 60 * 60;
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
      <Spacer y={10} />
      <Editor content={content} setContent={setContent} />
      <Spacer y={5} />
      <ButtonAction
        onPress={async () => {
          if (!content) {
            toast.error("Please enter valid content");
            return;
          }

          if (!hasCookie("token")) {
            toast.error("You are not logged in");
            return;
          }

          const sanitizedHtml = sanitize(content);
          setWaitingPost(true);

          const response = await postComment(
            sanitizedHtml,
            null,
            null,
            game.id
          );

          if (response.status == 401) {
            toast.error("Invalid User");
            setWaitingPost(false);
            return;
          }

          if (response.ok) {
            toast.success("Successfully created comment");
            setWaitingPost(false);
            window.location.reload();
          } else {
            toast.error("An error occured");
            setWaitingPost(false);
          }
        }}
        name={waitingPost ? "Loading..." : "Create Comment"}
      />
      <Spacer y={10} />

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
      <Tooltip content={description} className="text-[#333] dark:text-[#ccc]">
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
          className="text-[#333] dark:text-[#ccc] max-w-96"
        >
          <MessageCircleMore
            size={16}
            className="text-[#ccc] dark:text-[#333]"
          />
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
