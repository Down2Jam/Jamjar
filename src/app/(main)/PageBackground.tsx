"use client";

import { useTheme } from "@/providers/useSiteTheme";
import { ReactNode } from "react";

export default function PageBackground({
  children,
}: {
  children: ReactNode | ReactNode[];
}) {
  const { siteTheme } = useTheme();

  return (
    <div className="min-h-screen flex flex-col ease-in-out transition-color duration-500">
      <div
        className="fixed top-0 left-0 w-screen h-screen pointer-events-none z-10"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0, 0, 0, 0.18), rgba(0, 0, 0, 0.18)), url('/images/sitebg.png')",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          backgroundSize: "cover",
        }}
      />
      {children}
    </div>
  );
}
