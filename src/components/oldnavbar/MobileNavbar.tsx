"use client";

import {
  Image,
  Link,
  NavbarBrand,
  Navbar as NavbarBase,
  NavbarContent,
} from "@heroui/react";
import NavbarButtonLink from "./NavbarButtonLink";
import { LogInIcon, NotebookPen } from "lucide-react";
import NextImage from "next/image";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { hasCookie } from "@/helpers/cookie";
import { getCurrentJam } from "@/helpers/jam";
import { JamType } from "@/types/JamType";
import { UserType } from "@/types/UserType";
import MobileNavbarUser from "./MobileNavbarUser";
import ThemeToggle from "../theme-toggle";
import { getSelf } from "@/requests/user";

export default function MobileNavbar() {
  const pathname = usePathname();
  const [jam, setJam] = useState<JamType | null>();
  const [isInJam, setIsInJam] = useState<boolean>();

  const [user, setUser] = useState<UserType>();

  useEffect(() => {
    loadUser();
    async function loadUser() {
      try {
        const jamResponse = await getCurrentJam();
        const currentJam = jamResponse?.jam;
        setJam(currentJam);

        if (!hasCookie("token")) {
          setUser(undefined);
          return;
        }

        const response = await getSelf();
        const user = await response.json();

        if (
          currentJam &&
          user.jams.filter((jam: JamType) => jam.id == currentJam.id).length > 0
        ) {
          setIsInJam(true);
        } else {
          setIsInJam(false);
        }

        if (response.status == 200) {
          setUser(user);
        } else {
          setUser(undefined);
        }
      } catch (error) {
        console.error(error);
      }
    }
  }, [pathname]);

  return (
    <NavbarBase maxWidth="2xl" className="bg-[#222] p-1" isBordered height={80}>
      <NavbarContent justify="start" className="gap-10">
        <NavbarBrand className="flex-grow-0">
          <Link
            href="/"
            className="duration-500 ease-in-out transition-all transform hover:scale-110"
          >
            <Image
              as={NextImage}
              src="/images/D2J_Icon.png"
              className="min-w-[70px]"
              alt="Down2Jam logo"
              width={70}
              height={59.7}
            />
          </Link>
        </NavbarBrand>
      </NavbarContent>

      <NavbarContent justify="end" className="gap-4">
        <ThemeToggle />
        {!user && (
          <NavbarButtonLink icon={<LogInIcon />} name="Log In" href="/login" />
        )}
        {!user && (
          <NavbarButtonLink
            icon={<NotebookPen />}
            name="Sign Up"
            href="/signup"
          />
        )}
        {user && (
          <MobileNavbarUser
            user={user}
            isInJam={isInJam}
            setIsInJam={setIsInJam}
            jam={jam}
          />
        )}
      </NavbarContent>
    </NavbarBase>
  );
}
