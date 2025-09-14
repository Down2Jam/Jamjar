"use client";

import { GameCard } from "@/components/gamecard";
import PostCard from "@/components/posts/PostCard";
import SidebarSong from "@/components/sidebar/SidebarSong";
import ThemedProse from "@/components/themed-prose";
import { Avatar } from "@/framework/Avatar";
import { Card } from "@/framework/Card";
import { Chip } from "@/framework/Chip";
import Icon from "@/framework/Icon";
import { Hstack, Vstack } from "@/framework/Stack";
import { Tab, Tabs } from "@/framework/Tabs";
import Text from "@/framework/Text";
import Tooltip from "@/framework/Tooltip";
import { useTheme } from "@/providers/SiteThemeProvider";
import { getUser } from "@/requests/user";
import { GameType } from "@/types/GameType";
import { UserType } from "@/types/UserType";
import Image from "next/image";
import NextImage from "next/image";
import { use, useEffect, useState } from "react";

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
  type: LeaderboardScore["leaderboard"]["type"]
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
  type: LeaderboardScore["leaderboard"]["type"]
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
  type: LeaderboardScore["leaderboard"]["type"]
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
      (lb.onlyBest && s.user.id === target.user.id && s.data === target.data)
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
  if (p === 2) return colors["gray"];
  if (p === 3) return colors["orange"];
  if (p >= 4 && p <= 5) return colors["blue"];
  if (p >= 6 && p <= 10) return colors["purple"];
  return colors["textFaded"];
}

