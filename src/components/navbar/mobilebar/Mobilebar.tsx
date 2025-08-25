"use client";

import { addToast, Navbar, NavbarItem } from "@heroui/react";
import { redirect, usePathname } from "next/navigation";
import { useScrollDirection } from "@/hooks/useScrollDirection";
import { Button } from "@/framework/Button";
import { useTheme } from "@/providers/SiteThemeProvider";
import Dropdown from "@/framework/Dropdown";
import { Avatar } from "@/framework/Avatar";
import { getSelf } from "@/requests/user";
import { hasCookie } from "@/helpers/cookie";
import { useEffect, useState } from "react";
import { UserType } from "@/types/UserType";

type MobilebarProps = {
  isLoggedIn: boolean;
};

export default function Mobilebar({ isLoggedIn }: MobilebarProps) {
  const direction = useScrollDirection();
  const hidden = direction === "down";
  const { colors } = useTheme();

  const [user, setUser] = useState<UserType>();
  const pathname = usePathname();

  useEffect(() => {
    loadData();
    async function loadData() {
      try {
        if (!hasCookie("token")) {
          setUser(undefined);
          return;
        }
        const response = await getSelf();
        const user = await response.json();
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
    <Navbar
      className={`${
        hidden ? "translate-y-full" : "translate-y-0"
      } border-t-2 fixed !top-auto bottom-0 left-0 right-0 z-50 p-1 duration-500 ease-in-out transition-color shadow-2xl`}
      style={{
        backgroundImage:
          "url(/images/D2J_Icon_watermark.png), url(/images/D2J_Icon_watermark.png)",
        backgroundPositionY: "center, center",
        backgroundPositionX: "0px, right 0px",
        backgroundSize: "210px",
        backgroundRepeat: "no-repeat",
        backgroundColor: colors["crust"],
      }}
      isBordered
      height={60}
    >
      <Button href="/" icon="home"></Button>
      <Button href="/games" icon="gamepad"></Button>
      <Dropdown
        position="top"
        trigger={
          user ? (
            <Avatar src={user.profilePicture} />
          ) : (
            <Button
              className="w-14 h-14 max-h-14 max-w-14 min-w-14 min-h-1 rounded-full"
              icon="menu"
            ></Button>
          )
        }
      >
        <Dropdown.Item
          key="results"
          icon="trophy"
          onClick={() => redirect("/results")}
        >
          Results
        </Dropdown.Item>
        {user && (
          <Dropdown.Item
            key="profile"
            icon="user"
            onClick={() => redirect(`/u/${user.slug}`)}
          >
            Profile
          </Dropdown.Item>
        )}
        {user && (
          <Dropdown.Item
            key="settings"
            className="text-[#333] dark:text-white"
            icon="cog"
            onClick={() => redirect("/settings")}
          >
            Settings
          </Dropdown.Item>
        )}
        <Dropdown.Item
          key="bug"
          className="text-[#333] dark:text-white"
          icon="bug"
          onClick={() => redirect("https://github.com/Down2Jam/Jamjar/issues")}
        >
          Report Bug
        </Dropdown.Item>
      </Dropdown>
      <NavbarItem>
        <Button
          onClick={() => {
            addToast({
              title: "Mobile search coming soon",
              color: "warning",
              variant: "bordered",
              timeout: 3000,
            });
          }}
          icon="search"
        />
      </NavbarItem>
      <NavbarItem>
        {!isLoggedIn ? (
          <Button href="/signup" icon="login" />
        ) : (
          <Button href="/inbox" icon="bell" />
        )}
      </NavbarItem>
    </Navbar>
  );
}
