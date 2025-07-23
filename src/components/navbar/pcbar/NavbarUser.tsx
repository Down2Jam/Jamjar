"use client";

import {
  Avatar,
  Button,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownSection,
  DropdownTrigger,
  Kbd,
  NavbarItem,
  Spacer,
} from "@heroui/react";
import { UserType } from "@/types/UserType";
import {
  Bug,
  Dice3,
  Heart,
  LogOut,
  Menu,
  Rss,
  Settings,
  User,
} from "lucide-react";
import { redirect } from "next/navigation";
import Hotkey from "../../hotkey";
import { useTranslations } from "next-intl";
import useBreakpoint from "@/hooks/useBreakpoint";

interface NavbarUserProps {
  user?: UserType;
}

export default function NavbarUser({ user }: NavbarUserProps) {
  const t = useTranslations("Navbar");
  const { isSmDown, isMdDown, isLgDown } = useBreakpoint();

  return (
    <NavbarItem>
      {user && (
        <>
          <Hotkey
            hotkey={["G", "P"]}
            onPress={() => redirect(`/u/${user.slug}`)}
            title={t("Profile.Title")}
            description={t("Profile.Description")}
          />
          <Hotkey
            hotkey={["G", "O"]}
            onPress={() => redirect(`/settings`)}
            title={t("Settings.Title")}
            description={t("Settings.Description")}
          />
          <Hotkey
            hotkey={["G", "B"]}
            onPress={() =>
              redirect("https://github.com/Down2Jam/Jamjar/issues")
            }
            title={t("ReportBug.Title")}
            description={t("ReportBug.Description")}
          />
        </>
      )}
      <Dropdown backdrop="opaque">
        <DropdownTrigger>
          {user ? (
            <Avatar
              size="sm"
              src={user.profilePicture}
              className="!duration-500 transition-all cursor-pointer outline-2 outline-[#cacaca] dark:outline-green-300/40 bg-[#fff] dark:bg-[#1d232b]"
              classNames={{
                base: "bg-transparent ",
              }}
            />
          ) : (
            <Button
              className="ml-2 !transition-all !duration-500 w-8 h-8 max-h-8 max-w-8 min-w-8 min-h-8 rounded-full outline-[#e2e1e2] dark:outline-[#1c2c21]"
              variant="faded"
              isIconOnly
            >
              <Menu size={12} />
            </Button>
          )}
        </DropdownTrigger>
        <DropdownMenu>
          <DropdownSection title={user?.name || "Not logged in"}>
            {user ? (
              <>
                <DropdownItem
                  key="profile"
                  className="text-[#333] dark:text-white"
                  startContent={<User size={16} />}
                  onPress={() => redirect(`/u/${user.slug}`)}
                  description={t("Profile.Description")}
                  endContent={<Kbd className="whitespace-nowrap">G P</Kbd>}
                >
                  {t("Profile.Title")}
                </DropdownItem>
                <DropdownItem
                  key="settings"
                  className="text-[#333] dark:text-white"
                  startContent={<Settings size={16} />}
                  onPress={() => redirect("/settings")}
                  description={t("Settings.Description")}
                  endContent={<Kbd className="whitespace-nowrap">G O</Kbd>}
                >
                  {t("Settings.Title")}
                </DropdownItem>
              </>
            ) : (
              <></>
            )}
            {isLgDown ? (
              <>
                <DropdownItem
                  key="donate"
                  className="text-[#333] dark:text-white"
                  startContent={<Heart size={16} />}
                  onPress={() => redirect("/donate")}
                  description={t("Donate.Description")}
                  endContent={<Kbd className="whitespace-nowrap">G D</Kbd>}
                >
                  {t("Donate.Title")}
                </DropdownItem>
                <DropdownItem
                  key="lucky"
                  className="text-[#333] dark:text-white"
                  startContent={<Dice3 size={16} />}
                  onPress={() => redirect("/lucky")}
                  description={t("Lucky.Description")}
                  endContent={<Kbd className="whitespace-nowrap">G L</Kbd>}
                >
                  {t("Lucky.Title")}
                </DropdownItem>
                <DropdownItem
                  key="rss"
                  className="text-[#333] dark:text-white"
                  startContent={<Rss size={16} />}
                  onPress={() => redirect("/rss")}
                  description={t("RSS.Description")}
                  endContent={<Kbd className="whitespace-nowrap">G S</Kbd>}
                >
                  {t("RSS.Title")}
                </DropdownItem>
              </>
            ) : (
              <></>
            )}
            {user ? (
              <DropdownItem
                showDivider
                key="bug"
                className="text-[#333] dark:text-white"
                startContent={<Bug size={16} />}
                onPress={() =>
                  redirect("https://github.com/Down2Jam/Jamjar/issues")
                }
                description={t("ReportBug.Description")}
                endContent={<Kbd className="whitespace-nowrap">G B</Kbd>}
              >
                {t("ReportBug.Title")}
              </DropdownItem>
            ) : (
              <></>
            )}
          </DropdownSection>
          {user ? (
            <DropdownItem
              key="logout"
              color="danger"
              className="text-danger"
              startContent={<LogOut size={16} />}
              onPress={() => redirect("/logout")}
              description={t("Logout.Description")}
            >
              {t("Logout.Title")}
            </DropdownItem>
          ) : (
            <></>
          )}
        </DropdownMenu>
      </Dropdown>
    </NavbarItem>
  );
}
