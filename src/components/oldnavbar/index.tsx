"use client";

import { useEffect, useState } from "react";
import PCNavbar from "./PCNavbar";
import MobileNavbar from "./MobileNavbar";

export default function Navbar() {
  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return isMobile ? <MobileNavbar /> : <PCNavbar />;
}
