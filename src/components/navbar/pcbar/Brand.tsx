"use client";

import { Image } from "@heroui/image";
import { Link } from "@heroui/link";
import { NavbarBrand } from "@heroui/navbar";
import NextImage from "next/image";
import NavbarTooltip from "./NavbarTooltip";
import Hotkey from "../../hotkey";
import { useTranslations } from "next-intl";

export default function Brand({ userLoggedIn }: { userLoggedIn: boolean }) {
  const t = useTranslations("Navbar");

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
          <Image
            as={NextImage}
            src="/images/D2J_Icon.png"
            className="min-w-[40px]"
            alt={t("Brand.Alt")}
            width={40}
            height={40}
          />
          <p className="w-fit text-xl">
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage: "linear-gradient(to right, #46c2e1, #d84f7b)",
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
