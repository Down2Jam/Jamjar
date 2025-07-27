"use client";

import { useTheme } from "@/providers/SiteThemeProvider";
import { ReactNode } from "react";

export default function PageBackground({
  children,
}: {
  children: ReactNode | ReactNode[];
}) {
  const { siteTheme } = useTheme();

  return (
    <div
      className="min-h-screen flex flex-col ease-in-out transition-color duration-500"
      style={{
        backgroundColor: siteTheme.colors["mantle"],
      }}
    >
      <div
        className="fixed top-0 left-0 w-screen h-screen opacity-10 dark:opacity-5 pointer-events-none"
        style={{
          backgroundImage: `repeating-linear-gradient(135deg, ${siteTheme.colors["mantle"]} 0px, ${siteTheme.colors["mantle"]} 40px, ${siteTheme.colors["crust"]} 40px, ${siteTheme.colors["crust"]} 80px)`,
        }}
      />
      {children}
    </div>
  );
}
