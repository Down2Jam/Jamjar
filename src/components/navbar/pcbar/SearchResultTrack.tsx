"use client";

import { useTranslations as useUiTranslations } from "@/compat/next-intl";


import { Badge } from "bioloom-ui";
import { Card } from "bioloom-ui";
import { Icon } from "bioloom-ui";
import { Hstack, Vstack } from "bioloom-ui";
import { Text } from "bioloom-ui";
import { TrackType } from "@/types/TrackType";
import Image from "@/compat/next-image";

export default function SearchResultTrack({
  track,
  onPress,
}: {
  track: TrackType;
  onPress: () => void;
}) {
  const uiText = useUiTranslations();
  const thumbnail =
    track.game.soundtrackThumbnail ||
    track.game.thumbnail ||
    "/images/D2J_Icon.png";

  return (
    <Card
      key={track.id}
      href={`/m/${track.slug}`}
      onPress={onPress}
      backgroundImage={thumbnail}
    >
      <Hstack>
        <Badge
          content={<Icon size={12} name="music" />}
          position="bottom-right"
          offset={4}
        >
          <Image
            src={thumbnail}
            alt={uiText("AppStrings.AlbumThumbnail2")}
            width={40}
            height={40}
            className="rounded-lg"
          />
        </Badge>{" "}
        <Vstack gap={0} align="start">
          <Text color="text">{track.name}</Text>
          <Text color="textFaded" size="sm">
            {track.game.name} · {track.composer.name}
          </Text>
        </Vstack>
      </Hstack>
    </Card>
  );
}
