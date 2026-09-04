"use client";

import { useState } from "react";

const HOME_BANNERS = [
  "/images/D2J_Home_Banner.webp",
  "/images/D2J_Home_Banner_Attracts_Devs.webp",
  "/images/D2J_Home_Banner_Cat.webp",
] as const;

export default function SidebarBanner() {
  const [banner] = useState(
    () =>
      HOME_BANNERS[Math.floor(Math.random() * HOME_BANNERS.length)] ??
      HOME_BANNERS[0],
  );

  return (
    <a href="/about">
      <img
        src={banner}
        alt="D2 Jam — the community centered jam"
        width={480}
        height={160}
        className="rounded-xl shadow-2xl"
      />
    </a>
  );
}
