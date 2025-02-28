"use client";

import {
  Avatar,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  NavbarItem,
} from "@nextui-org/react";
import { UserType } from "@/types/UserType";
import { JamPhase, JamType } from "@/types/JamType";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { getCurrentJam, joinJam } from "@/helpers/jam";
import { toast } from "react-toastify";

interface NavbarUserProps {
  user: UserType;
  jam?: JamType | null;
  setIsInJam: Dispatch<SetStateAction<boolean | undefined>>;
  isInJam?: boolean;
}

export default function MobileNavbarUser({
  user,
  jam,
  setIsInJam,
  isInJam,
}: NavbarUserProps) {
  const [currentJam, setCurrentJam] = useState<JamType | null>(null);
  const [jamPhase, setJamPhase] = useState<JamPhase | null>();

  useEffect(() => {
    const fetchCurrentJam = async () => {
      try {
        const response = await getCurrentJam();
        setCurrentJam(response?.jam || null);
        setJamPhase(response?.phase || null);
      } catch (error) {
        console.error("Error fetching current jam:", error);
      }
    };

    fetchCurrentJam();
  }, []);

  return (
    <NavbarItem>
      <Dropdown>
        <DropdownTrigger>
          <Avatar
            src={user.profilePicture}
            className="cursor-pointer"
            classNames={{
              base: "bg-transparent",
            }}
          />
        </DropdownTrigger>
        <DropdownMenu>
          {jam && currentJam && isInJam && jamPhase == "Jamming" ? (
            <DropdownItem
              key="create-game"
              href="/create-game"
              className="text-black"
            >
              Create Game
            </DropdownItem>
          ) : null}
          {jam && currentJam && !isInJam ? (
            <DropdownItem
              key="join-event"
              className="text-black"
              onPress={async () => {
                try {
                  if (!currentJam) {
                    toast.error("There is no jam to join");
                    return;
                  }

                  if (await joinJam(currentJam.id)) {
                    setIsInJam(true);
                  }
                } catch (error) {
                  console.error("Error during join process:", error);
                }
              }}
            >
              Join Event
            </DropdownItem>
          ) : null}
          <DropdownItem
            key="create-post"
            href="/create-post"
            className="text-black"
          >
            Create Post
          </DropdownItem>
          <DropdownItem
            key="profile"
            className="text-black"
            href={`/u/${user.slug}`}
          >
            Profile
          </DropdownItem>
          <DropdownItem
            showDivider
            key="settings"
            className="text-black"
            href="/settings"
          >
            Settings
          </DropdownItem>
          <DropdownItem
            key="logout"
            color="danger"
            className="text-danger"
            href="/logout"
          >
            Logout
          </DropdownItem>
        </DropdownMenu>
      </Dropdown>
    </NavbarItem>
  );
}
