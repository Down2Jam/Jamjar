"use client";

import { useTranslations as useUiTranslations } from "@/compat/next-intl";


import Image from "@/compat/next-image";
import Link from "@/compat/next-link";
import type { GameReleaseFeedItemType } from "@/types/PostType";
import type { PostStyle } from "@/types/PostStyle";
import { formatDistance } from "date-fns";
import { Avatar, Card, Text } from "bioloom-ui";

export default function GameReleaseCard({
  release,
  style,
}: {
  release: GameReleaseFeedItemType;
  style: PostStyle;
}) {
  const uiText = useUiTranslations();
  const creatorNames = release.creators.map((creator) => creator.name);
  const creatorLabel =
    creatorNames.length > 2
      ? `${creatorNames.slice(0, 2).join(", ")} and ${creatorNames.length - 2} more`
      : creatorNames.join(" and ");
  const releaseTime = formatDistance(new Date(release.createdAt), new Date(), {
    addSuffix: true,
  });
  const creatorAvatars = (size: number) => (
    <div className="flex shrink-0 -space-x-1">
      {release.creators.slice(0, 3).map((creator) => (
        <Link key={creator.id} href={`/u/${creator.slug}`}>
          <Avatar
            size={size}
            src={creator.profilePicture}
            style={{ backgroundColor: "transparent" }}
          />
        </Link>
      ))}
    </div>
  );

  if (style === "Compact") {
    return (
      <Card className="overflow-hidden" padding={1}>
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href={`/g/${release.game.slug}`}
            className="block aspect-[9/5] w-20 shrink-0 overflow-hidden rounded-md"
          >
            <Image
              src={release.game.thumbnail || "/images/game-thumbnail.png"}
              alt=""
              width={360}
              height={200}
              className="h-full w-full object-cover"
            />
          </Link>

          <div className="min-w-0 flex-1">
            <div className="mb-1 flex min-w-0 items-center gap-2 text-xs text-default-500">
              {creatorAvatars(20)}
              <span className="truncate">{creatorLabel}  {uiText("AppStrings.ReleasedAGame")}</span>
              <span aria-hidden="true" className="shrink-0 opacity-50">·</span>
              <Text size="xs" color="textFaded" className="shrink-0">
                {releaseTime}
              </Text>
            </div>
            <Link href={`/g/${release.game.slug}`}>
              <p className="truncate text-lg font-medium leading-tight">
                {release.game.name}
              </p>
            </Link>
          </div>
        </div>
      </Card>
    );
  }

  if (style === "Ultra") {
    return (
      <Card className="overflow-hidden" padding={1}>
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href={`/g/${release.game.slug}`}
            className="block aspect-[9/5] w-16 shrink-0 overflow-hidden rounded-md"
          >
            <Image
              src={release.game.thumbnail || "/images/game-thumbnail.png"}
              alt=""
              width={360}
              height={200}
              className="h-full w-full object-cover"
            />
          </Link>

          <div className="min-w-0 flex-1">
            <div className="mb-1 flex min-w-0 items-center gap-2 text-xs text-default-500">
              {creatorAvatars(18)}
              <span className="truncate">{creatorLabel}  {uiText("AppStrings.ReleasedAGame")}</span>
              <span aria-hidden="true" className="shrink-0 opacity-50">·</span>
              <Text size="xs" color="textFaded" className="shrink-0">
                {releaseTime}
              </Text>
            </div>
            <Link href={`/g/${release.game.slug}`}>
              <p className="truncate font-medium leading-tight">
                {release.game.name}
              </p>
            </Link>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden" padding={1.25}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <Link
          href={`/g/${release.game.slug}`}
          className="block aspect-[9/5] w-full shrink-0 overflow-hidden rounded-md sm:w-44"
        >
          <Image
            src={release.game.thumbnail || "/images/game-thumbnail.png"}
            alt=""
            width={360}
            height={200}
            className="h-full w-full object-cover"
          />
        </Link>

        <div className="min-w-0 flex-1">
          <div className="mb-2 flex items-center gap-2">
            {creatorAvatars(24)}
            <Text size="sm" color="textFaded">
              {creatorLabel}  {uiText("AppStrings.ReleasedAGame")} </Text>
          </div>

          <Link href={`/g/${release.game.slug}`}>
            <p className="text-[1.375rem] font-semibold leading-tight">
              {release.game.name}
            </p>
          </Link>

          {release.game.short && (
            <Text size="sm" color="textFaded" className="mt-1 line-clamp-2">
              {release.game.short}
            </Text>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
            <Text size="xs" color="textFaded">
              {releaseTime}
            </Text>
          </div>
        </div>
      </div>
    </Card>
  );
}
