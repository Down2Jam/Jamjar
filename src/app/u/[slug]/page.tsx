"use client";

import { getUser } from "@/requests/user";
import { UserType } from "@/types/UserType";
import { Avatar, Chip } from "@nextui-org/react";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function UserPage() {
  const [user, setUser] = useState<UserType>();
  const { slug } = useParams();

  useEffect(() => {
    const fetchUser = async () => {
      const response = await getUser(`${slug}`);
      setUser((await response.json()).data);
    };

    fetchUser();
  }, [slug]);

  return (
    <div>
      {user && (
        <div className="border-2 border-[#dddddd] dark:border-[#222224] relative rounded-xl overflow-hidden bg-white dark:bg-[#18181a]">
          <div className="bg-[#e4e4e4] dark:bg-[#222222] h-28 relative">
            {user.bannerPicture && (
              <Image
                src={user.bannerPicture}
                alt={`${user.name}'s profile banner`}
                className="object-cover"
                fill
              />
            )}
          </div>
          <Avatar
            className="absolute rounded-full left-16 top-16 h-24 w-24 bg-transparent"
            src={user.profilePicture}
          />
          <div className="p-8 mt-8">
            <p className="text-3xl text-black dark:text-white !duration-500 !ease-linear !transition-all">
              {user.name}
            </p>
            {(user.primaryRoles || user.secondaryRoles) && (
              <div className="flex gap-3 items-center py-2">
                <div className="flex gap-3 items-center flex-wrap">
                  {user.primaryRoles.map((role) => (
                    <Chip variant="faded" key={role.id}>
                      {role.name}
                    </Chip>
                  ))}
                  {user.secondaryRoles.map((role) => (
                    <Chip variant="faded" key={role.id} className="opacity-50">
                      {role.name}
                    </Chip>
                  ))}
                </div>
              </div>
            )}
            <div
              className="prose dark:prose-invert !duration-250 !ease-linear !transition-all max-w-full break-words"
              dangerouslySetInnerHTML={{
                __html:
                  user.bio && user.bio != "<p></p>" ? user.bio : "No user bio",
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
  return <div></div>;
}
