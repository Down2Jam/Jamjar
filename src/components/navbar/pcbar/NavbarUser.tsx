"use client";

import { Avatar, NavbarItem } from "bioloom-ui";
import { UserType } from "@/types/UserType";
import { redirect } from "@/compat/next-navigation";
import Hotkey from "../../hotkey";
import { Dropdown } from "bioloom-ui";
import { Button } from "bioloom-ui";
import type { ReactNode } from "react";

interface NavbarUserProps {
  user?: UserType;
  showResponsiveShortcuts: boolean;
  showThemesLink: boolean;
  coloredOverflowItems?: ReactNode;
}

export default function NavbarUser({
  user,
  showResponsiveShortcuts,
  showThemesLink,
  coloredOverflowItems,
}: NavbarUserProps) {
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
            hotkey={["G", "U"]}
            onPress={() => redirect(`/import-game`)}
            title="Import Game"
            description="Import a game from itch.io"
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
              size={32}
              src={user.profilePicture}
              className="cursor-pointer !border-0 transition-all duration-300"
            />
          ) : (
            <Button
              className="ml-2 !transition-all !duration-500 w-8 h-8 max-h-8 max-w-8 min-w-8 min-h-8 rounded-full outline-[#e2e1e2] dark:outline-[#1c2c21]"
              icon="menu"
              variant="ghost"
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
            <Dropdown.Item
              value="import-game"
              icon="download"
              description="Import a game from itch.io"
              href="/import-game"
              kbd="G U"
            >
              Import Game
            </Dropdown.Item>
          </>
        ) : (
          <></>
        )}
        {showThemesLink && (
          <Dropdown.Item
            value="themes"
            icon="palette"
            href="/themes"
            description="Browse all community site themes"
            kbd="G Y"
          >
            Browse all themes
          </Dropdown.Item>
        )}
        {coloredOverflowItems}
        {showResponsiveShortcuts ? (
          <>
            <Dropdown.Item
              value="screenshots"
              icon="images"
              href="/screenshots"
              description="Navbar.Screenshots.Description"
              kbd="G S"
            >
              Navbar.Screenshots.Title
            </Dropdown.Item>
            <Dropdown.Item
              value="radio"
              icon="broadcast"
              href="/radio"
              description="Navbar.Radio.Description"
              kbd="G B"
            >
              Navbar.Radio.Title
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
              value="news"
              icon="megaphone"
              href="/news"
              description="Navbar.News.Description"
              kbd="G W"
            >
              Navbar.News.Title
            </Dropdown.Item>
            <Dropdown.Item
              value="music"
              icon="music"
              href="/music"
              description="Navbar.Music.Description"
              kbd="G M"
            >
              Navbar.Music.Title
            </Dropdown.Item>
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
