"use cllient";

import { useTheme } from "@/providers/SiteThemeProvider";
import { UserType } from "@/types/UserType";
import { Card, CardBody } from "@heroui/card";
import { User } from "lucide-react";
import NextLink from "next/link";

export default function SearchResultUser({
  user,
  onPress,
}: {
  user: UserType;
  onPress: () => void;
}) {
  const { siteTheme } = useTheme();

  return (
    <Card
      key={user.id}
      isPressable
      as={NextLink}
      href={`/u/${user.slug}`}
      onPress={onPress}
    >
      <CardBody
        className="flex flex-row items-center gap-2"
        style={{
          backgroundColor: siteTheme.colors["mantle"],
          borderColor: siteTheme.colors["base"],
          color: siteTheme.colors["text"],
        }}
      >
        <User /> {user.name}
      </CardBody>
    </Card>
  );
}
