"use client";

import {
  addToast,
  Avatar,
  Button,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Navbar,
  NavbarItem,
} from "@heroui/react";
import {
  Bell,
  Bug,
  Gamepad,
  Home,
  Languages,
  LogIn,
  Menu,
  Search,
  Settings,
  Trophy,
} from "lucide-react";
import { redirect } from "next/navigation";
import NextLink from "next/link";
import { useScrollDirection } from "@/hooks/useScrollDirection";

type MobilebarProps = {
  isLoggedIn: boolean;
};

export default function Mobilebar({ isLoggedIn }: MobilebarProps) {
  const direction = useScrollDirection();
  const hidden = direction === "down";

  return (
    <Navbar
      className={`${
        hidden ? "translate-y-full" : "translate-y-0"
      } border-t-2 fixed !top-auto bottom-0 left-0 right-0 z-50 bg-white dark:bg-black p-1 duration-500 ease-in-out transition-color shadow-2xl`}
      style={{
        backgroundImage:
          "url(/images/D2J_Icon_watermark.png), url(/images/D2J_Icon_watermark.png)",
        backgroundPositionY: "center, center",
        backgroundPositionX: "0px, right 0px",
        backgroundSize: "210px",
        backgroundRepeat: "no-repeat",
      }}
      isBordered
      height={60}
    >
      <Button isIconOnly variant="bordered" as={NextLink} href="/">
        <Home />
      </Button>
      <Button isIconOnly variant="bordered" as={NextLink} href="/games">
        <Gamepad />
      </Button>
      <Dropdown className="bg-white dark:bg-black">
        <DropdownTrigger>
          {isLoggedIn ? (
            <Avatar src="" size="lg" />
          ) : (
            <Button
              className="w-14 h-14 max-h-14 max-w-14 min-w-14 min-h-1 rounded-full"
              variant="faded"
            >
              <Menu />
            </Button>
          )}
        </DropdownTrigger>
        <DropdownMenu>
          <DropdownItem
            key="results"
            startContent={<Trophy size={16} />}
            className="text-[#333] dark:text-white"
            onPress={() => redirect("/results")}
          >
            Results
          </DropdownItem>
          <DropdownItem
            key="language"
            startContent={<Languages size={16} />}
            className="text-[#333] dark:text-white"
          >
            Language
          </DropdownItem>
          {/* <DropdownItem
            key="profile"
            className="text-[#333] dark:text-white"
            startContent={<User size={16} />}
            onPress={() => redirect(`/u/${user.slug}`)}
          >
            Profile
          </DropdownItem> */}
          <DropdownItem
            key="settings"
            className="text-[#333] dark:text-white"
            startContent={<Settings size={16} />}
            onPress={() => redirect("/settings")}
          >
            Settings
          </DropdownItem>
          <DropdownItem
            key="bug"
            className="text-[#333] dark:text-white"
            startContent={<Bug size={16} />}
            onPress={() =>
              redirect("https://github.com/Down2Jam/Jamjar/issues")
            }
          >
            Report Bug
          </DropdownItem>
        </DropdownMenu>
      </Dropdown>
      <NavbarItem>
        <Button
          isIconOnly
          variant="bordered"
          onPress={() => {
            addToast({
              title: "Mobile search coming soon",
              color: "warning",
              variant: "bordered",
              timeout: 3000,
            });
          }}
        >
          <Search />
        </Button>
      </NavbarItem>
      <NavbarItem>
        {!isLoggedIn ? (
          <Button isIconOnly variant="bordered" as={NextLink} href="/signup">
            <LogIn />
          </Button>
        ) : (
          <Button isIconOnly variant="bordered" as={NextLink} href="/inbox">
            <Bell />
          </Button>
        )}
      </NavbarItem>
    </Navbar>
  );
}
