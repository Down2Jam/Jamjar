"use client";

import { useTheme } from "@/providers/useSiteTheme";
import { Text } from "bioloom-ui";
import type { ReactNode } from "react";
import useBreakpoint from "@/hooks/useBreakpoint";

export default function SidebarSectionTitle({
  children,
}: {
  children: ReactNode;
}) {
  const { siteTheme } = useTheme();
  const { width, isXlUp } = useBreakpoint();
  const isLightTheme = siteTheme.type === "Light";
  const titleSize = isXlUp ? "2xl" : width >= 1024 ? "xl" : "lg";

  return (
    <Text
      size={titleSize}
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
