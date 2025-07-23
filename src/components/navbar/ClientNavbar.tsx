"use client";

import useBreakpoint from "@/hooks/useBreakpoint";
import PCbar from "./pcbar";
import useHasMounted from "@/hooks/useHasMounted";
import Mobilebar from "./mobilebar/Mobilebar";

type ClientNavbarProps = {
  isLoggedIn: boolean;
  languages: any;
};

export default function ClientNavbar({
  isLoggedIn,
  languages,
}: ClientNavbarProps) {
  const { isMobile } = useBreakpoint();
  const hasMounted = useHasMounted();

  if (!hasMounted) return null; // prevent hydration mismatch

  return (
    <div>
      {isMobile ? (
        <Mobilebar isLoggedIn={isLoggedIn} />
      ) : (
        <PCbar isLoggedIn={isLoggedIn} languages={languages} />
      )}
    </div>
  );
}
