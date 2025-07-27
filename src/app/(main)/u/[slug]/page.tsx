"use client";

import { useTheme } from "@/providers/SiteThemeProvider";
import { getUser } from "@/requests/user";
import { GameType } from "@/types/GameType";
import { UserType } from "@/types/UserType";
import {
  Avatar,
  Card,
  CardFooter,
  CardHeader,
  Chip,
  Image,
  Spacer,
} from "@heroui/react";
import NextImage from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function UserPage() {
  const [user, setUser] = useState<UserType>();
  const { slug } = useParams();
  const { siteTheme } = useTheme();

  useEffect(() => {
    const fetchUser = async () => {
      const response = await getUser(`${slug}`);
      setUser((await response.json()).data);
    };

    fetchUser();
  }, [slug]);

  return (
    <div>
      {user && (
        <>
          <div
            className="border-2 relative rounded-xl overflow-hidden"
            style={{
              backgroundColor: siteTheme.colors["mantle"],
              borderColor: siteTheme.colors["base"],
            }}
          >
            <div
              className="h-28 relative"
              style={{
                backgroundColor: siteTheme.colors["base"],
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
              className="absolute rounded-full left-16 top-16 h-24 w-24 bg-transparent"
              src={user.profilePicture}
            />
            <div className="p-8 mt-8">
              <p
                className="text-3xl !duration-500 !ease-linear !transition-all"
                style={{
                  color: siteTheme.colors["text"],
                }}
              >
                {user.name}
              </p>
              {(user.primaryRoles || user.secondaryRoles) && (
                <div className="flex gap-3 items-center py-2">
                  <div className="flex gap-3 items-center flex-wrap">
                    {user.primaryRoles.map((role) => (
                      <Chip
                        variant="faded"
                        key={role.id}
                        style={{
                          color: siteTheme.colors["text"],
                          backgroundColor: siteTheme.colors["base"],
                          borderColor: siteTheme.colors["base"],
                        }}
                      >
                        {role.name}
                      </Chip>
                    ))}
                    {user.secondaryRoles.map((role) => (
                      <Chip
                        variant="faded"
                        key={role.id}
                        className="opacity-50"
                        style={{
                          color: siteTheme.colors["text"],
                          backgroundColor: siteTheme.colors["base"],
                          borderColor: siteTheme.colors["base"],
                        }}
                      >
                        {role.name}
                      </Chip>
                    ))}
                  </div>
                </div>
              )}
              <div
                className="prose dark:prose-invert !duration-250 !ease-linear !transition-all max-w-full break-words"
                style={{
                  color: siteTheme.colors["text"],
                }}
                dangerouslySetInnerHTML={{
                  __html:
                    user.bio && user.bio != "<p></p>"
                      ? user.bio
                      : "No user bio",
                }}
              />
            </div>
          </div>
          <Spacer y={5} />
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {user.teams
              ?.reduce<GameType[]>((prev, cur) => {
                if (cur.game && cur.game.published) {
                  prev.push(cur.game);
                }
                return prev;
              }, [])
              .map((game, index) => (
                <Link key={game.name + index} href={`/g/${game.slug}`}>
                  <Card
                    radius="lg"
                    isFooterBlurred
                    className="w-full"
                    style={{
                      backgroundColor: siteTheme.colors["base"],
                    }}
                  >
                    <CardHeader className="absolute top-0 flex justify-end">
                      <div
                        className={` p-2 pt-1 pb-1 rounded shadow-md`}
                        style={{
                          color: siteTheme.colors["text"],
                          background: siteTheme.colors["greenDark"],
                        }}
                      >
                        {game.jam.name}
                      </div>
                    </CardHeader>
                    <Image
                      removeWrapper
                      alt={`${game.name}'s thumbnail`}
                      className="z-0 w-full h-full object-cover scale-110"
                      height={200}
                      width="100%"
                      isZoomed
                      src={game.thumbnail ?? "/images/D2J_Icon.png"}
                    />
                    <CardFooter
                      className="border-t-1 z-10 flex-col items-start"
                      style={{
                        color: siteTheme.colors["text"],
                        borderColor: siteTheme.colors["text"] + "44",
                      }}
                    >
                      <h3
                        className="font-medium text-2xl mb-2"
                        style={{
                          color: siteTheme.colors["text"],
                        }}
                      >
                        {game.name}
                      </h3>
                    </CardFooter>
                  </Card>
                </Link>
              ))}
          </section>
        </>
      )}
    </div>
  );
}
