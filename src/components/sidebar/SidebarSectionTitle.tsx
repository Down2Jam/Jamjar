"use client";

import { useTheme } from "@/providers/useSiteTheme";
import { Text } from "bioloom-ui";
import type { ReactNode } from "react";

export default function SidebarSectionTitle({
  children,
}: {
  children: ReactNode;
}) {
  const { siteTheme } = useTheme();
  const isLightTheme = siteTheme.type === "Light";

  return (
    <Text
      size="2xl"
      weight="semibold"
      color="text"
      style={{
        textShadow: isLightTheme
          ? "none"
          : "0 1px 5px rgba(0, 0, 0, 0.75)",
      }}
    >
      {children}
    </Text>
  );
}
