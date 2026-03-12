"use client";

import { Badge } from "bioloom-ui";
import { Card } from "bioloom-ui";
import { Icon } from "bioloom-ui";
import { Hstack, Vstack } from "bioloom-ui";
import { Text } from "bioloom-ui";
import { TrackType } from "@/types/TrackType";
import Image from "next/image";

export default function SearchResultTrack({
  track,
  onPress,
}: {
  track: TrackType;
  onPress: () => void;
}) {
  return (
    <Card
      key={track.id}
      href={`/m/${track.slug}`}
      onPress={onPress}
      backgroundImage={track.game.banner || track.game.thumbnail}
    >
      <Hstack>
        <Badge
          content={<Icon size={12} name="music" />}
          position="bottom-right"
          offset={4}
        >
          <Image
            src={track.game.thumbnail ?? "/images/D2J_Icon.png"}
            alt="Game thumbnail"
            width={45}
            height={25}
            className="rounded-lg"
          />
        </Badge>{" "}
        <Vstack gap={0} align="start">
          <Text color="text">{track.name}</Text>
          <Text color="textFaded" size="sm">
            {track.game.name} - {track.composer.name}
          </Text>
        </Vstack>
      </Hstack>
    </Card>
  );
}