export default function ClientUserPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = use(params);
  const slug = resolvedParams.slug;
  const [user, setUser] = useState<UserType>();
  const { colors } = useTheme();

  useEffect(() => {
    const fetchUser = async () => {
      const response = await getUser(`${slug}`);
      setUser((await response.json()).data);
    };

    fetchUser();
  }, [slug]);

  if (!user) {
    return <></>;
  }

  return (
    <Vstack align="stretch" gap={4}>
      <Card padding={0}>
        <div
          className="h-28 relative"
          style={{
            backgroundColor: colors["base"],
          }}
        >
          {user.bannerPicture && (
            <NextImage
              src={user.bannerPicture}
              alt={`${user.name}'s profile banner`}
              className="object-cover"
              fill
            />
          )}
        </div>
        <Avatar
          src={user.profilePicture}
          className="absolute rounded-full left-16 top-16 bg-transparent"
          size={96}
        />
        <Vstack align="start" className="mt-8 p-8">
          <Text size="3xl">{user.name}</Text>
          {(user.primaryRoles || user.secondaryRoles) && (
            <Hstack wrap>
              {user.primaryRoles.map((role) => (
                <Chip key={role.id}>{role.name}</Chip>
              ))}
              {user.secondaryRoles.map((role) => (
                <Chip key={role.id} className="opacity-50">
                  {role.name}
                </Chip>
              ))}
            </Hstack>
          )}
          <ThemedProse>
            <div
              className="!duration-250 !ease-linear !transition-all max-w-full break-words"
              dangerouslySetInnerHTML={{
                __html:
                  user.bio && user.bio != "<p></p>" ? user.bio : "No user bio",
              }}
            />
          </ThemedProse>
        </Vstack>
      </Card>
      <Tabs>
        <Tab
          disabled={
            user.teams?.reduce<GameType[]>((prev, cur) => {
              if (cur.game && cur.game.published) {
                prev.push(cur.game);
              }
              return prev;
            }, []).length == 0
          }
          title={`Games (${
            user.teams?.reduce<GameType[]>((prev, cur) => {
              if (cur.game && cur.game.published) {
                prev.push(cur.game);
              }
              return prev;
            }, []).length
          })`}
          icon="gamepad2"
        >
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              ...user.teams?.reduce<GameType[]>((prev, cur) => {
                if (cur.game && cur.game.published) {
                  prev.push(cur.game);
                }
                return prev;
              }, []),
            ]
              .sort((a, b) => b.id - a.id)
              .map((game, index) => (
                <GameCard key={game.name + index} game={game} />
              ))}
          </section>
        </Tab>
        <Tab
          disabled={user.tracks.length == 0}
          title={`Music (${user.tracks.length})`}
          icon="music"
        >
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {user.tracks
              .sort((a, b) => b.id - a.id)
              .map((track) => (
                <SidebarSong
                  key={track.id}
                  name={track.name}
                  artist={track.composer.name}
                  thumbnail={track.game.thumbnail || "/images/D2J_Icon.png"}
                  game={track.game.name}
                  song={track.url}
                />
              ))}
          </section>
        </Tab>
        <Tab
          disabled={user.posts.length == 0}
          title={`Posts (${user.posts.length})`}
          icon="messagessquare"
        >
          <section className="grid md:grid-cols-1 lg:grid-cols-2 gap-4">
            {user.posts
              .sort((a, b) => b.id - a.id)
              .map((post) => (
                <PostCard post={post} style="Compact" key={post.id} />
              ))}
          </section>
        </Tab>
        <Tab
          disabled={user.comments.length == 0}
          title={`Comments (${user.comments.length})`}
          icon="messagecircle"
        >
          <section className="grid md:grid-cols-1 lg:grid-cols-2 gap-4">
            {user.comments
              .sort((a, b) => b.id - a.id)
              .map((comment) => (
                <Card
                  key={comment.id}
                  href={
                    comment.game
                      ? `/g/${comment.game?.slug}`
                      : comment.post
                      ? `/g/${comment.post.slug}`
                      : undefined
                  }
                >
                  <Vstack align="start">
                    {comment.game ? (
                      <Hstack>
                        <Icon name="gamepad2" color="textFaded" size={20} />
                        <Text color="textFaded" size="sm">
                          Comment on {comment.game.name}
                        </Text>
                      </Hstack>
                    ) : comment.post ? (
                      <Hstack>
                        <Icon
                          name="messagessquare"
                          color="textFaded"
                          size={20}
                        />
                        <Text color="textFaded" size="sm">
                          Comment on {comment.post.title}
                        </Text>
                      </Hstack>
                    ) : (
                      <Hstack>
                        <Icon
                          name="messagecircle"
                          color="textFaded"
                          size={20}
                        />
                        <Text color="textFaded" size="sm">
                          Replying to comment
                        </Text>
                      </Hstack>
                    )}
                    <ThemedProse>
                      <div
                        className="!duration-250 !ease-linear !transition-all max-w-full break-words"
                        dangerouslySetInnerHTML={{
                          __html:
                            user.bio && user.bio != "<p></p>"
                              ? user.bio
                              : "No user bio",
                        }}
                      />
                    </ThemedProse>
                  </Vstack>
                </Card>
              ))}
          </section>
        </Tab>
        <Tab
          disabled={bestPerLeaderboardForUser(user.scores).length == 0}
          title={`Scores (${bestPerLeaderboardForUser(user.scores).length})`}
          icon="trophy"
        >
          <section className="grid md:grid-cols-1 lg:grid-cols-2 gap-4">
            {bestPerLeaderboardForUser(user.scores)
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

                      <Text color="blue">{formatScoreValue(score)}</Text>

                      <Text style={{ color }}>
                        {placement ? ordinal(placement) : "Unranked"}
                      </Text>
                    </Hstack>
                  </Card>
                );
              })}
          </section>
        </Tab>
        <Tab
          title={`Achievements (${user.achievements.length})`}
          icon="award"
          disabled={user.achievements.length == 0}
        >
          <Hstack wrap>
            {user.achievements.map((achievement) => (
              <Tooltip
                key={achievement.id}
                content={
                  <Vstack align="start">
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
                      </Vstack>
                    </Hstack>
                    <Hstack>
                      <Image
                        src={
                          achievement.game.thumbnail ?? "/images/D2J_Icon.png"
                        }
                        alt="Game thumbnail"
                        width={18}
                        height={10}
                        className="rounded-lg"
                      />
                      <Text color="textFaded" size="xs">
                        {achievement.game.name}
                      </Text>
                    </Hstack>
                  </Vstack>
                }
              >
                <Image
                  src={achievement.image || "/images/D2J_Icon.png"}
                  width={48}
                  height={48}
                  alt="Achievement"
                />
              </Tooltip>
            ))}
          </Hstack>
        </Tab>
      </Tabs>
    </Vstack>
  );
}
