"use client";

import useBreakpoint from "@/hooks/useBreakpoint";
import { lazy, Suspense } from "react";
import useHasMounted from "@/hooks/useHasMounted";
import Mobilebar from "./mobilebar/Mobilebar";
import { LanguageInfo } from "@/types/LanguageInfoType";

// Mobile navigation does not need the desktop menus and theme previews.
const PCbar = lazy(() => import("./pcbar"));

type ClientNavbarProps = {
  isLoggedIn: boolean;
  languages: LanguageInfo[];
};

export default function ClientNavbar({
  isLoggedIn,
  languages,
}: ClientNavbarProps) {
  const { isMobile } = useBreakpoint();
  const hasMounted = useHasMounted();

  if (!hasMounted) return null; // prevent hydration mismatch

  return (
    <div className={isMobile ? undefined : "h-16 shrink-0"}>
      {isMobile ? (
        <Mobilebar isLoggedIn={isLoggedIn} />
      ) : (
        <Suspense fallback={null}>
          <PCbar isLoggedIn={isLoggedIn} languages={languages} />
        </Suspense>
      )}
    </div>
  );
}
