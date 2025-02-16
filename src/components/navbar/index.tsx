"use client";

import {
    Image,
    Link,
    NavbarBrand,
    Navbar as NavbarBase,
    NavbarContent,
    NavbarMenu,
    NavbarMenuItem,
    NavbarMenuToggle,
    Divider,
    NavbarItem,
    Input,
} from "@nextui-org/react";
import NextImage from "next/image";
import { useEffect, useState } from "react";
import { UserMenu } from "./UserMenu";
import { UserType } from "@/types/UserType";
import { JamType } from "@/types/JamType";
import { GameType } from "@/types/GameType";
import { usePathname } from "next/navigation";
import { hasCookie } from "@/helpers/cookie";
import { getSelf } from "@/requests/user";
import { getCurrentGame } from "@/requests/game";
import { getCurrentJam, joinJam } from "@/helpers/jam";
import { toast } from "react-toastify";
import { menuItems } from "./menuLinks";


export default function Navbar() {
    const [reduceMotion, setReduceMotion] = useState<boolean>(false);
    const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
    const pathname = usePathname();
    const [user, setUser] = useState<UserType | undefined>();
    const [isInJam, setIsInJam] = useState<boolean>();
    const [hasGame, setHasGame] = useState<GameType | null>();

    useEffect(() => {
      loadUser();
      async function loadUser() {
          const jamResponse = await getCurrentJam();
          const currentJam = jamResponse?.jam;
  
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
      }
      }, [pathname]);


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
    
  return (
    <NavbarBase
      maxWidth="2xl"
      className="bg-[#fff] dark:bg-[#222] p-1 duration-500 ease-in-out transition-color"
      isBordered
      height={80}
      isMenuOpen={isMenuOpen} 
      onMenuOpenChange={setIsMenuOpen}
    >
        <NavbarContent className="md:hidden flex-grow-0">
            <NavbarMenuToggle aria-label={isMenuOpen ? "Close menu" : "Open menu"} />
            <NavbarBrand className="flex-grow-0">
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
        </NavbarContent>

        <NavbarContent className="hidden grow md:flex gap-4" justify="start">
            <NavbarBrand className="flex-grow-0">
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

            {menuItems.map((item, index) => (
                <NavbarMenuItem key={`${item.name}-${index}`} isActive>
                    <Link
                    className="w-full dark:text-white"
                    href={item.href}
                    size="lg"
                    >
                    {item.name}
                    </Link>
                </NavbarMenuItem>
                ))}
        </NavbarContent>
        <NavbarContent className="md:flex gap-4" justify="end">
            <NavbarItem>
              <Input
                placeholder="Search"
                classNames={{
                  inputWrapper: "!duration-500 ease-in-out transition-all min-w-[75px]",
                }}
              />
            </NavbarItem>
            <Divider orientation="vertical" className="h-1/2" />
            <UserMenu 
              user={user}
              isInJam={isInJam}
              hasGame={hasGame}
              onJamPress={
                async () => {
                  const currentJamResponse = await getCurrentJam();
                  const currentJam = currentJamResponse?.jam;

                  if (!currentJam) {
                  toast.error("There is no jam to join");
                  return;
                  }
                  if (await joinJam(currentJam.id)) {
                  setIsInJam(true);
                  }
              }
              } />
        </NavbarContent>
        
        {/* Mobile Navigation */}
        <NavbarMenu className="pt-8">
            {menuItems.map((item, index) => (
            <NavbarMenuItem key={`${item.name}-${index}`} isActive>
                <Link
                className={`${menuItems.length - 1 === index && "mb-auto"} w-full dark:text-white`}
                href={item.href}
                size="lg"
                >
                {item.name}
                </Link>
            </NavbarMenuItem>
            ))}
        </NavbarMenu>
    </NavbarBase>
  );
}
