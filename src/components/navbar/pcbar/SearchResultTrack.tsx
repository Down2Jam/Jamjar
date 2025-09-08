"use client";

import { Badge } from "@/framework/Badge";
import { Card } from "@/framework/Card";
import Icon from "@/framework/Icon";
import { Hstack, Vstack } from "@/framework/Stack";
import Text from "@/framework/Text";
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
      href={`/g/${track.game.slug}`}
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
