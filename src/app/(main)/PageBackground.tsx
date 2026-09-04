"use client";

import { useTheme } from "@/providers/useSiteTheme";
import { ReactNode } from "react";

export default function PageBackground({
  children,
}: {
  children: ReactNode | ReactNode[];
}) {
  const { siteTheme } = useTheme();
  const isLightTheme = siteTheme.type === "Light";

  return (
    <div className="relative isolate min-h-screen flex flex-col ease-in-out transition-color duration-500">
      <div
        className="fixed inset-0 z-0 pointer-events-none transition-colors duration-500"
        style={{
          backgroundColor: siteTheme.colors["crust"],
        }}
      >
        <div
          className={`absolute inset-0 bg-cover bg-center bg-no-repeat transition-[filter,opacity] duration-500 ${
            isLightTheme
              ? "opacity-[0.72] sm:opacity-[0.78]"
              : "opacity-30 sm:opacity-40"
          }`}
          style={{
            backgroundImage: "url('/images/sitebg.webp')",
            filter: isLightTheme
              ? "brightness(1.02) saturate(0.8) contrast(0.9)"
              : "brightness(0.68) saturate(0.72) contrast(0.92)",
            transform: "scale(1.01)",
          }}
        />
      </div>
      {children}
    </div>
  );
}
