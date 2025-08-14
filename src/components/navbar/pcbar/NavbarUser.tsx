"use client";

import { Avatar, NavbarItem } from "@heroui/react";
import { UserType } from "@/types/UserType";
import { redirect } from "next/navigation";
import Hotkey from "../../hotkey";
import useBreakpoint from "@/hooks/useBreakpoint";
import Dropdown from "@/framework/Dropdown";
import { Button } from "@/framework/Button";

interface NavbarUserProps {
  user?: UserType;
}

export default function NavbarUser({ user }: NavbarUserProps) {
  const { isLgDown } = useBreakpoint();

  return (
    <NavbarItem className="flex items-center">
      {user && (
        <>
          <Hotkey
            hotkey={["G", "P"]}
            onPress={() => redirect(`/u/${user.slug}`)}
            title="Navbar.Profile.Title"
            description="Navbar.Profile.Description"
          />
          <Hotkey
            hotkey={["G", "O"]}
            onPress={() => redirect(`/settings`)}
            title="Navbar.Settings.Title"
            description="Navbar.Settings.Description"
          />
          <Hotkey
            hotkey={["G", "B"]}
            onPress={() =>
              redirect("https://github.com/Down2Jam/Jamjar/issues")
            }
            title="Navbar.ReportBug.Title"
            description="Navbar.ReportBug.Description"
          />
        </>
      )}

      <Dropdown
        trigger={
          user ? (
            <Avatar
              size="sm"
              src={user.profilePicture}
              className="!duration-500 transition-all cursor-pointer outline-2 outline-[#cacaca] dark:outline-green-300/40 bg-[#fff] dark:bg-[#1d232b]"
              classNames={{
                base: "bg-transparent",
              }}
            />
          ) : (
            <Button
              className="ml-2 !transition-all !duration-500 w-8 h-8 max-h-8 max-w-8 min-w-8 min-h-8 rounded-full outline-[#e2e1e2] dark:outline-[#1c2c21]"
              icon="menu"
            ></Button>
          )
        }
      >
        {user ? (
          <>
            <Dropdown.Item
              value="profile"
              icon="user"
              description="Navbar.Profile.Description"
              href={`/u/${user.slug}`}
              kbd="G P"
            >
              Navbar.Profile.Title
            </Dropdown.Item>
            <Dropdown.Item
              value="settings"
              icon="settings"
              description="Navbar.Settings.Description"
              href="/settings"
              kbd="G O"
            >
              Navbar.Settings.Title
            </Dropdown.Item>
          </>
        ) : (
          <></>
        )}
        {isLgDown ? (
          <>
            <Dropdown.Item
              value="donate"
              icon="heart"
              href="/donate"
              description="Navbar.Donate.Description"
              kbd="G D"
            >
              Navbar.Donate.Title
            </Dropdown.Item>
            <Dropdown.Item
              value="lucky"
              icon="dice3"
              href="/lucky"
              description="Navbar.Lucky.Description"
              kbd="G L"
            >
              Navbar.Lucky.Title
            </Dropdown.Item>
            <Dropdown.Item
              value="rss"
              icon="rss"
              href="/rss"
              description="Navbar.RSS.Description"
              kbd="G S"
            >
              Navbar.RSS.Title
            </Dropdown.Item>
          </>
        ) : (
          <></>
        )}
        {user ? (
          <Dropdown.Item
            value="bug"
            icon="bug"
            href="https://github.com/Down2Jam/Jamjar/issues"
            description="Navbar.ReportBug.Description"
            kbd="G B"
          >
            Navbar.ReportBug.Title
          </Dropdown.Item>
        ) : (
          <></>
        )}
        {user ? (
          <Dropdown.Item
            value="logout"
            icon="logout"
            href="/logout"
            description="Navbar.Logout.Description"
          >
            Navbar.Logout.Title
          </Dropdown.Item>
        ) : (
          <></>
        )}
      </Dropdown>
    </NavbarItem>
  );
}
