"use client";

import {
  Image,
  Link,
  NavbarBrand,
  Navbar as NavbarBase,
  NavbarContent,
  Divider,
} from "@nextui-org/react";
import NavbarLink from "./NavbarLink";
import NavbarSearchbar from "./NavbarSearchbar";
import NavbarButtonLink from "./NavbarButtonLink";
import {
  Bell,
  CalendarPlus,
  Gamepad,
  Gamepad2,
  Info,
  LogInIcon,
  NotebookPen,
  Shield,
  SquarePen,
} from "lucide-react";
import NextImage from "next/image";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { hasCookie } from "@/helpers/cookie";
import { getCurrentJam, joinJam } from "@/helpers/jam";
import { JamType } from "@/types/JamType";
import { GameType } from "@/types/GameType";
import { UserType } from "@/types/UserType";
import NavbarUser from "./PCNavbarUser";
import NavbarButtonAction from "./NavbarButtonAction";
import { toast } from "react-toastify";
import ThemeToggle from "../theme-toggle";
import { getSelf } from "@/requests/user";
import { getCurrentGame } from "@/requests/game";

export default function PCNavbar() {
  const pathname = usePathname();
  const [jam, setJam] = useState<JamType | null>();
  const [isInJam, setIsInJam] = useState<boolean>();
  const [user, setUser] = useState<UserType>();
  const [reduceMotion, setReduceMotion] = useState<boolean>(false);
  const [hasGame, setHasGame] = useState<GameType | null>();

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(mediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      setReduceMotion(event.matches);
    };
    mediaQuery.addEventListener("change", handleChange);

    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, []);

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

        // Check if user has a game in current jam
        const gameResponse = await getCurrentGame();

        if (gameResponse.ok) {
          const gameData = await gameResponse.json();
          console.log("Game Data:", gameData); // Log game data
          console.log("User Data:", user); // Log user data

          if (gameData) {
            // Check if the logged-in user is either the creator or a contributor
            const isContributor =
              gameData.author?.id === user.id || // Check if logged-in user is the author
              gameData.contributors?.some(
                (contributor: UserType) => contributor.id === user.id
              ); // Check if logged-in user is a contributor

            console.log("Is Contributor:", isContributor); // Log whether the user is a contributor

            if (isContributor) {
              setHasGame(gameData); // Set the game data for "My Game"
            } else {
              setHasGame(null); // No game associated with this user
            }
          }
        }

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
    <NavbarBase
      maxWidth="2xl"
      className="bg-[#fff] dark:bg-[#222] p-1 duration-500 ease-in-out transition-color shadow-2xl"
      isBordered
      height={80}
    >
      <div className="absolute -left-36 overflow-hidden h-[90px]">
        <Image
          as={NextImage}
          src="/images/D2J_Icon.png"
          className="min-w-[70px] -z-10 !opacity-5 dark:!opacity-[2%] -top-16"
          alt="Down2Jam logo"
          width={210}
          height={210}
        />
      </div>
      <div className="absolute -right-36 overflow-hidden h-[90px]">
        <Image
          as={NextImage}
          src="/images/D2J_Icon.png"
          className="min-w-[70px] -z-10 !opacity-5 dark:!opacity-[2%] -top-16"
          alt="Down2Jam logo"
          width={210}
          height={210}
        />
      </div>

      {/* Left side navbar items */}
      <NavbarContent justify="start">
        <NavbarBrand className="flex-grow-0 mr-10">
          <Link
            href="/"
            className={`duration-500 ease-in-out transition-all transform ${
              reduceMotion ? "" : "hover:scale-110"
            }`}
          >
            <Image
              as={NextImage}
              src="/images/D2J_Icon.png"
              className="min-w-[70px]"
              alt="Down2Jam logo"
              width={70}
              height={70}
            />
          </Link>
        </NavbarBrand>

        <NavbarButtonLink
          href="/about"
          name="About"
          icon={<Info />}
          iconPosition="start"
        />
        <NavbarButtonLink
          href="/games"
          name="Games"
          icon={<Gamepad />}
          iconPosition="start"
        />
      </NavbarContent>

      <NavbarContent justify="end" className="gap-4">
        <NavbarSearchbar />
        {user && <Divider orientation="vertical" className="h-1/2" />}
        {user && jam && isInJam && (
          <NavbarButtonLink
            important
            icon={<Gamepad2 />}
            name={hasGame ? "My Game" : "Create Game"}
            href={hasGame ? "/games/" + hasGame.slug : "/create-game"}
          />
        )}
        {user && jam && !isInJam && (
          <NavbarButtonAction
            important
            icon={<CalendarPlus />}
            name="Join jam"
            onPress={async () => {
              const currentJamResponse = await getCurrentJam();
              const currentJam = currentJamResponse?.jam;

              if (!currentJam) {
                toast.error("There is no jam to join");
                return;
              }
              if (await joinJam(currentJam.id)) {
                setIsInJam(true);
              }
            }}
          />
        )}
        {user && (
          <NavbarButtonLink
            icon={<SquarePen />}
            name="Create Post"
            href="/create-post"
            important
          />
        )}
        {user && (
          <NavbarButtonLink name="" icon={<Bell />} href="/inbox" isIconOnly />
        )}
        {user && user.mod && (
          <NavbarButtonLink
            name=""
            icon={<Shield />}
            href="/reports"
            isIconOnly
          />
        )}
        <ThemeToggle />
        <Divider orientation="vertical" className="h-1/2" />
        {!user && (
          <NavbarButtonLink
            icon={<LogInIcon />}
            name="Log In"
            href="/login"
            important
          />
        )}
        {!user && (
          <NavbarButtonLink
            icon={<NotebookPen />}
            name="Sign Up"
            href="/signup"
            important
          />
        )}
        {user && <NavbarUser user={user} />}
      </NavbarContent>
    </NavbarBase>
  );
}
