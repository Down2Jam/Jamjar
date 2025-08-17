"use client";

import { useRef } from "react";
import Logo from "@/components/logo";

export default function MobileLogo() {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<SVGSVGElement>(null);

  return (
    <div ref={containerRef} className="block sm:hidden">
      <Logo ref={imageRef} width={128} />
    </div>
  );
}
