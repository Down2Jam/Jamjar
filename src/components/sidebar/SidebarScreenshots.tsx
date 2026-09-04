"use client";

import Image from "@/compat/next-image";
import Link from "@/compat/next-link";
import { Skeleton } from "@/components/skeletons";
import { useGames } from "@/hooks/queries";
import { useTheme } from "@/providers/useSiteTheme";
import { Button, Text } from "bioloom-ui";
import { useMemo } from "react";

export default function SidebarScreenshots() {
  const { siteTheme } = useTheme();
  const { data: games = [], isLoading } = useGames(
    "random",
    undefined,
    "ALL",
    true,
    30,
  );

  const screenshots = useMemo(() => {
    const seen = new Set<string>();

    return games
      .flatMap((game) => {
        const src = [
          ...(game.screenshots ?? []),
          ...(game.jamPage?.screenshots ?? []),
          ...(game.postJamPage?.screenshots ?? []),
        ].find((candidate) => candidate?.trim() && !seen.has(candidate));

        if (!src) return [];
        seen.add(src);
        return [{ game, src }];
      })
      .slice(0, 6);
  }, [games]);

  if (isLoading) {
    return (
      <div className="mt-20 flex flex-col items-center gap-2">
        <Skeleton className="h-8 w-52" />
        <div className="grid w-[488px] grid-cols-2 gap-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton
              key={index}
              className="aspect-video w-full rounded-xl"
            />
          ))}
        </div>
      </div>
    );
  }

  if (screenshots.length === 0) return null;

  return (
    <div className="mt-20 flex flex-col items-center gap-2">
      <Text
        size="2xl"
        color={siteTheme.type === "Light" ? "textLight" : "text"}
        style={{
          textShadow: "0 1px 5px rgba(0, 0, 0, 0.75)",
        }}
      >
        Featured Screenshots
      </Text>

      <div className="grid w-[488px] grid-cols-2 gap-2">
        {screenshots.map(({ game, src }) => (
          <Link
            key={`${game.id}:${game.pageVersion ?? "JAM"}:${src}`}
            href={`/g/${game.slug}${game.pageVersion ? `?pageVersion=${game.pageVersion}` : ""}`}
            className="group post-card-shadow relative aspect-video overflow-hidden rounded-xl bg-black/30"
            aria-label={`Open ${game.name}`}
          >
            <Image
              src={src}
              alt={`${game.name} screenshot`}
              width={240}
              height={135}
              className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03] group-hover:brightness-75"
            />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent px-3 pb-2 pt-8 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
              <p className="truncate text-sm font-semibold text-white">
                {game.name}
              </p>
            </div>
          </Link>
        ))}
      </div>

      <Button icon="moveupright" href="/screenshots">
        To Screenshots Page
      </Button>
    </div>
  );
}
