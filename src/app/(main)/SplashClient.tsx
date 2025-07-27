"use client";

import { Button, Spacer } from "@heroui/react";
import { BookCopy, Info, LogIn } from "lucide-react";
import { useTranslations } from "next-intl";
import NextLink from "next/link";
import SplashLogo from "./SplashLogo";
import { useTheme } from "@/providers/SiteThemeProvider";
export default function SplashClient() {
  const t = useTranslations("Splash");
  const { siteTheme } = useTheme();

  return (
    <div className="flex justify-center items-center gap-16 relative z-0 flex-col sm:flex-row text-center sm:text-left">
      <div>
        <h1 className="text-5xl mx-auto sm:mx-0 w-fit font-bold">
          <span
            className="bg-clip-text text-transparent"
            style={{
              backgroundImage: `linear-gradient(to right, ${siteTheme.colors["blue"]}, ${siteTheme.colors["pink"]})`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            {t("Title")}
          </span>
        </h1>
        <p
          className="text-2xl font-semibold transition-all duration-500"
          style={{
            color: siteTheme.colors["text"],
          }}
        >
          {t("Description")}
        </p>
        <p
          className="transition-all duration-500"
          style={{
            color: siteTheme.colors["text"],
            opacity: 0.5,
          }}
        >
          September 5th - 8th
        </p>
        <Spacer y={4} />
        <div className="flex flex-col sm:flex-row flex-wrap gap-2 justify-center sm:justify-start">
          <Button
            variant="ghost"
            style={{
              borderColor: siteTheme.colors["blueDark"],
              color: siteTheme.colors["blue"],
            }}
            as={NextLink}
            href="/signup"
            startContent={<LogIn size={16} />}
          >
            {t("Join")}
          </Button>
          <Button
            variant="ghost"
            as={NextLink}
            href="/about"
            startContent={<Info size={16} />}
            className="border-gray-800 text-white"
          >
            {t("About")}
          </Button>
          <Button
            variant="ghost"
            as={NextLink}
            href="/why"
            startContent={<BookCopy size={16} />}
            className="border-gray-800 text-white"
          >
            {t("Why")}
          </Button>
        </div>
      </div>
      <SplashLogo />
    </div>
  );
}
