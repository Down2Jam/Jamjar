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
  return (
    <Card
      key={user.id}
      isPressable
      as={NextLink}
      href={`/u/${user.slug}`}
      onPress={onPress}
    >
      <CardBody className="flex flex-row items-center gap-2">
        <User /> {user.name}
        <div
          className="prose dark:prose-invert !duration-250 !ease-linear !transition-all max-w-full break-words"
          dangerouslySetInnerHTML={{
            __html:
              user.bio && user.bio != "<p></p>" ? user.bio : "No user bio",
          }}
        />
      </CardBody>
    </Card>
  );
}
