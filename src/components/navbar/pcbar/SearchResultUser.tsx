"use client";

import { Avatar } from "@/framework/Avatar";
import { Badge } from "@/framework/Badge";
import { Card } from "@/framework/Card";
import Icon from "@/framework/Icon";
import { Hstack, Vstack } from "@/framework/Stack";
import Text from "@/framework/Text";
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
            {user.short || "No Description"}
          </Text>
        </Vstack>
      </Hstack>
    </Card>
  );
}
