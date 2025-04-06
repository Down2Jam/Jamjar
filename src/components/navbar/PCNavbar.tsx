"use client";

import {
  Image,
  Link,
  NavbarBrand,
  Navbar as NavbarBase,
  NavbarContent,
  Divider,
  Badge,
} from "@heroui/react";
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
  Star,
  Users,
} from "lucide-react";
import NextImage from "next/image";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { hasCookie } from "@/helpers/cookie";
import { getCurrentJam, joinJam } from "@/helpers/jam";
import { JamPhase, JamType } from "@/types/JamType";
import { UserType } from "@/types/UserType";
import NavbarUser from "./PCNavbarUser";
import NavbarButtonAction from "./NavbarButtonAction";
import { toast } from "react-toastify";
import ThemeToggle from "../theme-toggle";
import { getSelf } from "@/requests/user";
import { getCurrentGame } from "@/requests/game";
import { GameType } from "@/types/GameType";

export default function PCNavbar() {
  const pathname = usePathname();
  const [jam, setJam] = useState<JamType | null>();
  const [jamPhase, setJamPhase] = useState<JamPhase | null>();
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
        setJamPhase(jamResponse?.phase);

        if (!hasCookie("token")) {
          setUser(undefined);
          return;
        }

        const response = await getSelf();

        const user = await response.json();

        // Check if user has a game in current jam
        const gameResponse = await getCurrentGame();

        if (gameResponse.ok) {
          const gameData = (await gameResponse.json()).data;

          if (gameData && gameData.length > 0) {
            setHasGame(gameData[0]);
          } else {
            setHasGame(null);
          }
        } else {
          setHasGame(null);
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
      style={{
        backgroundImage:
          "url(/images/D2J_Icon_watermark.png), url(/images/D2J_Icon_watermark.png)",
        backgroundPositionY: "center, center",
        backgroundPositionX: "45px, right 45px",
        backgroundSize: "210px",
        backgroundRepeat: "no-repeat",
      }}
      isBordered
      height={80}
    >
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
        {jamPhase == "Upcoming Jam" && (
          <NavbarButtonLink
            href="/results"
            name="Results"
            icon={<Star />}
            iconPosition="start"
          />
        )}
      </NavbarContent>

      <NavbarContent justify="end" className="gap-4">
        <NavbarSearchbar />
        {user && <Divider orientation="vertical" className="h-1/2" />}
        {user &&
          jam &&
          isInJam &&
          (jamPhase == "Jamming" || jamPhase == "Submission") && (
            <NavbarButtonLink
              important
              icon={<Gamepad2 />}
              name={hasGame ? "My Game" : "Create Game"}
              href={hasGame ? "/g/" + hasGame.slug : "/create-game"}
            />
          )}
        {user && jam && isInJam && jamPhase == "Rating" && hasGame && (
          <NavbarButtonLink
            important
            icon={<Gamepad2 />}
            name={"My Game"}
            href={"/g/" + hasGame.slug}
          />
        )}
        {user &&
          jam &&
          isInJam &&
          (jamPhase != "Rating" ||
            user.teams.filter((team) => team.jamId == jam.id).length > 0) && (
            <NavbarButtonLink
              important
              icon={<Users />}
              name={
                user.teams.filter((team) => team.jamId == jam.id).length > 0
                  ? "My Team"
                  : "Team Finder"
              }
              href={
                user.teams.filter((team) => team.jamId == jam.id).length > 0
                  ? "/team"
                  : "/team-finder"
              }
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
        {user &&
          (user.teamInvites.length > 0 ||
          user.ownedTeams.filter((team) => team.applications.length > 0)
            .length > 0 ? (
            <Badge
              content={
                user.teamInvites.length +
                user.ownedTeams.reduce(
                  (prev, curr) => prev + curr.applications.length,
                  0
                )
              }
              color="primary"
              placement="top-right"
            >
              <NavbarButtonLink
                name=""
                icon={<Bell />}
                href="/inbox"
                isIconOnly
              />
            </Badge>
          ) : (
            <NavbarButtonLink
              name=""
              icon={<Bell />}
              href="/inbox"
              isIconOnly
            />
          ))}
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
