"use client";

import { Avatar } from "bioloom-ui";
import { Badge } from "bioloom-ui";
import { Card } from "bioloom-ui";
import { Icon } from "bioloom-ui";
import { Hstack, Vstack } from "bioloom-ui";
import { Text } from "bioloom-ui";
import { UserType } from "@/types/UserType";

export default function SearchResultUser({
  user,
  onPress,
}: {
  user: UserType;
  onPress: () => void;
}) {
  return (
    <Card
      key={user.id}
      href={`/u/${user.slug}`}
      onPress={onPress}
      backgroundImage={user.bannerPicture || user.profilePicture}
    >
      <Hstack>
        <Badge
          content={<Icon size={12} name="user" />}
          position="bottom-right"
          offset={4}
        >
          <Avatar size={40} src={user.profilePicture} />
        </Badge>{" "}
        <Vstack gap={0} align="start">
          <Text color="text">{user.name}</Text>
          <Text color="textFaded" size="sm">
            {user.short || "General.NoDescription"}
          </Text>
        </Vstack>
      </Hstack>
    </Card>
  );
}
