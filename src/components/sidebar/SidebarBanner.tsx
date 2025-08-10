"use client";

import { useTheme } from "@/providers/SiteThemeProvider";
import Banner from "../banner";

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
        <p className="text-6xl">Down2Jam</p>
        <p>The community centered game jam</p>
      </div>
      <Banner width={480} className="z-0 shadow-2xl" />
    </a>
  );
}
