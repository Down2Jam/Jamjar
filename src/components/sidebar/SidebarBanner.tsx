"use client";

import { useTheme } from "@/providers/SiteThemeProvider";
import Banner from "../banner";
import Text from "@/framework/Text";

export default function SidebarBanner() {
  const { colors } = useTheme();

  return (
    <a href="/about">
      <div
        className="absolute z-10 flex items-center justify-center w-[480px] h-[160px] flex-col"
        style={{
          color: colors["textLight"],
        }}
      >
        <Text size="6xl">Splash.Title</Text>
        <Text>Splash.Description</Text>
      </div>
      <Banner width={480} className="z-0 shadow-2xl" />
    </a>
  );
}
