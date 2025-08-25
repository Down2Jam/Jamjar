"use client";

import { GameCard } from "@/components/gamecard";
import ThemedProse from "@/components/themed-prose";
import { Avatar } from "@/framework/Avatar";
import { Card } from "@/framework/Card";
import { Chip } from "@/framework/Chip";
import { Hstack, Vstack } from "@/framework/Stack";
import Text from "@/framework/Text";
import { useTheme } from "@/providers/SiteThemeProvider";
import { getUser } from "@/requests/user";
import { GameType } from "@/types/GameType";
import { UserType } from "@/types/UserType";
import NextImage from "next/image";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function UserPage() {
  const [user, setUser] = useState<UserType>();
  const { slug } = useParams();
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
      <Hstack wrap>
        {[
          ...user.teams?.reduce<GameType[]>((prev, cur) => {
            if (cur.game && cur.game.published) {
              prev.push(cur.game);
            }
            return prev;
          }, []),
        ].map((game, index) => (
          <GameCard key={game.name + index} game={game} />
        ))}
      </Hstack>
    </Vstack>
  );
}
