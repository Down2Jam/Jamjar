"use client";

import { useTranslations as useUiTranslations } from "@/compat/next-intl";


import { Badge } from "bioloom-ui";
import { Card } from "bioloom-ui";
import { Icon } from "bioloom-ui";
import { Hstack, Vstack } from "bioloom-ui";
import { Text } from "bioloom-ui";
import { GameType } from "@/types/GameType";
import Image from "@/compat/next-image";

export default function SearchResultGame({
  game,
  onPress,
}: {
  game: GameType;
  onPress: () => void;
}) {
  const uiText = useUiTranslations();
  return (
    <Card
      key={game.id}
      href={`/g/${game.slug}`}
      onPress={onPress}
      backgroundImage={game.banner || game.thumbnail}
    >
      <Hstack>
        <Badge
          content={<Icon size={12} name="gamepad2" />}
          position="bottom-right"
          offset={4}
        >
          <Image
            src={game.thumbnail || "/images/game-thumbnail.png"}
            alt={uiText("AppStrings.GameThumbnail")}
            width={45}
            height={25}
            className="rounded-lg"
          />
        </Badge>{" "}
        <Vstack gap={0} align="start">
          <Text color="text">{game.name}</Text>
          <Text color="textFaded" size="sm">
            {game.short || "General.NoDescription"}
          </Text>
        </Vstack>
      </Hstack>
    </Card>
  );
}
