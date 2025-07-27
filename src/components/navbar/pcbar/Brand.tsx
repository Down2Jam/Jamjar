"use client";

import { Link } from "@heroui/link";
import { NavbarBrand } from "@heroui/navbar";
import NavbarTooltip from "./NavbarTooltip";
import Hotkey from "../../hotkey";
import { useTranslations } from "next-intl";
import { useTheme } from "@/providers/SiteThemeProvider";
import Logo from "@/components/logo";

export default function Brand({ userLoggedIn }: { userLoggedIn: boolean }) {
  const t = useTranslations("Navbar");
  const { siteTheme } = useTheme();

  return (
    <NavbarBrand className="flex-grow-0 mr-2">
      <NavbarTooltip
        name={t("Home.Title")}
        description={t("Home.Description")}
        hotkey={userLoggedIn ? ["G", "H"] : ["G", "S"]}
      >
        <Link
          href={userLoggedIn ? "/home" : "/"}
          className={`duration-500 ease-in-out transition-all transform flex gap-2 text-white`}
        >
          <Logo width={40} />
          <p className="w-fit text-xl">
            <span
              className="bg-clip-text text-transparent transition-all duration-500"
              style={{
                backgroundImage: `linear-gradient(to right, ${siteTheme.colors["blue"]}, ${siteTheme.colors["pink"]})`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              {t("Brand.Name")}
            </span>
          </p>
          <Hotkey
            href={userLoggedIn ? "/home" : "/"}
            hotkey={userLoggedIn ? ["G", "H"] : ["G", "S"]}
            title={t("Home.Title")}
            description={t("Home.Description")}
          />
        </Link>
      </NavbarTooltip>
    </NavbarBrand>
  );
}
